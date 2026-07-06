import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    official_url = Column(String, nullable=True)
    fees_description = Column(String, nullable=True)
    processing_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    requirements = relationship("ServiceRequirement", back_populates="service", cascade="all, delete-orphan")
    eligibility_rules = relationship("EligibilityRule", back_populates="service", cascade="all, delete-orphan")
    application_steps = relationship("ApplicationStep", back_populates="service", cascade="all, delete-orphan")
    faqs = relationship("ServiceFAQ", back_populates="service", cascade="all, delete-orphan")
    rejection_reasons = relationship("CommonRejectionReason", back_populates="service", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="service")


class ServiceRequirement(Base):
    __tablename__ = "service_requirements"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    doc_type_required = Column(String, nullable=False) # e.g. "Aadhaar Card", "PAN Card"
    is_mandatory = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

    service = relationship("Service", back_populates="requirements")
    application_documents = relationship("ApplicationDocument", back_populates="requirement", cascade="all, delete-orphan")


class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    rule_description = Column(Text, nullable=False)
    condition_type = Column(String, nullable=True) # e.g., age, residency, income, general

    service = relationship("Service", back_populates="eligibility_rules")


class ApplicationStep(Base):
    __tablename__ = "application_steps"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_title = Column(String, nullable=False)
    step_description = Column(Text, nullable=False)
    is_online = Column(Boolean, default=True)

    service = relationship("Service", back_populates="application_steps")


class ServiceFAQ(Base):
    __tablename__ = "service_faqs"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)

    service = relationship("Service", back_populates="faqs")


class CommonRejectionReason(Base):
    __tablename__ = "common_rejection_reasons"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    reason_title = Column(String, nullable=False)
    reason_description = Column(Text, nullable=False)
    mitigation_steps = Column(Text, nullable=False)

    service = relationship("Service", back_populates="rejection_reasons")
