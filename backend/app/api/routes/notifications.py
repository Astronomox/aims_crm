from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.interaction import Interaction
from app.schemas.schemas import NotificationRequest
from app.core.security import get_current_user
from app.services import notification_service

router = APIRouter()


@router.post("/send")
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
        interaction.ai_summary or "", interaction.ai_transcript or "", share_url
    )

    users_result = await db.execute(
        select(User).where(User.notify_on_log == True, User.is_active == True)
    )
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
