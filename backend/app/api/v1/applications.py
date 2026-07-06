import os
import uuid
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.api import deps
from app.models.user import User
from app.models.service import Service, ServiceRequirement
from app.models.application import Application, Document, ApplicationDocument
from app.schemas.application import (
    ApplicationResponse,
    ApplicationDetailResponse,
    ApplicationCreate,
    ChecklistResponse,
    ChecklistItem
)
from app.services.verification import verify_document_pipeline

router = APIRouter()

@router.get("", response_model=List[ApplicationResponse])
def read_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get all active applications for the authenticated user.
    """
    return db.query(Application).filter(Application.user_id == current_user.id).all()

@router.post("", response_model=ApplicationDetailResponse)
def create_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Initialize a service application tracking workspace.
    Generates placeholder ApplicationDocument links for each required document.
    """
    service = db.query(Service).filter(Service.id == app_in.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Check if user already has an active application for this service
    existing_app = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.service_id == service.id,
        Application.status != "verified"
    ).first()
    
    if existing_app:
        # Return existing application rather than creating duplicate
        return existing_app

    app = Application(
        user_id=current_user.id,
        service_id=service.id,
        status="draft"
    )
    db.add(app)
    db.flush()  # get app ID

    # Create empty placeholders for each requirement
    requirements = db.query(ServiceRequirement).filter(ServiceRequirement.service_id == service.id).all()
    for req in requirements:
        app_doc = ApplicationDocument(
            application_id=app.id,
            requirement_id=req.id,
            document_id=None,
            verification_status="missing"
        )
        db.add(app_doc)
        
    db.commit()
    db.refresh(app)
    return app

@router.get("/{id}", response_model=ApplicationDetailResponse)
def read_application(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Read single application details.
    """
    app = db.query(Application).filter(Application.id == id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application tracking workflow not found")
    return app

@router.get("/{id}/checklist", response_model=ChecklistResponse)
def read_application_checklist(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Build and return the dynamic missing/valid document checklist and application progress.
    """
    app = db.query(Application).filter(Application.id == id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application tracking workflow not found")

    # Get requirements
    requirements = db.query(ServiceRequirement).filter(ServiceRequirement.service_id == app.service_id).all()
    
    # Get uploaded documents map
    app_docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == id).all()
    app_docs_map = {ad.requirement_id: ad for ad in app_docs}

    checklist_items = []
    total_mandatory = 0
    valid_mandatory = 0
    next_steps = []

    for req in requirements:
        is_mandatory = req.is_mandatory
        if is_mandatory:
            total_mandatory += 1
            
        app_doc = app_docs_map.get(req.id)
        
        status = "missing"
        error_details = None
        last_uploaded_at = None
        doc_id = None

        if app_doc:
            status = app_doc.verification_status
            error_details = app_doc.verification_error_details
            verified_at = app_doc.verified_at
            
            if app_doc.document:
                doc_id = app_doc.document_id
                last_uploaded_at = app_doc.document.created_at
                
            if status == "valid" and is_mandatory:
                valid_mandatory += 1

        checklist_items.append(
            ChecklistItem(
                requirement_id=req.id,
                doc_type_required=req.doc_type_required,
                is_mandatory=is_mandatory,
                description=req.description,
                status=status,
                error_details=error_details,
                last_uploaded_at=last_uploaded_at,
                document_id=doc_id
            )
        )

        if status == "missing":
            next_steps.append(f"Upload {req.doc_type_required}")
        elif status in ["expired", "invalid", "unreadable"]:
            next_steps.append(f"Re-upload valid {req.doc_type_required} (Last upload was {status})")

    # Compute progress percentage
    progress = 0.0
    if total_mandatory > 0:
        progress = (valid_mandatory / total_mandatory) * 100.0

    if not next_steps:
        next_steps.append("All mandatory documents verified! Proceed to submit on the official government website.")

    return ChecklistResponse(
        application_id=app.id,
        service_name=app.service.name,
        progress_percentage=round(progress, 1),
        checklist=checklist_items,
        next_steps=next_steps
    )

@router.post("/{id}/upload")
def upload_document(
    id: int,
    requirement_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload a document file, link it to the application requirement, and trigger OCR + Gemini verification.
    """
    app = db.query(Application).filter(Application.id == id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application tracking workflow not found")

    # Check if the requirement exists and is part of this service
    requirement = db.query(ServiceRequirement).filter(
        ServiceRequirement.id == requirement_id,
        ServiceRequirement.service_id == app.service_id
    ).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Service requirement not found for this service")

    # Create local file path
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # Create Document record
    statinfo = os.stat(file_path)
    document = Document(
        user_id=current_user.id,
        file_path=file_path,
        original_filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        file_size=statinfo.st_size,
        ocr_status="pending"
    )
    db.add(document)
    db.flush()

    # Find or create application document map
    app_doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.application_id == app.id,
        ApplicationDocument.requirement_id == requirement.id
    ).first()

    if not app_doc:
        app_doc = ApplicationDocument(
            application_id=app.id,
            requirement_id=requirement.id,
            document_id=document.id,
            verification_status="pending"
        )
        db.add(app_doc)
    else:
        # Update link with new file
        app_doc.document_id = document.id
        app_doc.verification_status = "pending"
        app_doc.verification_error_details = None
        app_doc.verified_at = None

    db.commit()
    db.refresh(app_doc)

    # Add verification pipeline to background tasks so it does not block API response
    background_tasks.add_task(verify_document_pipeline, db, app_doc.id)

    return {"message": "Document uploaded successfully. Verification started.", "document_id": document.id}
