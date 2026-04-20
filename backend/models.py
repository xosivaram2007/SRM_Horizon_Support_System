from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel, Field, EmailStr

# ============================================================
# MONGOOSE MODELS -> BEANIE DOCUMENTS
# ============================================================

class User(Document):
    fullName: str
    email: Indexed(EmailStr, unique=True)
    password: str
    role: str = "Student" # enum: ["Student", "Staff", "Faculty", "Admin", "Technician", "SuperAdmin"]
    department: str = "General"
    regNumber: Optional[str] = None
    technicianId: Optional[str] = None
    yearOfStudy: Optional[str] = None
    employeeId: Optional[str] = None
    adminLevel: Optional[str] = None
    avatarUrl: Optional[str] = None
    status: str = "Active" # enum: ["Active", "Held", "Blocked", "Restricted", "On Leave"]
    dateOfBirth: Optional[str] = None
    specializedRole: Optional[str] = None
    skillTag: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "users"

class TicketHistory(BaseModel):
    status: str
    date: datetime = Field(default_factory=datetime.now)
    remark: str
    updatedBy: str

class Ticket(Document):
    ticket_id: str = Field(alias="id") # The custom string ID used in Node.js
    title: str
    description: str
    category: str
    priority: str = "Medium"
    status: str = "Pending"
    userEmail: str
    userName: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedTechnicianName: Optional[str] = None
    attachment: Optional[str] = None
    resolutionPhoto: Optional[str] = None
    resolutionNotes: Optional[str] = None
    remarks: Optional[str] = None
    history: List[TicketHistory] = []
    masterIncidentId: Optional[str] = None
    isMasterIncident: bool = False
    linkedTicketIds: List[str] = []
    location: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "tickets"

class WikiEntry(Document):
    title: str
    description: str
    resolution: str
    department: str
    technicianName: str
    createdAt: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "wikientries"

class LeaveRequest(Document):
    userEmail: str
    userName: str
    startDate: str
    endDate: str
    reason: str
    status: str = "Pending" # enum: ["Pending", "Approved", "Rejected"]
    createdAt: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "leaverequests"

class Notification(Document):
    title: str
    message: str
    date: datetime = Field(default_factory=datetime.now)
    read: bool = False
    type: str = "info"
    userEmail: str
    createdAt: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "notifications"
