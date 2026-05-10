from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    agent = "agent"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="agent", nullable=False)
    is_active = Column(Boolean, default=True)
    phone = Column(String(30))
    whatsapp = Column(String(30))
    notify_on_log = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    interactions = relationship("Interaction", back_populates="logged_by_user", foreign_keys="Interaction.logged_by")
