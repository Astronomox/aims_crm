import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.chat_session import ChatSession
from app.core.security import get_current_user
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.services import ai_service

router = APIRouter()


class SessionOut(BaseModel):
    id: int
    title: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    message_count: int = 0
    last_message: Optional[str] = None

    model_config = {"from_attributes": True}


class SessionDetail(SessionOut):
    messages: list = []


class SendMessage(BaseModel):
    session_id: int
    message: str


# ── List all chat sessions ────────────────────────────────────────────────────

@router.get("/sessions", response_model=List[SessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id, ChatSession.is_active == True)
        .order_by(ChatSession.updated_at.desc())
    )
    sessions = result.scalars().all()
    out = []
    for s in sessions:
        msgs = json.loads(s.messages_json or "[]")
        last = msgs[-1]["content"][:80] if msgs else None
        out.append(SessionOut(
            id=s.id, title=s.title, is_active=s.is_active,
            created_at=s.created_at, updated_at=s.updated_at,
            message_count=len(msgs), last_message=last,
        ))
    return out


# ── Create new session ────────────────────────────────────────────────────────

@router.post("/sessions", response_model=SessionDetail)
async def create_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    welcome = {
        "role": "assistant",
        "content": "Welcome to AIMS Education Nigeria. I can help with university selection, visa applications, scholarships, and study abroad guidance across the UK, Canada, USA, Australia and more. How can I help you today?",
        "time": datetime.utcnow().isoformat(),
    }
    session = ChatSession(
        user_id=current_user.id,
        title="New conversation",
        messages_json=json.dumps([welcome]),
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return SessionDetail(
        id=session.id, title=session.title, is_active=session.is_active,
        created_at=session.created_at, updated_at=session.updated_at,
        message_count=1, messages=[welcome],
    )


# ── Get session with messages ─────────────────────────────────────────────────

@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = json.loads(session.messages_json or "[]")
    return SessionDetail(
        id=session.id, title=session.title, is_active=session.is_active,
        created_at=session.created_at, updated_at=session.updated_at,
        message_count=len(msgs), last_message=msgs[-1]["content"][:80] if msgs else None,
        messages=msgs,
    )


# ── Send message (saves + gets AI reply) ──────────────────────────────────────

@router.post("/sessions/{session_id}/send", response_model=AIChatResponse)
async def send_message(
    session_id: int,
    payload: SendMessage,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msgs = json.loads(session.messages_json or "[]")
    now = datetime.utcnow().isoformat()

    # Add user message
    msgs.append({"role": "user", "content": payload.message, "time": now})

    # Get AI reply
    history = [{"role": m["role"], "content": m["content"]} for m in msgs if m["role"] in ("user", "assistant")]
    ai_result = await ai_service.chat_with_student(payload.message, history[:-1])

    # Add AI reply
    msgs.append({"role": "assistant", "content": ai_result["reply"], "time": datetime.utcnow().isoformat()})

    # Auto-title after first real exchange — use AI to generate a descriptive title
    if session.title == "New conversation" and len([m for m in msgs if m["role"] == "user"]) == 1:
        try:
            title_result = await ai_service.generate_chat_title(payload.message, ai_result["reply"])
            session.title = title_result[:80]
        except Exception:
            session.title = payload.message[:60]

    session.messages_json = json.dumps(msgs)
    session.updated_at = datetime.utcnow()
    await db.flush()

    return ai_result


# ── Delete session ────────────────────────────────────────────────────────────

@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False


# ── Public chat (no auth, for student-facing) ─────────────────────────────────

@router.post("/chat", response_model=AIChatResponse)
async def student_chat(payload: AIChatRequest):
    try:
        result = await ai_service.chat_with_student(payload.message, payload.history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
