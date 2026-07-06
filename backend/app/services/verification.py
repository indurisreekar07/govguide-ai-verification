import datetime
from sqlalchemy.orm import Session
from app.models.application import Document, ApplicationDocument, Application
from app.models.user import User
from app.models.service import ServiceRequirement
from app.services.ocr import extract_text_from_image
from app.services.gemini import parse_document_text, ExtractedDocumentInfo

def levenshtein_ratio(s1: str, s2: str) -> float:
    """
    Computes Levenshtein ratio between two strings.
    """
    s1 = s1.lower().strip()
    s2 = s2.lower().strip()
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 1.0
        
    rows = len(s1) + 1
    cols = len(s2) + 1
    distance = [[0 for _ in range(cols)] for _ in range(rows)]
    
    for i in range(1, rows):
        distance[i][0] = i
    for k in range(1, cols):
        distance[0][k] = k
        
    for col in range(1, cols):
        for row in range(1, rows):
            if s1[row-1] == s2[col-1]:
                cost = 0
            else:
                cost = 2
            distance[row][col] = min(
                distance[row-1][col] + 1,      # Deletion
                distance[row][col-1] + 1,      # Insertion
                distance[row-1][col-1] + cost  # Substitution
            )
                                 
    ratio = ((len(s1) + len(s2)) - distance[rows-1][cols-1]) / (len(s1) + len(s2))
    return ratio

def verify_document_pipeline(
    db: Session,
    application_document_id: int
) -> ApplicationDocument:
    """
    Core Pipeline:
    1. Retrieve application document link details
    2. Extract text with OCR
    3. Call Gemini to parse details
    4. Match fields against requirements and User profile
    5. Save results to DB
    """
    app_doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == application_document_id).first()
    if not app_doc or not app_doc.document:
        raise ValueError("Valid ApplicationDocument record with linked file required.")

    doc = app_doc.document
    user = db.query(User).filter(User.id == doc.user_id).first()
    requirement = db.query(ServiceRequirement).filter(ServiceRequirement.id == app_doc.requirement_id).first()

    # Step 1: Run OCR
    try:
        doc.ocr_status = "processing"
        db.commit()
        
        extracted_text = extract_text_from_image(doc.file_path)
        doc.extracted_text = extracted_text
        doc.ocr_status = "success"
    except Exception as e:
        doc.ocr_status = "failed"
        app_doc.verification_status = "unreadable"
        app_doc.verification_error_details = f"OCR failed to read the document image: {str(e)}"
        db.commit()
        return app_doc

    # Step 2: Parse text with Gemini
    try:
        parsed_info = parse_document_text(extracted_text)
    except Exception as e:
        app_doc.verification_status = "invalid"
        app_doc.verification_error_details = f"AI parser was unable to extract document details: {str(e)}"
        db.commit()
        return app_doc

    # Step 3: Run Verification Rules
    status = "valid"
    errors = []

    # Check readability
    if not parsed_info.is_readable:
        status = "unreadable"
        errors.append("Document image is blurry or unreadable.")

    # Match document type
    # Normalize comparison (e.g. "Aadhaar Card" vs "Aadhaar")
    req_type = requirement.doc_type_required.lower()
    ext_type = parsed_info.document_type.lower()
    
    if req_type not in ext_type and ext_type not in req_type and parsed_info.document_type != "Unknown Document":
        status = "invalid"
        errors.append(f"Document type mismatch. Expected '{requirement.doc_type_required}', but detected '{parsed_info.document_type}'.")

    # Match Name (Fuzzy matching)
    if parsed_info.holder_name:
        match_score = levenshtein_ratio(user.full_name, parsed_info.holder_name)
        if match_score < 0.75:  # Tolerance threshold
            status = "invalid"
            errors.append(f"Holder name mismatch. User profile is '{user.full_name}', but document has '{parsed_info.holder_name}' (Fuzzy match: {int(match_score*100)}%).")
    else:
        # If name is missing and it's a personal ID document
        if requirement.doc_type_required in ["Aadhaar Card", "PAN Card", "Passport"]:
            status = "invalid"
            errors.append("Holder name could not be found on the uploaded document.")

    # Check Expiration
    if parsed_info.expiry_date:
        try:
            exp_date = datetime.datetime.strptime(parsed_info.expiry_date, "%Y-%m-%d").date()
            if exp_date < datetime.date.today():
                status = "expired"
                errors.append(f"Document has expired on {parsed_info.expiry_date}.")
        except Exception:
            # Date parse issue
            pass

    # Save results
    app_doc.verification_status = status
    app_doc.verification_error_details = " | ".join(errors) if errors else None
    app_doc.verified_at = datetime.datetime.utcnow()
    db.commit()

    # Re-evaluate overall application status
    update_application_status(db, app_doc.application_id)

    return app_doc

def update_application_status(db: Session, application_id: int):
    """
    Update overall application status based on mandatory documents.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return

    # Check all requirements
    app_docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == application_id).all()
    
    # We check if there are any mandatory documents that are NOT "valid"
    mandatory_reqs = db.query(ServiceRequirement).filter(
        ServiceRequirement.service_id == app.service_id,
        ServiceRequirement.is_mandatory == True
    ).all()
    
    mandatory_ids = {r.id for r in mandatory_reqs}
    valid_ids = {ad.requirement_id for ad in app_docs if ad.verification_status == "valid"}

    # If all mandatory requirements have a valid document
    if mandatory_ids.issubset(valid_ids):
        app.status = "verified"
    else:
        # Check if there are any invalid/expired/unreadable documents uploaded
        has_errors = any(ad.verification_status in ["invalid", "expired", "unreadable"] for ad in app_docs)
        if has_errors:
            app.status = "rejected"
        else:
            app.status = "pending"
            
    db.commit()
