import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from models import WikiEntry, LeaveRequest, Notification
from mail_util import send_email
from datetime import datetime
from pydantic import BaseModel, EmailStr
from bson import ObjectId

router = APIRouter(tags=["misc"])

# ============================================================
# WIKI ROUTES
# ============================================================

class WikiCreate(BaseModel):
    title: str
    description: str
    resolution: str
    department: str
    technicianName: str

@router.get("/wiki")
async def get_wiki():
    entries = await WikiEntry.find_all().sort("-createdAt").to_list()
    return {"success": True, "entries": entries}

@router.post("/wiki")
async def create_wiki(w: WikiCreate):
    entry = WikiEntry(**w.dict())
    await entry.insert()
    return {"success": True, "entry": entry}

@router.delete("/wiki/{id}")
async def delete_wiki(id: str):
    query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"id": id}
    entry = await WikiEntry.find_one(query)
    if not entry:
        raise HTTPException(status_code=404, detail="Wiki entry not found.")
    await entry.delete()
    return {"success": True, "message": "Wiki entry deleted."}

# ============================================================
# LEAVE REQUEST ROUTES
# ============================================================

class LeaveCreate(BaseModel):
    userEmail: str
    userName: str
    startDate: str
    endDate: str
    reason: str

@router.get("/leave")
async def get_leaves():
    requests = await LeaveRequest.find_all().sort("-createdAt").to_list()
    return {"success": True, "requests": requests}

@router.post("/leave")
async def create_leave(l: LeaveCreate):
    request = LeaveRequest(**l.dict())
    await request.insert()
    # Notify admin
    html = f"""<div style="font-family:sans-serif;padding:20px"><h3>New Leave Request</h3>
    <p><strong>From:</strong> {l.userName}</p>
    <p><strong>Dates:</strong> {l.startDate} to {l.endDate}</p>
    <p><strong>Reason:</strong> {l.reason}</p></div>"""
    await send_email(os.getenv("SMTP_USER", "admin@srmap.edu.in"), f"Leave Request: {l.userName}", html)
    return {"success": True, "request": request}

@router.patch("/leave/{id}")
async def update_leave(id: str, updates: dict):
    query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"id": id}
    request = await LeaveRequest.find_one(query)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")
    for key, value in updates.items():
        setattr(request, key, value)
    await request.save()
    return {"success": True, "request": request}

# ============================================================
# NOTIFICATION ROUTES
# ============================================================

@router.get("/notifications")
async def get_notifications(email: str):
    notifications = await Notification.find(Notification.userEmail == email.lower()).sort("-date").to_list()
    return {"success": True, "notifications": notifications}

@router.post("/notifications")
async def create_notification(n: dict):
    notif = Notification(**n, date=datetime.now())
    await notif.insert()
    return {"success": True, "notification": notif}

@router.patch("/notifications/{id}")
async def mark_notif_read(id: str):
    query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"id": id}
    notif = await Notification.find_one(query)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.read = True
    await notif.save()
    return {"success": True, "notification": notif}

@router.delete("/notifications")
async def clear_notifications(email: str):
    await Notification.find(Notification.userEmail == email.lower()).delete()
    return {"success": True, "message": "Notifications cleared."}

# ============================================================
# NOTIFICATION TRIGGER ENDPOINTS
# ============================================================

class TicketNotif(BaseModel):
    email: str
    fullName: str
    ticketId: str
    ticketTitle: str

@router.post("/notifications/ticket-resolved")
async def notify_ticket_resolved(req: TicketNotif):
    html = f"""<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
    <h2 style="color:#10b981">✅ Ticket Resolved</h2>
    <p>Hello <strong>{req.fullName}</strong>,</p>
    <p>Your ticket <strong>"{req.ticketTitle}"</strong> ({req.ticketId}) has been resolved.</p>
    </div>"""
    await send_email(req.email, f"Ticket Resolved: {req.ticketId}", html)
    return {"success": True, "message": "Notification sent."}

@router.post("/notifications/manual")
async def notify_manual(payload: dict):
    email = payload.get("email")
    emails = payload.get("emails")
    subject = payload.get("subject")
    msg = payload.get("message")
    full_name = payload.get("fullName", "")
    
    html = f"""<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
    <h2 style="color:#527490">Administrative Notification</h2>
    <p>Hello {full_name},</p>
    <div style="padding:15px;border-left:4px solid #527490;background:#f8fafc;margin:20px 0">
      <p style="margin:0">{msg}</p>
    </div>
    </div>"""
    
    if payload.get("isBulk") and isinstance(emails, list):
        for e in emails:
            await send_email(e, subject, html)
    elif email:
        await send_email(email, subject, html)
        
    return {"success": True, "message": "Notification(s) sent."}
