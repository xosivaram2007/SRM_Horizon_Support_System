from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from models import Ticket, TicketHistory
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/tickets", tags=["tickets"])

class TicketCreate(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str = "Medium"
    userEmail: str
    userName: Optional[str] = None
    location: Optional[str] = None

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedTechnicianName: Optional[str] = None
    resolutionNotes: Optional[str] = None
    remarks: Optional[str] = None
    history: Optional[List[TicketHistory]] = None

@router.get("/")
async def get_tickets(email: Optional[str] = None, role: Optional[str] = None):
    query = {}
    if role:
        role_lower = role.lower().replace(" ", "")
        is_admin = role_lower in ["admin", "superadmin"]
        if not is_admin and email:
            email_lower = email.lower()
            # In Beanie/Motor, we use standard Mongo query syntax if needed, 
            # or Beanie expressions.
            tickets = await Ticket.find({"$or": [{"userEmail": email_lower}, {"assignedTo": email_lower}]}).sort("-createdAt").to_list()
            return {"success": True, "tickets": tickets}
            
    tickets = await Ticket.find_all().sort("-createdAt").to_list()
    return {"success": True, "tickets": tickets}

@router.post("/")
async def create_ticket(t: TicketCreate):
    new_ticket = Ticket(
        ticket_id=t.id,
        title=t.title,
        description=t.description,
        category=t.category,
        priority=t.priority,
        userEmail=t.userEmail.lower(),
        userName=t.userName,
        location=t.location,
        createdAt=datetime.now()
    )
    await new_ticket.insert()
    return {"success": True, "ticket": new_ticket}

@router.patch("/{ticket_id}")
async def update_ticket(ticket_id: str, updates: TicketUpdate):
    # Try searching by custom ticket_id string first, then by internal ObjectId
    ticket = await Ticket.find_one({"id": ticket_id})
    if not ticket:
        # Check if it's a valid ObjectId
        from bson import ObjectId
        if ObjectId.is_valid(ticket_id):
            ticket = await Ticket.get(ticket_id)
            
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    await ticket.save()
    return {"success": True, "ticket": ticket}
