from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class ContactStatus(str, enum.Enum):
    new_lead = "new_lead"
    in_progress = "in_progress"
    application_submitted = "application_submitted"
    visa_processing = "visa_processing"
    enrolled = "enrolled"
    not_qualified = "not_qualified"
    lost = "lost"


class DestinationCountry(str, enum.Enum):
    uk = "United Kingdom"
    canada = "Canada"
    usa = "USA"
    australia = "Australia"
    malaysia = "Malaysia"
    germany = "Germany"
    denmark = "Denmark"
    uae = "UAE"
    multiple = "Multiple"
    undecided = "Undecided"


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False, index=True)
    email = Column(String(255), index=True)
    phone = Column(String(30))
    whatsapp = Column(String(30))
    status = Column(String(40), default="new_lead", nullable=False)
    destination_country = Column(String(40), default="Undecided")
    program_interest = Column(String(300))
    university_interest = Column(String(300))
    source = Column(String(100))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    interactions = relationship("Interaction", back_populates="contact", cascade="all, delete-orphan")
