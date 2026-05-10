from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, date, timedelta
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.models.interaction import Interaction, InteractionType
from app.models.contact import Contact
from app.schemas.schemas import AIChatRequest, AIChatResponse, InteractionOut, NotificationRequest
from app.core.security import get_current_user
from app.services import ai_service, notification_service

# ── AI ────────────────────────────────────────────────────────────────────────
router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
async def student_chat(payload: AIChatRequest):
    try:
        result = await ai_service.chat_with_student(payload.message, payload.history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Re-export as separate routers
ai_router = router

reports = APIRouter()


@reports.get("/daily", response_model=dict)
async def daily_report(
    target_date: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if target_date:
        d = datetime.strptime(target_date, "%Y-%m-%d").date()
    else:
        d = date.today()

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
        "interactions": interactions,
        "ai_narrative": ai_narrative,
    }


@reports.get("/stats")
async def stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today_start = datetime.combine(date.today(), datetime.min.time())

    total = (await db.execute(select(func.count(Interaction.id)))).scalar()
    today = (await db.execute(select(func.count(Interaction.id)).where(Interaction.occurred_at >= today_start))).scalar()
    contacts_total = (await db.execute(select(func.count(Contact.id)).where(Contact.is_active == True))).scalar()
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


notifs = APIRouter()


@notifs.post("/send")
async def send_notifications(
    payload: NotificationRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Interaction)
        .options(selectinload(Interaction.contact), selectinload(Interaction.logged_by_user))
        .where(Interaction.id == payload.interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    contact_name = interaction.contact.full_name if interaction.contact else "Unknown"
    share_url = f"http://localhost:5173/shared/{interaction.shared_token}"
    msg = notification_service.build_interaction_message(
        contact_name, interaction.topic.value, interaction.ai_summary or "", share_url
    )
    html = notification_service.build_interaction_email(
        contact_name, interaction.topic.value,
        interaction.ai_summary or "", interaction.ai_transcript or "",
        share_url
    )

    users_result = await db.execute(select(User).where(User.notify_on_log == True, User.is_active == True))
    notify_users = users_result.scalars().all()

    sent = []
    for user in notify_users:
        if "whatsapp" in payload.channels and user.whatsapp:
            ok = await notification_service.send_whatsapp(user.whatsapp, msg)
            if ok:
                sent.append(f"whatsapp:{user.email}")
        if "email" in payload.channels and user.email:
            ok = await notification_service.send_email(
                user.email, f"AIMS CRM — {contact_name} | {interaction.topic.value}", html
            )
            if ok:
                sent.append(f"email:{user.email}")

    interaction.notification_sent = True
    return {"sent_to": sent, "interaction_id": payload.interaction_id}
