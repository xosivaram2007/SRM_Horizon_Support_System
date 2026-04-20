# 🌌 SRM Horizon - AI-Powered Campus Support System

<div align="center">
  <img src="./frontend/public/logo.png" alt="SRM Horizon Logo" width="200" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
  <p align="center">
    <strong>Elevating Campus Infrastructure Support through Intelligent Service Management.</strong>
  </p>
</div>

---

## 📖 Project Overview

**SRM Horizon** is a mission-critical support management platform designed for academic institutions. It streamlines the lifecycle of infrastructure maintenance and academic support tickets, bridging the gap between students, faculty, and technical departments. By leveraging AI-driven clustering and a multi-layered role architecture, it ensures that campus issues—from WiFi outages to facility repairs—are resolved with maximum efficiency.

This project was built to replace legacy manual tracking systems with a high-performance, real-time, and data-driven solution.

---

## 🛠️ Technology Stack

SRM Horizon utilizes a modern, decoupled architecture designed for scale and responsiveness:

### Frontend
- **Framework**: [React 19](https://react.dev/) (Vite-powered)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Iconography**: Lucide React
- **State Management**: React Context API

### Backend
- **Core Engine**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: [MongoDB](https://www.mongodb.com/) (Atlas or Local)
- **ODM**: [Beanie](https://beanie-odm.dev/) (Asynchronous ODM for MongoDB)
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt hashing
- **Mailing**: FastAPI-Mail (SMTP integration)

### AI & Intelligence
- **Google Gemini API**: Used for intelligent ticket clustering, priority estimation, and automated knowledge base generation.

---

## 📂 Project Structure

A clearly structured repository designed for maintainability and separation of concerns:

```text
SRM_Horizon_Finale/
├── 📂 backend/               # Primary Python/FastAPI Backend
│   ├── main.py               # Entry point, Beanie initialization & middleware
│   ├── models.py             # MongoDB Schema definitions (Users, Tickets, etc.)
│   ├── auth_util.py          # Security utilities & password hashing
│   ├── mail_util.py          # Email templates and SMTP config
│   ├── 📂 routes/            # Modular API endpoints
│   │   ├── auth.py           # Login, Token Management, Password Recovery
│   │   ├── users.py          # User management (Admin & SuperAdmin levels)
│   │   ├── tickets.py        # Ticketing CRUD, assigning, and resolution
│   │   └── misc.py           # Knowledge Base (Wiki), Leaves, Notifications
│   └── requirements.txt      # Python dependencies
├── 📂 frontend/              # React/Vite/TypeScript Frontend
│   ├── 📂 src/
│   │   ├── App.tsx           # Main application logic & Routing (UI Engine)
│   │   ├── index.css         # Global design system & Tailwind layers
│   │   └── main.tsx          # React application mount point
│   └── vite.config.ts        # Vite build configurations
├── 📂 backend_node/          # Legacy Express/Node.js implementation (Reference)
├── package.json              # Root task automation scripts
└── README.md                 # Project documentation (this file)
```

---

## ✨ Key Features

### 1. 🛡️ Deeply Grained Role-Based Access Control (RBAC)
- **SuperAdmin**: Full system control, high-level user auditing.
- **Admin**: Departmental oversight, technician assignment, and leave approval.
- **Technician**: Ticket resolution, knowledge base contributions, leave requests.
- **Student/Staff/Faculty**: Ticket creation, tracking, and account recovery.

### 2. 🎫 Intelligent Ticketing System
- **Smart Clustering**: Automatically links similar tickets to a "Master Incident," preventing redundant work for technicians.
- **Priority Engine**: Dynamic priority levels (High, Medium, Low) based on category and urgency.
- **History Tracking**: Complete audit trail for every ticket update.

### 3. 🧠 Knowledge Management (Wiki)
- A specialized "Wiki" module where technicians document resolutions for recurring issues, building a searchable campus knowledge base.

### 4. ✉️ Communication Engine
- **In-App Notifications**: Real-time updates for ticket assignments and status changes.
- **Email Alerts**: Automatic email notifications for critical events, resolution alerts, and OTP-based password recovery.

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Instance (Local or Atlas)

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# Create a .env file based on environment needs (MONGODB_URI, GEMINI_API_KEY)
python main.py
```

### 2. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables (.env)
Ensure the following variables are configured in your `backend/.env`:
- `MONGODB_URI`: Connection string to your MongoDB database.
- `GEMINI_API_KEY`: Your API key from Google AI Studio.
- `MAIL_USERNAME/PASSWORD/SERVER`: SMTP configuration for email notifications.

---

## 📈 Value Proposition for Reports & PPTs

- **Scalability**: The use of FastAPI and MongoDB ensures the system can handle thousands of concurrent tickets and users.
- **AI Integration**: Demonstrates state-of-the-art use of Generative AI for operational efficiency (ticket clustering).
- **User Experience**: Built with Framer Motion and Tailwind CSS 4 for a premium, mobile-responsive desktop experience.
- **Security**: Implements industry-standard JWT authentication and password hashing.

---

<p align="center">
  Built with ❤️ for the SRM Community.
</p>
