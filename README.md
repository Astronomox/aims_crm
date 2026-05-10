# AIMS CRM — Business Intelligence Platform

Full-stack CRM and AI assistant for AIMS Education Nigeria.

## Stack

- **Frontend** — React 18, Vite, TypeScript, React Query, Zustand, React Router
- **Backend** — FastAPI (Python 3.12), async SQLAlchemy, Pydantic v2, JWT auth
- **Database** — PostgreSQL 16
- **AI** — Anthropic Claude (call summaries, transcripts, 24/7 student chat)
- **Notifications** — Twilio WhatsApp + SendGrid Email
- **Infrastructure** — Docker Compose (local), deployable to Railway / Render / any VPS

## Quick Start

**Prerequisites:** Docker Desktop installed and running.

```bash
git clone <your-repo>
cd aims-crm
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY (required)
chmod +x start.sh
./start.sh
```

Open http://localhost:5173 — register your account and start.

## Features

### Contacts
- Full student/prospect database with status pipeline
- Statuses: New Lead → In Progress → Application Submitted → Visa Processing → Enrolled
- Destination countries, program interest, university interest, lead source

### Interaction Logging
- Log calls, chats, meetings, emails, WhatsApp
- Write raw notes — Claude AI generates a professional summary + organized transcript automatically
- Follow-up tracking with due dates
- Every log generates a shareable link (no login required for recipients)

### AI Customer Chat
- Claude answers student questions 24/7 on behalf of AIMS
- Knows AIMS services, destinations, universities, visa process
- Detects topics automatically (Visa, IELTS, Scholarship, etc.)

### Notifications
- After logging an interaction, notify your team via WhatsApp and email in one click
- Recipients receive the AI summary + shareable link — no login needed

### Reports
- Daily operations report for any date
- AI generates an executive narrative summary
- Stats: total interactions, calls, chats, new contacts, pending follow-ups

### Shared Records
- Every interaction has a public shareable URL: `/shared/<token>`
- Accessible by anyone with the link — girlfriend, team, partner universities abroad
- Shows: contact, topic, AI summary, transcript, follow-up status

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | YES | Get at console.anthropic.com |
| `TWILIO_ACCOUNT_SID` | No | For WhatsApp notifications |
| `TWILIO_AUTH_TOKEN` | No | For WhatsApp notifications |
| `TWILIO_WHATSAPP_FROM` | No | Twilio sandbox number |
| `SENDGRID_API_KEY` | No | For email notifications |
| `SENDGRID_FROM_EMAIL` | No | Sender email address |

## Deployment (Production)

**Railway (recommended):**
1. Push to GitHub
2. Create Railway project → deploy from GitHub
3. Add PostgreSQL service
4. Set environment variables
5. Set `DATABASE_URL` to Railway's PostgreSQL URL

**Manual VPS:**
```bash
# On your server
git pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL in .env to your local postgres
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

## API Documentation

With the app running: http://localhost:8000/docs

Full interactive Swagger UI for all endpoints.
