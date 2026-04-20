import random
import time
from typing import Dict
from fastapi import APIRouter, HTTPException, Body, Depends
from models import User
from auth_util import verify_password, get_password_hash, create_access_token
from mail_util import send_email
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory OTP store (equivalent to Node.js otpStore)
otp_store: Dict[str, Dict] = {}

class LoginRequest(BaseModel):
    emailOrUsername: str
    password: str

class EmailRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    newPassword: str

class ChangePasswordRequest(BaseModel):
    email: EmailStr
    currentPassword: str
    newPassword: str

@router.post("/login")
async def login(req: LoginRequest):
    email = req.emailOrUsername.strip().lower()
    
    user = await User.find_one(User.email == email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    if user.status == "Blocked":
        raise HTTPException(status_code=403, detail="Your account has been blocked. Contact an administrator.")
    
    if not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_access_token(data={"id": str(user.id), "email": user.email, "role": user.role})
    
    user_payload = {
        "fullName": user.fullName,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "regNumber": user.regNumber,
        "technicianId": user.technicianId,
        "employeeId": user.employeeId,
        "adminLevel": user.adminLevel,
        "avatarUrl": user.avatarUrl,
        "status": user.status,
        "dateOfBirth": user.dateOfBirth,
        "skillTag": user.skillTag,
    }
    
    return {"success": True, "token": token, "user": user_payload}

@router.post("/send-otp")
async def send_otp(req: EmailRequest):
    otp = str(random.randint(100000, 999999))
    expires = time.time() + 10 * 60 # 10 minutes
    otp_store[req.email.lower()] = {"otp": otp, "expires": expires}
    
    html = f"""
    <div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
        <h2 style="color:#527490">SRM Horizon Verification</h2>
        <p>Your OTP is:</p>
        <div style="font-size:32px;font-weight:bold;color:#527490;letter-spacing:5px;margin:20px 0">{otp}</div>
        <p>Valid for 10 minutes.</p>
    </div>
    """
    
    await send_email(req.email, "Your Verification Code - SRM Horizon", html)
    return {"success": True, "message": "OTP sent to your email."}

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    stored = otp_store.get(req.email.lower())
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP found for this email.")
    
    if time.time() > stored["expires"]:
        del otp_store[req.email.lower()]
        raise HTTPException(status_code=400, detail="OTP expired.")
    
    if stored["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
    
    del otp_store[req.email.lower()]
    return {"success": True, "message": "OTP verified."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    hashed = get_password_hash(req.newPassword)
    user = await User.find_one(User.email == req.email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user.password = hashed
    await user.save()
    return {"success": True, "message": "Password reset successfully."}

@router.post("/change-password")
async def change_password(req: ChangePasswordRequest):
    user = await User.find_one(User.email == req.email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if not verify_password(req.currentPassword, user.password):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    
    user.password = get_password_hash(req.newPassword)
    await user.save()
    return {"success": True, "message": "Password changed successfully."}
