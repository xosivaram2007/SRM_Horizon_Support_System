from typing import List, Optional
from fastapi import APIRouter, HTTPException, Body
from models import User
from auth_util import get_password_hash
from mail_util import send_email
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["users"])

class UserCreate(BaseModel):
    fullName: str
    email: EmailStr
    dateOfBirth: Optional[str] = None
    role: Optional[str] = "Student"
    regNumber: Optional[str] = None
    department: Optional[str] = "General"
    skillTag: Optional[str] = None
    technicianId: Optional[str] = None
    employeeId: Optional[str] = None
    specializedRole: Optional[str] = None
    yearOfStudy: Optional[str] = None
    adminLevel: Optional[str] = None
    avatarUrl: Optional[str] = None
    status: Optional[str] = "Active"

class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    regNumber: Optional[str] = None
    skillTag: Optional[str] = None
    technicianId: Optional[str] = None
    employeeId: Optional[str] = None
    specializedRole: Optional[str] = None
    adminLevel: Optional[str] = None
    yearOfStudy: Optional[str] = None
    status: Optional[str] = None
    dateOfBirth: Optional[str] = None
    avatarUrl: Optional[str] = None

class BulkUserRequest(BaseModel):
    users: List[UserCreate]

class BulkDeleteRequest(BaseModel):
    emails: List[str]

@router.get("/")
async def get_users():
    users = await User.find_all().to_list()
    # Exclude passwords
    return {"success": True, "users": [u.dict(exclude={"password"}) for u in users]}

@router.get("/{email}")
async def get_user(email: str):
    user = await User.find_one(User.email == email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "user": user.dict(exclude={"password"})}

@router.post("/")
async def create_user(u: UserCreate):
    email_lower = u.email.lower()
    exists = await User.find_one(User.email == email_lower)
    if exists:
        raise HTTPException(status_code=409, detail="A user with this email already exists.")
    
    raw_password = u.dateOfBirth or "password123"
    hashed_password = get_password_hash(raw_password)
    
    # Create user data dict with hashed password and normalized email
    user_data = u.model_dump()
    user_data["email"] = email_lower
    user_data["password"] = hashed_password
    
    new_user = User(**user_data)
    await new_user.insert()
    
    # Send welcome email
    html = f"""
    <div style="font-family:sans-serif;padding:30px;border:1px solid #eee;border-radius:12px;max-width:520px;margin:auto">
        <h2 style="color:#527490;margin-bottom:4px">Welcome to SRM Horizon!</h2>
        <p style="color:#666">Hello <strong>{u.fullName}</strong>,</p>
        <p>Your account has been created by the Super Admin.</p>
        <div style="background:#f5f9ff;border-left:4px solid #527490;padding:16px;border-radius:6px;margin:20px 0">
            <p style="margin:4px 0"><strong>Email:</strong> {email_lower}</p>
            <p style="margin:4px 0"><strong>Role:</strong> {u.role}</p>
            <p style="margin:4px 0"><strong>Initial Password:</strong> <code style="background:#eee;padding:2px 6px;border-radius:4px">{raw_password}</code></p>
        </div>
        <p style="color:#e74c3c;font-weight:600">⚠️ Please log in and change your password immediately.</p>
    </div>
    """
    await send_email(email_lower, "Welcome to SRM Horizon – Your Account Details", html)
    
    return {"success": True, "user": new_user.dict(exclude={"password"}), "message": "User created and email sent."}

@router.post("/bulk")
async def bulk_create_users(req: BulkUserRequest):
    results = []
    created_count = 0
    
    for u in req.users:
        email_lower = u.email.lower()
        exists = await User.find_one(User.email == email_lower)
        if exists:
            results.append({"email": email_lower, "status": "skipped", "reason": "already exists"})
            continue
        
        raw_password = u.dateOfBirth or "password123"
        hashed_password = get_password_hash(raw_password)
        
        # Create user data dict with hashed password and normalized email
        user_data = u.model_dump()
        user_data["email"] = email_lower
        user_data["password"] = hashed_password
        
        new_user = User(**user_data)
        await new_user.insert()
        created_count += 1
        
        html = f"<p>Hello {u.fullName}, your account is ready. Password: {raw_password}</p>"
        await send_email(email_lower, "Your SRM Horizon Account", html)
        results.append({"email": email_lower, "status": "created"})
        
    return {"success": True, "message": f"{created_count} users created.", "results": results}

@router.patch("/{email}")
async def update_user(email: str, updates: UserUpdate):
    user = await User.find_one(User.email == email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    await user.save()
    return {"success": True, "user": user.dict(exclude={"password"})}

@router.delete("/{email}")
async def delete_user(email: str):
    email_lower = email.lower()
    if email_lower == "hawlaraj3@gmail.com":
        raise HTTPException(status_code=403, detail="Cannot delete the Super Admin account.")
    
    user = await User.find_one(User.email == email_lower)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    await user.delete()
    return {"success": True, "message": "User deleted."}

@router.post("/bulk/delete")
async def bulk_delete_users(req: BulkDeleteRequest):
    filtered = [e.lower() for e in req.emails if e.lower() != "hawlaraj3@gmail.com"]
    result = await User.find(User.email.in_(filtered)).delete()
    return {"success": True, "message": f"{result} users deleted."}

# ============================================================
# LEGACY ADMIN ROUTES (Compatibility)
# ============================================================

admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.post("/bulk-create-users")
async def admin_bulk_create(req: BulkUserRequest):
    # Delegate to the same logic as /bulk
    return await bulk_create_users(req)

@admin_router.post("/create-admin")
async def create_admin(u: UserCreate):
    u.role = "Admin"
    u.department = "Administration"
    return await create_user(u)
