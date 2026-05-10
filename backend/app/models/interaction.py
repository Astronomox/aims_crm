from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class InteractionType(str, enum.Enum):
    call = "call"
    chat = "chat"
    meeting = "meeting"
    email = "email"
    whatsapp = "whatsapp"


class InteractionTopic(str, enum.Enum):
    university_selection = "University Selection"
    visa_application = "Visa Application"
    application_process = "Application Process"
    sop_cv = "SOP / CV Writing"
    scholarship = "Scholarship Information"
    tuition_fees = "Tuition & Fees"
    accommodation = "Accommodation"
    career_counseling = "Career Counseling"
    english_test = "English Language Test"
    interview_prep = "Interview Preparation"
    general = "General Enquiry"
    follow_up = "Follow-up"


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    logged_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    type = Column(String(20), nullable=False)
    topic = Column(String(60), default="General Enquiry")
    duration_minutes = Column(Integer)

    raw_notes = Column(Text)
    ai_summary = Column(Text)
    ai_transcript = Column(Text)

    follow_up_action = Column(Text)
    follow_up_due = Column(DateTime(timezone=True))
    follow_up_completed = Column(Boolean, default=False)

    notification_sent = Column(Boolean, default=False)
    shared_token = Column(String(64), unique=True, index=True)

    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    contact = relationship("Contact", back_populates="interactions")
    logged_by_user = relationship("User", back_populates="interactions", foreign_keys=[logged_by])
