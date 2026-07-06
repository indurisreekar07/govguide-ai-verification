from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ServiceRequirementBase(BaseModel):
    doc_type_required: str
    is_mandatory: bool
    description: Optional[str] = None

class ServiceRequirementCreate(ServiceRequirementBase):
    pass

class ServiceRequirementResponse(ServiceRequirementBase):
    id: int
    service_id: int

    class Config:
        from_attributes = True

class EligibilityRuleBase(BaseModel):
    rule_description: str
    condition_type: Optional[str] = None

class EligibilityRuleCreate(EligibilityRuleBase):
    pass

class EligibilityRuleResponse(EligibilityRuleBase):
    id: int
    service_id: int

    class Config:
        from_attributes = True

class ApplicationStepBase(BaseModel):
    step_number: int
    step_title: str
    step_description: str
    is_online: bool

class ApplicationStepCreate(ApplicationStepBase):
    pass

class ApplicationStepResponse(ApplicationStepBase):
    id: int
    service_id: int

    class Config:
        from_attributes = True

class ServiceFAQBase(BaseModel):
    question: str
    answer: str

class ServiceFAQCreate(ServiceFAQBase):
    pass

class ServiceFAQResponse(ServiceFAQBase):
    id: int
    service_id: int

    class Config:
        from_attributes = True

class CommonRejectionReasonBase(BaseModel):
    reason_title: str
    reason_description: str
    mitigation_steps: str

class CommonRejectionReasonCreate(CommonRejectionReasonBase):
    pass

class CommonRejectionReasonResponse(CommonRejectionReasonBase):
    id: int
    service_id: int

    class Config:
        from_attributes = True

class ServiceBase(BaseModel):
    name: str
    description: str
    official_url: Optional[str] = None
    fees_description: Optional[str] = None
    processing_time: Optional[str] = None

class ServiceCreate(ServiceBase):
    slug: str

class ServiceResponse(ServiceBase):
    id: int
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True

class ServiceDetailResponse(ServiceResponse):
    requirements: List[ServiceRequirementResponse] = []
    eligibility_rules: List[EligibilityRuleResponse] = []
    application_steps: List[ApplicationStepResponse] = []
    faqs: List[ServiceFAQResponse] = []
    rejection_reasons: List[CommonRejectionReasonResponse] = []

    class Config:
        from_attributes = True
