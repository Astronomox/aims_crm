from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.db.session import get_db
from app.models.contact import Contact
from app.models.user import User
from app.schemas.schemas import ContactCreate, ContactUpdate, ContactOut, ContactWithInteractions
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ContactOut])
async def list_contacts(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    stmt = select(Contact).where(Contact.is_active == True)
    if q:
        stmt = stmt.where(or_(
            Contact.full_name.ilike(f"%{q}%"),
            Contact.email.ilike(f"%{q}%"),
            Contact.phone.ilike(f"%{q}%"),
        ))
    if status:
        stmt = stmt.where(Contact.status == status)
    if country:
        stmt = stmt.where(Contact.destination_country == country)
    stmt = stmt.order_by(Contact.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ContactOut, status_code=201)
async def create_contact(
    payload: ContactCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    contact = Contact(**payload.model_dump())
    db.add(contact)
    await db.flush()
    await db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ContactWithInteractions)
async def get_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.interactions))
        .where(Contact.id == contact_id, Contact.is_active == True)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactOut)
async def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    await db.flush()
    await db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.is_active = False
