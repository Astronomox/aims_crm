from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, date
from app.db.session import get_db
from app.models.user import User
from app.models.interaction import Interaction, InteractionType
from app.models.contact import Contact
from app.core.security import get_current_user
from app.services import ai_service

router = APIRouter()


@router.get("/daily")
async def daily_report(
    target_date: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    d = datetime.strptime(target_date, "%Y-%m-%d").date() if target_date else date.today()
    start = datetime(d.year, d.month, d.day, 0, 0, 0)
    end = datetime(d.year, d.month, d.day, 23, 59, 59)

    result = await db.execute(
        select(Interaction)
        .options(selectinload(Interaction.contact), selectinload(Interaction.logged_by_user))
        .where(Interaction.occurred_at.between(start, end))
        .order_by(Interaction.occurred_at.desc())
    )
    interactions = result.scalars().all()

    new_contacts_result = await db.execute(
        select(func.count(Contact.id)).where(
            Contact.created_at.between(start, end), Contact.is_active == True
        )
    )
    new_contacts = new_contacts_result.scalar()
    calls = sum(1 for i in interactions if i.type == InteractionType.call)
    chats = sum(1 for i in interactions if i.type == InteractionType.chat)

    ai_narrative = None
    if interactions:
        summary_text = "\n".join(
            f"- {i.contact.full_name if i.contact else 'Unknown'} | {i.topic.value} | {i.ai_summary or i.raw_notes or ''}"
            for i in interactions[:15]
        )
        try:
            ai_narrative = await ai_service.generate_daily_report(summary_text, str(d))
        except Exception:
            pass

    return {
        "date": str(d),
        "total_interactions": len(interactions),
        "calls": calls,
        "chats": chats,
        "new_contacts": new_contacts,
        "interactions": [i.__dict__ for i in interactions],
        "ai_narrative": ai_narrative,
    }


@router.get("/stats")
async def stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today_start = datetime.combine(date.today(), datetime.min.time())
    total = (await db.execute(select(func.count(Interaction.id)))).scalar()
    today = (await db.execute(
        select(func.count(Interaction.id)).where(Interaction.occurred_at >= today_start)
    )).scalar()
    contacts_total = (await db.execute(
        select(func.count(Contact.id)).where(Contact.is_active == True)
    )).scalar()
    follow_ups_pending = (await db.execute(
        select(func.count(Interaction.id)).where(
            Interaction.follow_up_action != None,
            Interaction.follow_up_completed == False,
        )
    )).scalar()
    return {
        "total_interactions": total,
        "interactions_today": today,
        "total_contacts": contacts_total,
        "follow_ups_pending": follow_ups_pending,
    }
