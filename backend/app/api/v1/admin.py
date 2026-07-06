from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.models.service import (
    Service,
    ServiceRequirement,
    EligibilityRule,
    ApplicationStep,
    ServiceFAQ,
    CommonRejectionReason
)
from app.schemas.service import (
    ServiceCreate,
    ServiceResponse,
    ServiceRequirementCreate,
    ServiceRequirementResponse,
    EligibilityRuleCreate,
    EligibilityRuleResponse,
    ApplicationStepCreate,
    ApplicationStepResponse,
    ServiceFAQCreate,
    ServiceFAQResponse,
    CommonRejectionReasonCreate,
    CommonRejectionReasonResponse
)

router = APIRouter(dependencies=[Depends(deps.get_current_active_admin)])

# Service CRUD
@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(service_in: ServiceCreate, db: Session = Depends(get_db)):
    # Check if slug unique
    existing = db.query(Service).filter(Service.slug == service_in.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service with this slug already exists.")
        
    db_service = Service(**service_in.dict())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.put("/services/{id}", response_model=ServiceResponse)
def update_service(id: int, service_in: ServiceCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    # Check slug collision
    existing = db.query(Service).filter(Service.slug == service_in.slug, Service.id != id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service with this slug already exists.")

    for var, value in service_in.dict().items():
        setattr(service, var, value)
        
    db.commit()
    db.refresh(service)
    return service

@router.delete("/services/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return None

# Requirement CRUD
@router.post("/services/{id}/requirements", response_model=ServiceRequirementResponse)
def add_requirement(id: int, req_in: ServiceRequirementCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db_req = ServiceRequirement(service_id=id, **req_in.dict())
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@router.delete("/requirements/{req_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_requirement(req_id: int, db: Session = Depends(get_db)):
    req = db.query(ServiceRequirement).filter(ServiceRequirement.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    db.delete(req)
    db.commit()
    return None

# Eligibility Rule CRUD
@router.post("/services/{id}/rules", response_model=EligibilityRuleResponse)
def add_eligibility_rule(id: int, rule_in: EligibilityRuleCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db_rule = EligibilityRule(service_id=id, **rule_in.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(EligibilityRule).filter(EligibilityRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Eligibility rule not found")
    db.delete(rule)
    db.commit()
    return None

# Application Step CRUD
@router.post("/services/{id}/steps", response_model=ApplicationStepResponse)
def add_step(id: int, step_in: ApplicationStepCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db_step = ApplicationStep(service_id=id, **step_in.dict())
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    return db_step

@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_step(step_id: int, db: Session = Depends(get_db)):
    step = db.query(ApplicationStep).filter(ApplicationStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Application step not found")
    db.delete(step)
    db.commit()
    return None

# FAQ CRUD
@router.post("/services/{id}/faqs", response_model=ServiceFAQResponse)
def add_faq(id: int, faq_in: ServiceFAQCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db_faq = ServiceFAQ(service_id=id, **faq_in.dict())
    db.add(db_faq)
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.delete("/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_faq(faq_id: int, db: Session = Depends(get_db)):
    faq = db.query(ServiceFAQ).filter(ServiceFAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    return None

# Rejection Reason CRUD
@router.post("/services/{id}/rejections", response_model=CommonRejectionReasonResponse)
def add_rejection_reason(id: int, rej_in: CommonRejectionReasonCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db_rej = CommonRejectionReason(service_id=id, **rej_in.dict())
    db.add(db_rej)
    db.commit()
    db.refresh(db_rej)
    return db_rej

@router.delete("/rejections/{rej_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_rejection_reason(rej_id: int, db: Session = Depends(get_db)):
    rej = db.query(CommonRejectionReason).filter(CommonRejectionReason.id == rej_id).first()
    if not rej:
        raise HTTPException(status_code=404, detail="Rejection reason not found")
    db.delete(rej)
    db.commit()
    return None
