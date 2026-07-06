import sys
import os
# Add the project root to python path to run seed directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.service import (
    Service,
    ServiceRequirement,
    EligibilityRule,
    ApplicationStep,
    ServiceFAQ,
    CommonRejectionReason,
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if database is already seeded
        if db.query(Service).first():
            print("Database already contains service data. Skipping seeding.")
            return

        print("Seeding database...")

        # 1. Create Admin & Standard Users
        admin_user = User(
            email="admin@govguide.ai",
            hashed_password=pwd_context.hash("admin123"),
            full_name="GovGuide Admin",
            is_admin=True
        )
        test_user = User(
            email="test@example.com",
            hashed_password=pwd_context.hash("user123"),
            full_name="Dhanush Kumar",
            is_admin=False
        )
        db.add(admin_user)
        db.add(test_user)
        db.commit()

        # 2. Seed Services
        services_data = [
            {
                "name": "Passport",
                "slug": "passport",
                "description": "Apply for a fresh Indian passport or renew an existing passport for international travel.",
                "official_url": "https://passportindia.gov.in",
                "fees_description": "Rs. 1,500 (36 pages) / Rs. 2,000 (60 pages)",
                "processing_time": "15 to 30 days (Normal) / 1 to 3 days (Tatkaal)",
                "requirements": [
                    {"doc_type_required": "Aadhaar Card", "is_mandatory": True, "description": "Acts as Proof of Identity & Address."},
                    {"doc_type_required": "Birth Certificate", "is_mandatory": True, "description": "Proof of Date of Birth (Aadhaar or Matriculation certificate also accepted)."},
                    {"doc_type_required": "Address Proof", "is_mandatory": True, "description": "Electricity bill, water bill, or rent agreement matching current address."}
                ],
                "rules": [
                    {"rule_description": "Applicant must be a citizen of India.", "condition_type": "citizenship"},
                    {"rule_description": "Applicant must be at least 18 years old for an adult passport, otherwise a minor application is required.", "condition_type": "age"}
                ],
                "steps": [
                    {"step_number": 1, "step_title": "Portal Registration", "step_description": "Register on the official Passport Seva portal and login.", "is_online": True},
                    {"step_number": 2, "step_title": "Fill Form", "step_description": "Select application type (Fresh/Reissue, Normal/Tatkaal) and fill out the detailed form.", "is_online": True},
                    {"step_number": 3, "step_title": "Payment & Booking", "step_description": "Pay the application fee online and schedule an appointment at the nearest Passport Seva Kendra (PSK).", "is_online": True},
                    {"step_number": 4, "step_title": "PSK Visit", "step_description": "Visit the selected PSK with all original documents for biometrics and document verification.", "is_online": False},
                    {"step_number": 5, "step_title": "Police Verification", "step_description": "Local police officers will verify your address and clean record.", "is_online": False},
                    {"step_number": 6, "step_title": "Delivery", "step_description": "Passport is printed and dispatched via Speed Post.", "is_online": False}
                ],
                "faqs": [
                    {"question": "Can I use my Voter ID instead of Aadhaar?", "answer": "Yes, Voter ID can be used as proof of address/identity, but Aadhaar remains preferred for faster processing."},
                    {"question": "Is police verification mandatory?", "answer": "Yes, standard applications require police verification, which happens either pre- or post-passport issuance."}
                ],
                "rejections": [
                    {"reason_title": "Spelling Mismatch in Name", "reason_description": "The spelling of the name differs across Aadhaar, Birth Certificate, or Address proof.", "mitigation_steps": "Correct names in Aadhaar or Birth Certificate to match exactly before applying."},
                    {"reason_title": "Invalid Proof of Address", "reason_description": "The electricity bill or rent agreement is in someone else's name, or expired.", "mitigation_steps": "Provide an address proof explicitly in your name or your parent's/spouse's name."}
                ]
            },
            {
                "name": "PAN Card",
                "slug": "pan-card",
                "description": "Apply for a Permanent Account Number (PAN) card required for major financial transactions, filing income tax returns, and opening bank accounts.",
                "official_url": "https://www.onlineservices.nsdl.com",
                "fees_description": "Rs. 107 for Indian communication address (physical card + e-PAN)",
                "processing_time": "10 to 15 days",
                "requirements": [
                    {"doc_type_required": "Aadhaar Card", "is_mandatory": True, "description": "Proof of identity, address, and date of birth."},
                    {"doc_type_required": "Passport Photo", "is_mandatory": True, "description": "Recent passport size photograph (white background)."}
                ],
                "rules": [
                    {"rule_description": "Any individual, company, or trust is eligible. No minimum age limit.", "condition_type": "general"}
                ],
                "steps": [
                    {"step_number": 1, "step_title": "Select Application", "step_description": "Visit NSDL/UTITSL website and select Form 49A (Indian Citizens).", "is_online": True},
                    {"step_number": 2, "step_title": "Fill Details", "step_description": "Fill personal details, names of parents, and contact details.", "is_online": True},
                    {"step_number": 3, "step_title": "Pay Fee", "step_description": "Complete online payment using Net Banking, Card, or UPI.", "is_online": True},
                    {"step_number": 4, "step_title": "e-KYC Authentication", "step_description": "Authenticate via Aadhaar OTP to complete the process completely paperless.", "is_online": True}
                ],
                "faqs": [
                    {"question": "Can minors apply for PAN?", "answer": "Yes, parents can apply on behalf of their minor child. The minor's Aadhaar is required."}
                ],
                "rejections": [
                    {"reason_title": "Signature Mismatch / Quality", "reason_description": "Signature uploaded is cut off, blurry, or matches poorly.", "mitigation_steps": "Sign clearly in black ink on a plain white paper and scan at a high resolution."}
                ]
            },
            {
                "name": "Aadhaar Update",
                "slug": "aadhaar-update",
                "description": "Request online or offline demographic update (name, address, date of birth, gender, mobile number) on your Aadhaar card.",
                "official_url": "https://myaadhaar.uidai.gov.in",
                "fees_description": "Rs. 50 (Demographic) / Rs. 100 (Biometric)",
                "processing_time": "5 to 30 days",
                "requirements": [
                    {"doc_type_required": "Address Proof", "is_mandatory": True, "description": "Utility bill, rent agreement, bank statement, or voter ID showing the new address."}
                ],
                "rules": [
                    {"rule_description": "Must be an Indian resident with an active existing Aadhaar card.", "condition_type": "residency"}
                ],
                "steps": [
                    {"step_number": 1, "step_title": "Login with Aadhaar", "step_description": "Login to myAadhaar portal using Aadhaar number and OTP.", "is_online": True},
                    {"step_number": 2, "step_title": "Select Fields to Update", "step_description": "Select demographic field (e.g. Address) and enter updated details.", "is_online": True},
                    {"step_number": 3, "step_title": "Upload Document", "step_description": "Upload a scanned color copy of the valid proof document.", "is_online": True},
                    {"step_number": 4, "step_title": "Payment", "step_description": "Pay non-refundable fee of Rs. 50 using card/UPI.", "is_online": True}
                ],
                "faqs": [
                    {"question": "How many times can I update my name?", "answer": "Name updates are allowed only twice in a lifetime under normal circumstances."}
                ],
                "rejections": [
                    {"reason_title": "Black and White scan", "reason_description": "Uploaded address proof is a photocopy/black & white scan which is not allowed.", "mitigation_steps": "Upload original color scan of the document (PDF/JPEG)."}
                ]
            }
        ]

        for s in services_data:
            service = Service(
                name=s["name"],
                slug=s["slug"],
                description=s["description"],
                official_url=s["official_url"],
                fees_description=s["fees_description"],
                processing_time=s["processing_time"]
            )
            db.add(service)
            db.flush()  # get service ID

            for req in s["requirements"]:
                db.add(ServiceRequirement(service_id=service.id, **req))
            for rule in s["rules"]:
                db.add(EligibilityRule(service_id=service.id, **rule))
            for step in s["steps"]:
                db.add(ApplicationStep(service_id=service.id, **step))
            for faq in s["faqs"]:
                db.add(ServiceFAQ(service_id=service.id, **faq))
            for rej in s["rejections"]:
                db.add(CommonRejectionReason(service_id=service.id, **rej))

        db.commit()
        print("Database successfully seeded with default government services!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
