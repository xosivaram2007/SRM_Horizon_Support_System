import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# SMTP CONFIGURATION
# ============================================================

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER", "noreply@srmhorizon.com"),
    MAIL_PASSWORD=os.getenv("SMTP_PASS", "password").replace(" ", ""), # Google app passwords often have spaces
    MAIL_FROM=os.getenv("SMTP_USER", "noreply@srmhorizon.com"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER=os.getenv("SMTP_HOST", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False
)

fm = FastMail(conf)

async def send_email(email_to: str, subject: str, body: str, is_html: bool = True):
    if not os.getenv("SMTP_USER") or not os.getenv("SMTP_PASS"):
        print(f"[MOCK EMAIL] To: {email_to}\nSubject: {subject}\nBody: {body}")
        return

    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        body=body,
        subtype=MessageType.html if is_html else MessageType.plain
    )
    
    try:
        await fm.send_message(message)
        print(f"Email sent to {email_to}")
    except Exception as e:
        print(f"Failed to send email to {email_to}: {str(e)}")
