import anthropic
from typing import List
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

AIMS_SYSTEM_PROMPT = """You are the AI customer service representative for AIMS Education Nigeria, \
a British Council-certified study abroad consultancy headquartered in Lagos (Lekki). \
AIMS has 8 global offices and partners with 100+ universities across the UK, Canada, USA, \
Australia, Malaysia, Germany, Denmark, UAE, Hungary, and Poland.

Services: University selection, course finding, university applications, visa application & \
interview preparation, SOP/CV writing, English test guidance (IELTS/TOEFL), accommodation \
support, scholarship guidance, career counseling.

Contact: +234 808-437-2965 | Hive Mall, 2nd Floor, 117 T.F. Kuboye Road, Maroko, Lekki, Lagos.

Respond in professional, warm, and confident English. Give specific, actionable information. \
Recommend booking a free consultation for complex cases. Never invent visa fees or processing \
times — say you will confirm and follow up if unsure."""

CALL_PROCESSOR_PROMPT = """You are a senior business intelligence analyst for AIMS Education Nigeria. \
Your job is to transform raw call notes into structured, professional records.

Output exactly two labeled sections with no extra text:

PROFESSIONAL_SUMMARY:
Write 3-5 polished sentences as they would appear in a Salesforce CRM record. Include: \
student's enquiry and background, key information provided by the consultant, agreed next steps, \
and any urgency flags.

ORGANIZED_TRANSCRIPT:
Reformat the raw notes into a clean, structured bullet-point log of the conversation — \
word-accurate but professionally organized. Use sub-bullets for details. Every action item \
must end with [ACTION REQUIRED] or [COMPLETED]."""


async def generate_call_summary(
    contact_name: str,
    topic: str,
    country: str,
    duration: int,
    raw_notes: str,
    follow_up: str,
) -> dict:
    prompt = f"""
Contact: {contact_name}
Enquiry Topic: {topic}
Destination Country: {country}
Call Duration: {duration or 'Unknown'} minutes
Raw Notes from Consultant:
{raw_notes}

Follow-up Required: {follow_up or 'None specified'}
"""
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1500,
        system=CALL_PROCESSOR_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    summary, transcript = "", text

    if "PROFESSIONAL_SUMMARY:" in text and "ORGANIZED_TRANSCRIPT:" in text:
        parts = text.split("ORGANIZED_TRANSCRIPT:")
        summary = parts[0].replace("PROFESSIONAL_SUMMARY:", "").strip()
        transcript = parts[1].strip()

    return {"summary": summary, "transcript": transcript}


async def chat_with_student(message: str, history: List[dict]) -> dict:
    messages = []
    for h in history[-12:]:
        if h.get("role") in ("user", "assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=800,
        system=AIMS_SYSTEM_PROMPT,
        messages=messages,
    )

    reply = response.content[0].text
    topics = _detect_topics(message + " " + reply)
    return {"reply": reply, "detected_topics": topics}


async def generate_daily_report(interactions_text: str, date: str) -> str:
    prompt = f"""
Generate a concise executive daily operations report for AIMS Education Nigeria for {date}.

Interactions logged today:
{interactions_text}

Format:
- 2-sentence executive summary
- Key enquiries and topics breakdown
- Critical follow-ups requiring action today
- Recommended focus for tomorrow

Professional tone. No fluff."""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=800,
        system="You are a senior operations manager at AIMS Education Nigeria generating internal reports.",
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _detect_topics(text: str) -> List[str]:
    text_lower = text.lower()
    topic_map = {
        "Visa": ["visa", "immigration", "student visa", "ukvi"],
        "UK": ["uk ", "united kingdom", "british", "england"],
        "Canada": ["canada", "canadian"],
        "IELTS": ["ielts", "toefl", "english test", "language test"],
        "Scholarship": ["scholarship", "funding", "bursary", "grant"],
        "SOP": ["sop", "statement of purpose", "personal statement"],
        "Tuition": ["fee", "cost", "tuition", "afford"],
        "Application": ["apply", "application", "admission"],
        "Accommodation": ["accommodation", "housing", "halls"],
        "USA": ["usa", "america", "united states"],
        "Australia": ["australia", "australian"],
    }
    return [label for label, keywords in topic_map.items() if any(k in text_lower for k in keywords)]


async def generate_chat_title(user_message: str, ai_reply: str) -> str:
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=30,
        system="Generate a short chat title (3-6 words max) that describes what this conversation is about. Reply with ONLY the title, nothing else. No quotes, no punctuation at the end.",
        messages=[{"role": "user", "content": f"Student asked: {user_message}\nAI replied about: {ai_reply[:200]}"}],
    )
    return message.content[0].text.strip().strip('"').strip("'")
