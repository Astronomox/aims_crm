#!/usr/bin/env python3
"""
Seed the database with demo data for AIMS CRM.
Run: python seed.py
Requires the app's virtualenv and a running PostgreSQL instance.
"""
import asyncio
import secrets
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.contact import Contact, ContactStatus, DestinationCountry
from app.models.interaction import Interaction, InteractionType, InteractionTopic
from app.core.security import hash_password
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

CONTACTS = [
    {"full_name": "Adaeze Okonkwo", "email": "adaeze.o@gmail.com", "phone": "+2348012345678", "status": ContactStatus.in_progress, "destination_country": DestinationCountry.uk, "program_interest": "MSc Nursing", "university_interest": "University of Salford", "source": "Instagram"},
    {"full_name": "Emeka Nwosu", "email": "emeka.n@yahoo.com", "phone": "+2348023456789", "status": ContactStatus.new_lead, "destination_country": DestinationCountry.canada, "program_interest": "MBA", "university_interest": "University of Toronto", "source": "Referral"},
    {"full_name": "Fatima Aliyu", "email": "fatima.a@gmail.com", "phone": "+2348034567890", "status": ContactStatus.application_submitted, "destination_country": DestinationCountry.uk, "program_interest": "BSc Computer Science", "university_interest": "Coventry University", "source": "Walk-in"},
    {"full_name": "Chukwudi Eze", "email": "chukwudi.e@hotmail.com", "phone": "+2348045678901", "status": ContactStatus.visa_processing, "destination_country": DestinationCountry.uk, "program_interest": "LLM Law", "university_interest": "University of Hertfordshire", "source": "Facebook"},
    {"full_name": "Ngozi Adeleke", "email": "ngozi.a@gmail.com", "phone": "+2348056789012", "status": ContactStatus.enrolled, "destination_country": DestinationCountry.australia, "program_interest": "MSc Data Science", "university_interest": "RMIT University", "source": "Google"},
    {"full_name": "Segun Balogun", "email": "segun.b@gmail.com", "phone": "+2348067890123", "status": ContactStatus.new_lead, "destination_country": DestinationCountry.usa, "program_interest": "MS Engineering", "source": "WhatsApp"},
    {"full_name": "Amina Hassan", "email": "amina.h@gmail.com", "phone": "+2348078901234", "status": ContactStatus.in_progress, "destination_country": DestinationCountry.malaysia, "program_interest": "MBBS Medicine", "source": "Referral"},
    {"full_name": "Tunde Fashola", "email": "tunde.f@gmail.com", "phone": "+2348089012345", "status": ContactStatus.new_lead, "destination_country": DestinationCountry.canada, "program_interest": "BSc Pharmacy", "source": "Instagram"},
]

NOTES = [
    "Student interested in nursing at Salford. Has IELTS 6.5. NECO results uploaded. Discussed conditional offer process. Needs to submit personal statement by end of month. Agreed to send SOP template.",
    "Called about MBA in Canada. Currently working as bank manager at GTBank. Needs IELTS. Discussed Toronto and York University options. Will register for IELTS next month. Send university comparison table.",
    "Application submitted to Coventry. Awaiting CAS letter. Student has paid tuition deposit. Discussed visa application timeline — 3 to 8 weeks. Confirmed biometrics appointment booked.",
    "Visa approved. Student flying in 3 weeks. Discussed accommodation at student halls. Sent airport pickup guide. Needs to open UK bank account. Discussed Monzo as option.",
    "Follow up call. Student settled in Melbourne. Enrolled and attending lectures. RMIT orientation was last week. Called to say thank you to the team.",
    "First enquiry call. Student wants to study engineering in USA. No IELTS yet. Discussed GRE requirements for grad school. Explained the AIMS consultation process. Very interested.",
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with Session() as db:
        # Admin user
        admin = User(
            full_name="AIMS Admin",
            email="admin@aimseducation.ng",
            hashed_password=hash_password("aims2024"),
            role=UserRole.admin,
            phone="+2348084372965",
            whatsapp="+2348084372965",
            notify_on_log=True,
        )
        # Agent
        agent = User(
            full_name="AIMS Consultant",
            email="consultant@aimseducation.ng",
            hashed_password=hash_password("aims2024"),
            role=UserRole.agent,
            notify_on_log=True,
        )
        db.add_all([admin, agent])
        await db.flush()

        contacts = []
        for c in CONTACTS:
            contact = Contact(**c)
            db.add(contact)
            contacts.append(contact)
        await db.flush()

        for i, (contact, note) in enumerate(zip(contacts[:6], NOTES)):
            interaction = Interaction(
                contact_id=contact.id,
                logged_by=admin.id,
                type=InteractionType.call,
                topic=InteractionTopic.university_selection if i % 2 == 0 else InteractionTopic.visa_application,
                duration_minutes=10 + (i * 3),
                raw_notes=note,
                ai_summary=f"Consultant spoke with {contact.full_name} regarding {contact.program_interest or 'study abroad plans'}. Key discussion points noted. Follow-up actions agreed.",
                ai_transcript=f"• Student enquiry: {contact.program_interest or 'Study abroad'}\n• Destination: {contact.destination_country.value}\n• Current status: Documents review\n• Next steps: Application preparation [ACTION REQUIRED]",
                follow_up_action="Send application checklist and document requirements" if i < 3 else None,
                follow_up_completed=i >= 4,
                shared_token=secrets.token_urlsafe(32),
                occurred_at=datetime.utcnow() - timedelta(days=i),
            )
            db.add(interaction)

        await db.commit()
        print("Database seeded successfully.")
        print(f"  Admin:      admin@aimseducation.ng / aims2024")
        print(f"  Consultant: consultant@aimseducation.ng / aims2024")
        print(f"  Contacts:   {len(CONTACTS)} records")
        print(f"  Interactions: 6 records")


if __name__ == "__main__":
    asyncio.run(seed())
