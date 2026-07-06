from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceResponse, ServiceDetailResponse

router = APIRouter()

@router.get("", response_model=List[ServiceResponse])
def read_services(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve services. Supports search keyword matching across name and description.
    """
    query = db.query(Service)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Service.name.ilike(search_filter),
                Service.description.ilike(search_filter)
            )
        )
    return query.all()

@router.get("/{slug}", response_model=ServiceDetailResponse)
def read_service_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed government service data by slug.
    """
    service = db.query(Service).filter(Service.slug == slug).first()
    if not service:
        raise HTTPException(
            status_code=404,
            detail=f"Service with slug '{slug}' not found"
        )
    return service
