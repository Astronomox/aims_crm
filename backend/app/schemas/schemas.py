from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole
from app.models.contact import ContactStatus, DestinationCountry
from app.models.interaction import InteractionType, InteractionTopic


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ── Users ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.agent
    phone: Optional[str] = None
    whatsapp: Optional[str] = None


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    phone: Optional[str]
    whatsapp: Optional[str]
    notify_on_log: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Contacts ──────────────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    status: ContactStatus = ContactStatus.new_lead
    destination_country: DestinationCountry = DestinationCountry.undecided
    program_interest: Optional[str] = None
    university_interest: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    status: Optional[ContactStatus] = None
    destination_country: Optional[DestinationCountry] = None
    program_interest: Optional[str] = None
    university_interest: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class ContactOut(BaseModel):
    id: int
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    whatsapp: Optional[str]
    status: ContactStatus
    destination_country: DestinationCountry
    program_interest: Optional[str]
    university_interest: Optional[str]
    source: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ContactWithInteractions(ContactOut):
    interactions: List["InteractionOut"] = []


# ── Interactions ──────────────────────────────────────────────────────────────

class InteractionCreate(BaseModel):
    contact_id: int
    type: InteractionType
    topic: InteractionTopic = InteractionTopic.general
    duration_minutes: Optional[int] = None
    raw_notes: str
    follow_up_action: Optional[str] = None
    follow_up_due: Optional[datetime] = None
    occurred_at: Optional[datetime] = None


class InteractionOut(BaseModel):
    id: int
    contact_id: int
    logged_by: int
    type: InteractionType
    topic: InteractionTopic
    duration_minutes: Optional[int]
    raw_notes: Optional[str]
    ai_summary: Optional[str]
    ai_transcript: Optional[str]
    follow_up_action: Optional[str]
    follow_up_due: Optional[datetime]
    follow_up_completed: bool
    notification_sent: bool
    shared_token: Optional[str]
    occurred_at: datetime
    created_at: datetime
    contact: Optional[ContactOut] = None
    logged_by_user: Optional[UserOut] = None

    model_config = {"from_attributes": True}


# ── AI ────────────────────────────────────────────────────────────────────────

class AIChatRequest(BaseModel):
    message: str
    history: List[dict] = []


class AIChatResponse(BaseModel):
    reply: str
    detected_topics: List[str] = []


class AIProcessRequest(BaseModel):
    interaction_id: int


# ── Reports ───────────────────────────────────────────────────────────────────

class DailyReportOut(BaseModel):
    date: str
    total_interactions: int
    calls: int
    chats: int
    new_contacts: int
    interactions: List[InteractionOut]
    ai_narrative: Optional[str] = None


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationRequest(BaseModel):
    interaction_id: int
    channels: List[str] = ["whatsapp", "email"]


ContactWithInteractions.model_rebuild()
