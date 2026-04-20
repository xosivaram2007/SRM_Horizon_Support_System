import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv
from datetime import datetime

# Models
from models import User, Ticket, WikiEntry, LeaveRequest, Notification
from auth_util import get_password_hash

# Routes
from routes.auth import router as auth_router
from routes.users import router as user_router, admin_router
from routes.tickets import router as ticket_router
from routes.misc import router as misc_router

load_dotenv()

app = FastAPI(title="SRM Horizon API", version="2.0.0")

# ─── Middleware ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MongoDB Connection & Beanie Initialization ───────────
@app.on_event("startup")
async def startup_event():
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/srm_horizon")
    client = AsyncIOMotorClient(mongo_uri)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[User, Ticket, WikiEntry, LeaveRequest, Notification]
    )
    print(f"MongoDB connected: {mongo_uri}")
    await seed_default_users()

async def seed_default_users():
    count = await User.count()
    if count > 0:
        return

    print("Seeding default users into MongoDB...")
    default_users = [
        {
            "fullName": "Super Admin",
            "email": "hawlaraj3@gmail.com",
            "password": get_password_hash("SRM@2026"),
            "role": "SuperAdmin",
            "department": "Administration",
            "regNumber": "SUPER-ADM-001",
            "status": "Active",
        },
        {
            "fullName": "Admin User",
            "email": "admin@srmap.edu.in",
            "password": get_password_hash("password123"),
            "role": "Admin",
            "department": "IT Support",
            "employeeId": "EMP-10042",
            "status": "Active",
        },
        {
            "fullName": "Rajesh Kumar",
            "email": "student@srmap.edu.in",
            "password": get_password_hash("password123"),
            "role": "Student",
            "department": "B.Tech Computer Science and Engineering",
            "regNumber": "AP20230000042",
            "status": "Active",
        },
        {
            "fullName": "John Doe",
            "email": "john@srmap.edu.in",
            "password": get_password_hash("password123"),
            "role": "Technician",
            "department": "Technical Support",
            "technicianId": "TECH-IT-001",
            "skillTag": "Networking, Software",
            "status": "Active",
        },
        {
            "fullName": "Sarah Smith",
            "email": "sarah@srmap.edu.in",
            "password": get_password_hash("password123"),
            "role": "Technician",
            "department": "Facility Maintenance",
            "technicianId": "TECH-ELEC-001",
            "skillTag": "Electrical, Wiring",
            "status": "Active",
        },
    ]
    
    for u_data in default_users:
        user = User(**u_data)
        await user.insert()
    print(f"Seeded {len(default_users)} default users.")

# ─── Include Routes ───────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(ticket_router, prefix="/api")
app.include_router(misc_router, prefix="/api")

# ─── Health check ─────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "mongodb": "connected",
        "time": datetime.now().isoformat(),
    }

# ─── Static Files & Frontend SPA ──────────────────────────
# Serve frontend dist if it exists
dist_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index_file = os.path.join(dist_path, "index.html")
        return FileResponse(index_file)
else:
    @app.get("/")
    async def root():
        return {"message": "SRM Horizon API is running. Frontend dist not found."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
