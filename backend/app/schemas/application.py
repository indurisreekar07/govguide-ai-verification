from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.schemas.service import ServiceResponse, ServiceRequirementResponse

class DocumentResponse(BaseModel):
    id: int
    original_filename: str
    mime_type: str
    file_size: int
    ocr_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationDocumentResponse(BaseModel):
    id: int
    requirement_id: int
    document: Optional[DocumentResponse] = None
    verification_status: str
    verification_error_details: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    service_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    service: ServiceResponse

    class Config:
        from_attributes = True

class ApplicationDetailResponse(ApplicationResponse):
    application_documents: List[ApplicationDocumentResponse] = []

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    service_id: int

class ChecklistItem(BaseModel):
    requirement_id: int
    doc_type_required: str
    is_mandatory: bool
    description: Optional[str] = None
    status: str  # missing, valid, expired, invalid
    error_details: Optional[str] = None
    last_uploaded_at: Optional[datetime] = None
    document_id: Optional[int] = None

class ChecklistResponse(BaseModel):
    application_id: int
    service_name: str
    progress_percentage: float
    checklist: List[ChecklistItem]
    next_steps: List[str]
