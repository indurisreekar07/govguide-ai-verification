from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.services import router as services_router
from app.api.v1.applications import router as applications_router
from app.api.v1.chat import router as chat_router
from app.api.v1.admin import router as admin_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(services_router, prefix="/services", tags=["services"])
router.include_router(applications_router, prefix="/applications", tags=["applications"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(admin_router, prefix="/admin", tags=["admin"])
