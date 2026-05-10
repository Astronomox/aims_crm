import httpx
from typing import List, Optional
from app.core.config import settings


async def send_whatsapp(to: str, body: str) -> bool:
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_WHATSAPP_FROM]):
        return False
    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            data={"From": f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}", "To": f"whatsapp:{to}", "Body": body},
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
        )
    return resp.status_code == 201


async def send_email(to: str, subject: str, html_body: str) -> bool:
    if not settings.SENDGRID_API_KEY:
        return False
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}", "Content-Type": "application/json"},
            json={
                "personalizations": [{"to": [{"email": to}]}],
                "from": {"email": settings.SENDGRID_FROM_EMAIL, "name": "AIMS CRM"},
                "subject": subject,
                "content": [{"type": "text/html", "value": html_body}],
            },
        )
    return resp.status_code == 202


def build_interaction_message(contact_name: str, topic: str, summary: str, share_url: str) -> str:
    return (
        f"*AIMS CRM — New Interaction Logged*\n\n"
        f"Contact: {contact_name}\n"
        f"Topic: {topic}\n\n"
        f"Summary:\n{summary}\n\n"
        f"Full record: {share_url}"
    )


def build_interaction_email(contact_name: str, topic: str, summary: str, transcript: str, share_url: str) -> str:
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a2e;">
  <div style="background:#0A0F1E;padding:20px 32px;border-radius:8px 8px 0 0;">
    <h1 style="color:#C9A84C;font-size:20px;margin:0;">AIMS Education Nigeria</h1>
    <p style="color:#A89F8C;margin:4px 0 0;font-size:13px;">CRM Interaction Report</p>
  </div>
  <div style="background:#f9f9f9;padding:28px 32px;border:1px solid #e0e0e0;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="color:#666;font-size:13px;padding:4px 0;width:130px;">Contact</td><td style="font-weight:600;">{contact_name}</td></tr>
      <tr><td style="color:#666;font-size:13px;padding:4px 0;">Topic</td><td>{topic}</td></tr>
    </table>
    <h3 style="color:#0A0F1E;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Summary</h3>
    <p style="line-height:1.7;color:#333;">{summary}</p>
    <h3 style="color:#0A0F1E;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:20px 0 8px;">Interaction Log</h3>
    <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:16px;font-size:13px;line-height:1.8;color:#444;white-space:pre-wrap;">{transcript}</div>
    <div style="margin-top:24px;">
      <a href="{share_url}" style="background:#C9A84C;color:#0A0F1E;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Full Record</a>
    </div>
  </div>
  <div style="background:#f0f0f0;padding:12px 32px;border-radius:0 0 8px 8px;font-size:11px;color:#999;">AIMS Education Nigeria — Hive Mall, Lekki, Lagos</div>
</div>"""
