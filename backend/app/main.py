from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.api.routes import auth, contacts, interactions, ai, reports, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="AIMS CRM API",
    description="AIMS Education Nigeria — Business Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])
app.include_router(interactions.router, prefix="/api/interactions", tags=["Interactions"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Services"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


@app.get("/health")
async def health():
    return {"status": "operational", "service": "AIMS CRM API"}
