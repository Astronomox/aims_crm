import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.db.session import get_db
from app.models.interaction import Interaction
from app.models.contact import Contact
from app.models.user import User
from app.schemas.schemas import InteractionCreate, InteractionOut
from app.core.security import get_current_user
from app.services import ai_service

router = APIRouter()


@router.get("/", response_model=List[InteractionOut])
async def list_interactions(
    contact_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    stmt = (
        select(Interaction)
        .options(selectinload(Interaction.contact), selectinload(Interaction.logged_by_user))
        .order_by(Interaction.occurred_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if contact_id:
        stmt = stmt.where(Interaction.contact_id == contact_id)
    if type:
        stmt = stmt.where(Interaction.type == type)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=InteractionOut, status_code=201)
async def create_interaction(
    payload: InteractionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate contact exists
    contact_result = await db.execute(select(Contact).where(Contact.id == payload.contact_id))
    contact = contact_result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    interaction = Interaction(
        **payload.model_dump(exclude={"occurred_at"}),
        logged_by=current_user.id,
        shared_token=secrets.token_urlsafe(32),
        occurred_at=payload.occurred_at,
    )
    db.add(interaction)
    await db.flush()

    # Generate AI summary immediately
    try:
        result = await ai_service.generate_call_summary(
            contact_name=contact.full_name,
            topic=payload.topic.value,
            country=contact.destination_country.value if contact.destination_country else "",
            duration=payload.duration_minutes or 0,
            raw_notes=payload.raw_notes,
            follow_up=payload.follow_up_action or "",
        )
        interaction.ai_summary = result["summary"]
        interaction.ai_transcript = result["transcript"]
    except Exception:
        pass  # AI failure should not block logging

    await db.flush()
    await db.refresh(interaction)

    # Eager load relationships
    result = await db.execute(
        select(Interaction)
        .options(selectinload(Interaction.contact), selectinload(Interaction.logged_by_user))
        .where(Interaction.id == interaction.id)
    )
    return result.scalar_one()


@router.get("/share/{token}", response_model=InteractionOut)
async def get_shared_interaction(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Interaction)
        .options(selectinload(Interaction.contact), selectinload(Interaction.logged_by_user))
        .where(Interaction.shared_token == token)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Record not found")
    return interaction


@router.patch("/{interaction_id}/complete-followup", response_model=InteractionOut)
async def complete_followup(
    interaction_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Interaction).where(Interaction.id == interaction_id))
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    interaction.follow_up_completed = True
    await db.flush()
    await db.refresh(interaction)
    return interaction
