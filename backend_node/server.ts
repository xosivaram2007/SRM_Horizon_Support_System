import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import mongoose, { Schema, Document, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// MONGOOSE MODELS
// ============================================================

interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  regNumber?: string;
  technicianId?: string;
  yearOfStudy?: string;
  employeeId?: string;
  adminLevel?: string;
  avatarUrl?: string;
  status: string;
  dateOfBirth?: string;
  specializedRole?: string;
  skillTag?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: "Student", enum: ["Student", "Staff", "Faculty", "Admin", "Technician", "SuperAdmin"] },
  department: { type: String, default: "General" },
  regNumber: String,
  technicianId: String,
  yearOfStudy: String,
  employeeId: String,
  adminLevel: String,
  avatarUrl: String,
  status: { type: String, default: "Active", enum: ["Active", "Held", "Blocked", "Restricted", "On Leave"] },
  dateOfBirth: String,
  specializedRole: String,
  skillTag: String,
  createdAt: { type: Date, default: Date.now },
});

const User = model<IUser>("User", UserSchema);

interface ITicket extends Document {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  userEmail: string;
  userName?: string;
  assignedTo?: string;
  assignedTechnicianName?: string;
  attachment?: string;
  resolutionPhoto?: string;
  resolutionNotes?: string;
  remarks?: string;
  history: Array<{ status: string; date: Date; remark: string; updatedBy: string }>;
  masterIncidentId?: string;
  isMasterIncident?: boolean;
  linkedTicketIds: string[];
  location?: string;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, default: "Medium" },
  status: { type: String, default: "Pending" },
  userEmail: { type: String, required: true },
  userName: String,
  assignedTo: String,
  assignedTechnicianName: String,
  attachment: String,
  resolutionPhoto: String,
  resolutionNotes: String,
  remarks: String,
  history: [{ status: String, date: Date, remark: String, updatedBy: String }],
  masterIncidentId: String,
  isMasterIncident: { type: Boolean, default: false },
  linkedTicketIds: [String],
  location: String,
  createdAt: { type: Date, default: Date.now },
});

const Ticket = model<ITicket>("Ticket", TicketSchema);

interface IWikiEntry extends Document {
  title: string;
  description: string;
  resolution: string;
  department: string;
  technicianName: string;
  createdAt: Date;
}

const WikiSchema = new Schema<IWikiEntry>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  resolution: { type: String, required: true },
  department: { type: String, required: true },
  technicianName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const WikiEntry = model<IWikiEntry>("WikiEntry", WikiSchema);

interface ILeaveRequest extends Document {
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: Date;
}

const LeaveSchema = new Schema<ILeaveRequest>({
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Pending", enum: ["Pending", "Approved", "Rejected"] },
  createdAt: { type: Date, default: Date.now },
});

const LeaveRequest = model<ILeaveRequest>("LeaveRequest", LeaveSchema);

interface INotification extends Document {
  id?: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: string;
  userEmail: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, default: "info" },
  userEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const NotificationModel = model<INotification>("Notification", NotificationSchema);


// ============================================================
// HELPER: SEND EMAIL
// ============================================================

async function createTransporter() {
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const secure = smtpPort === 465;
  // Clean the password (remove spaces) which are common in Google App Passwords
  const cleanPass = (process.env.SMTP_PASS || "").replace(/\s/g, "");

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: cleanPass,
    },
    tls: { rejectUnauthorized: false },
  });
}

async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[MOCK EMAIL] To: ${to}\nSubject: ${subject}\n(Configure SMTP in .env to send real emails)`);
    return { mocked: true };
  }
  
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"SRM Horizon Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err: any) {
    console.error(`❌ SMTP ERROR for ${to}:`, err.message);
    if (err.message.includes('535-5.7.8')) {
      console.error("   TIP: This looks like an authentication error. Please verify your App Password in .env.");
    }
    throw err;
  }
}

// ============================================================
// HELPER: SEED DEFAULT USERS
// ============================================================

async function seedDefaultUsers() {
  const count = await User.countDocuments();
  if (count > 0) return;

  console.log("📦 Seeding default users into MongoDB...");

  const defaultUsers = [
    {
      fullName: "Super Admin",
      email: "hawlaraj3@gmail.com",
      password: await bcrypt.hash("SRM@2026", 10),
      role: "SuperAdmin",
      department: "Administration",
      regNumber: "SUPER-ADM-001",
      status: "Active",
    },
    {
      fullName: "Admin User",
      email: "admin@srmap.edu.in",
      password: await bcrypt.hash("password123", 10),
      role: "Admin",
      department: "IT Support",
      employeeId: "EMP-10042",
      status: "Active",
    },
    {
      fullName: "Rajesh Kumar",
      email: "student@srmap.edu.in",
      password: await bcrypt.hash("password123", 10),
      role: "Student",
      department: "B.Tech Computer Science and Engineering",
      regNumber: "AP20230000042",
      status: "Active",
    },
    {
      fullName: "John Doe",
      email: "john@srmap.edu.in",
      password: await bcrypt.hash("password123", 10),
      role: "Technician",
      department: "Technical Support",
      technicianId: "TECH-IT-001",
      skillTag: "Networking, Software",
      status: "Active",
    },
    {
      fullName: "Sarah Smith",
      email: "sarah@srmap.edu.in",
      password: await bcrypt.hash("password123", 10),
      role: "Technician",
      department: "Facility Maintenance",
      technicianId: "TECH-ELEC-001",
      skillTag: "Electrical, Wiring",
      status: "Active",
    },
  ];

  await User.insertMany(defaultUsers);
  console.log(`✅ Seeded ${defaultUsers.length} default users.`);
}

// ============================================================
// MAIN SERVER
// ============================================================

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // ─── Middleware ───────────────────────────────────────────
  app.use(cors({ origin: "*", credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  // ─── MongoDB Connection ───────────────────────────────────
  const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/srm_horizon";
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB connected: ${MONGO_URI}`);
    await seedDefaultUsers();
  } catch (err: any) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️  Running without MongoDB – data will not be persisted on server.");
  }

  // In-memory OTP store
  const otpStore = new Map<string, { otp: string; expires: number }>();

  // ============================================================
  // AUTH ROUTES
  // ============================================================

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const email = emailOrUsername.trim().toLowerCase();
    const pass = password.trim();

    try {
      const dbUser = await User.findOne({ email });
      if (!dbUser) {
        return res.status(401).json({ success: false, message: "Invalid email or password." });
      }

      if (dbUser.status === "Blocked") {
        return res.status(403).json({ success: false, message: "Your account has been blocked. Contact an administrator." });
      }

      const match = await bcrypt.compare(pass, dbUser.password);
      if (!match) {
        return res.status(401).json({ success: false, message: "Invalid email or password." });
      }

      const token = jwt.sign({ id: dbUser._id, email: dbUser.email, role: dbUser.role }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

      const userPayload = {
        fullName: dbUser.fullName,
        email: dbUser.email,
        role: dbUser.role,
        department: dbUser.department,
        regNumber: dbUser.regNumber,
        technicianId: dbUser.technicianId,
        employeeId: dbUser.employeeId,
        adminLevel: dbUser.adminLevel,
        avatarUrl: dbUser.avatarUrl,
        status: dbUser.status,
        dateOfBirth: dbUser.dateOfBirth,
        skillTag: dbUser.skillTag,
      };

      return res.json({ success: true, token, user: userPayload });
    } catch (err: any) {
      console.error("Login error:", err);
      return res.status(500).json({ success: false, message: "Server error during login." });
    }
  });

  // POST /api/auth/send-otp
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;
    otpStore.set(email.toLowerCase(), { otp, expires });

    try {
      const result = await sendEmail(
        email,
        "Your Verification Code - SRM Horizon",
        `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
          <h2 style="color:#527490">SRM Horizon Verification</h2>
          <p>Your OTP is:</p>
          <div style="font-size:32px;font-weight:bold;color:#527490;letter-spacing:5px;margin:20px 0">${otp}</div>
          <p>Valid for 10 minutes.</p>
        </div>`
      );

      if ((result as any).mocked) {
        return res.json({ success: true, message: "OTP generated (Mock mode - no SMTP configured).", otp });
      }
      return res.json({ success: true, message: "OTP sent to your email." });
    } catch (err: any) {
      console.error("OTP email error:", err);
      return res.status(500).json({ success: false, message: "Failed to send OTP email." });
    }
  });

  // POST /api/auth/verify-otp
  app.post("/api/auth/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(email?.toLowerCase());
    if (!stored) return res.status(400).json({ success: false, message: "No OTP found for this email." });
    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: "OTP expired." });
    }
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP." });
    otpStore.delete(email);
    return res.json({ success: true, message: "OTP verified." });
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ success: false, message: "Email and new password required." });
    try {
      const hashed = await bcrypt.hash(newPassword, 10);
      await User.updateOne({ email: email.toLowerCase() }, { password: hashed });
      return res.json({ success: true, message: "Password reset successfully." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
      const dbUser = await User.findOne({ email: email.toLowerCase() });
      if (!dbUser) return res.status(404).json({ success: false, message: "User not found." });
      const match = await bcrypt.compare(currentPassword, dbUser.password);
      if (!match) return res.status(401).json({ success: false, message: "Current password is incorrect." });
      dbUser.password = await bcrypt.hash(newPassword, 10);
      await dbUser.save();
      return res.json({ success: true, message: "Password changed successfully." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // ============================================================
  // USER ROUTES
  // ============================================================

  // GET /api/users  - List all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await User.find({}, { password: 0 }).lean();
      return res.json({ success: true, users });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch users." });
    }
  });

  // GET /api/users/:email  - Get a single user
  app.get("/api/users/:email", async (req, res) => {
    try {
      const user = await User.findOne({ email: req.params.email.toLowerCase() }, { password: 0 }).lean();
      if (!user) return res.status(404).json({ success: false, message: "User not found." });
      return res.json({ success: true, user });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // POST /api/users  - Create a single user & send email
  app.post("/api/users", async (req, res) => {
    const { fullName, email, dateOfBirth, role, regNumber, department, skillTag, technicianId, employeeId } = req.body;
    if (!fullName || !email) return res.status(400).json({ success: false, message: "Name and email are required." });

    const emailLower = email.toLowerCase();
    try {
      const exists = await User.findOne({ email: emailLower });
      if (exists) return res.status(409).json({ success: false, message: "A user with this email already exists." });

      const rawPassword = dateOfBirth || "password123";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const newUser = await User.create({
        fullName,
        email: emailLower,
        password: hashedPassword,
        role: role || "Student",
        department: department || "General",
        regNumber,
        skillTag,
        technicianId,
        employeeId,
        dateOfBirth,
        status: "Active",
      });

      // Send welcome email
      try {
        await sendEmail(
          emailLower,
          "Welcome to SRM Horizon – Your Account Details",
          `<div style="font-family:sans-serif;padding:30px;border:1px solid #eee;border-radius:12px;max-width:520px;margin:auto">
            <h2 style="color:#527490;margin-bottom:4px">Welcome to SRM Horizon!</h2>
            <p style="color:#666">Hello <strong>${fullName}</strong>,</p>
            <p>Your account has been created by the Super Admin.</p>
            <div style="background:#f5f9ff;border-left:4px solid #527490;padding:16px;border-radius:6px;margin:20px 0">
              <p style="margin:4px 0"><strong>Email:</strong> ${emailLower}</p>
              <p style="margin:4px 0"><strong>Role:</strong> ${role || "Student"}</p>
              <p style="margin:4px 0"><strong>Initial Password:</strong> <code style="background:#eee;padding:2px 6px;border-radius:4px">${rawPassword}</code></p>
            </div>
            <p style="color:#e74c3c;font-weight:600">⚠️ Please log in and change your password immediately.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="font-size:12px;color:#aaa">SRM University AP • Enterprise Support Network</p>
          </div>`
        );
        console.log(`📧 Welcome email sent to ${emailLower}`);
      } catch (mailErr: any) {
        console.error("Email send failed:", mailErr.message);
      }

      const { password: _, ...userOut } = newUser.toObject();
      return res.status(201).json({ success: true, user: userOut, message: "User created and email sent." });
    } catch (err: any) {
      console.error("Create user error:", err);
      return res.status(500).json({ success: false, message: err.message || "Server error." });
    }
  });

  // POST /api/users/bulk  - Bulk create users & send emails
  app.post("/api/users/bulk", async (req, res) => {
    const { users: usersToCreate } = req.body;
    if (!Array.isArray(usersToCreate) || usersToCreate.length === 0) {
      return res.status(400).json({ success: false, message: "A non-empty users array is required." });
    }

    const results: any[] = [];
    for (const u of usersToCreate) {
      const { fullName, email, dateOfBirth, role, regNumber, department, skillTag, technicianId } = u;
      const emailLower = (email || "").toLowerCase();

      try {
        const exists = await User.findOne({ email: emailLower });
        if (exists) {
          results.push({ email: emailLower, status: "skipped", reason: "already exists" });
          continue;
        }
        const rawPassword = dateOfBirth || "password123";
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        await User.create({
          fullName,
          email: emailLower,
          password: hashedPassword,
          role: role || "Student",
          department: department || "General",
          regNumber,
          skillTag,
          technicianId,
          dateOfBirth,
          status: "Active",
        });

        // Send welcome email
        try {
          await sendEmail(
            emailLower,
            "Welcome to SRM Horizon – Your Account Details",
            `<div style="font-family:sans-serif;padding:30px;border:1px solid #eee;border-radius:12px;max-width:520px;margin:auto">
              <h2 style="color:#527490">Welcome to SRM Horizon!</h2>
              <p>Hello <strong>${fullName}</strong>,</p>
              <p>Your account has been created.</p>
              <div style="background:#f5f9ff;border-left:4px solid #527490;padding:16px;border-radius:6px;margin:20px 0">
                <p style="margin:4px 0"><strong>Email:</strong> ${emailLower}</p>
                <p style="margin:4px 0"><strong>Role:</strong> ${role || "Student"}</p>
                <p style="margin:4px 0"><strong>Password:</strong> <code style="background:#eee;padding:2px 6px;border-radius:4px">${rawPassword}</code></p>
              </div>
              <p style="color:#e74c3c;font-weight:600">⚠️ Please change your password after first login.</p>
            </div>`
          );
        } catch (mailErr: any) {
          console.warn(`  ⚠️ Email failed for ${emailLower}: ${mailErr.message}`);
        }

        results.push({ email: emailLower, status: "created" });
      } catch (err: any) {
        results.push({ email: emailLower, status: "error", reason: err.message });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    return res.json({ success: true, message: `${created} users created.`, results });
  });

  // PATCH /api/users/:email  - Update user
  app.patch("/api/users/:email", async (req, res) => {
    const updates = { ...req.body };
    delete updates.password; // Can't update password via this route
    try {
      const user = await User.findOneAndUpdate(
        { email: req.params.email.toLowerCase() },
        { $set: updates },
        { new: true, projection: { password: 0 } }
      ).lean();
      if (!user) return res.status(404).json({ success: false, message: "User not found." });
      return res.json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // DELETE /api/users/:email  - Delete user
  app.delete("/api/users/:email", async (req, res) => {
    const email = req.params.email.toLowerCase();
    if (email === "hawlaraj3@gmail.com") {
      return res.status(403).json({ success: false, message: "Cannot delete the Super Admin account." });
    }
    try {
      await User.deleteOne({ email });
      return res.json({ success: true, message: "User deleted." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // DELETE /api/users/bulk/delete  - Bulk delete
  app.post("/api/users/bulk/delete", async (req, res) => {
    const { emails } = req.body;
    if (!Array.isArray(emails)) return res.status(400).json({ success: false, message: "emails array required." });
    const filtered = emails.filter((e: string) => e.toLowerCase() !== "hawlaraj3@gmail.com");
    try {
      const result = await User.deleteMany({ email: { $in: filtered.map((e: string) => e.toLowerCase()) } });
      return res.json({ success: true, message: `${result.deletedCount} users deleted.` });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // ============================================================
  // TICKET ROUTES
  // ============================================================

  // GET /api/tickets
  app.get("/api/tickets", async (req, res) => {
    try {
      const { email, role } = req.query;
      const roleStr = String(role || "");
      const emailStr = String(email || "").toLowerCase();

      let query: any = {};
      
      // SuperAdmin or Admin should see all tickets
      // Standardize role check to handle potential casing or spacing issues
      const isAdminFlag = roleStr.toLowerCase().replace(/\s/g, "") === "admin" || 
                         roleStr.toLowerCase().replace(/\s/g, "") === "superadmin";

      if (!isAdminFlag) {
        query = { $or: [{ userEmail: emailStr }, { assignedTo: emailStr }] };
      }
      
      const tickets = await Ticket.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, tickets });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // POST /api/tickets
  app.post("/api/tickets", async (req, res) => {
    try {
      const ticket = await Ticket.create({ ...req.body, createdAt: new Date() });
      return res.status(201).json({ success: true, ticket });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // PATCH /api/tickets/:id
  app.patch("/api/tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let query: any = {};
      
      // If valid ObjectId, use _id, else search by custom id field
      if (mongoose.Types.ObjectId.isValid(id)) {
        query = { _id: id };
      } else {
        query = { id: id };
      }

      const ticket = await Ticket.findOneAndUpdate(query, { $set: req.body }, { new: true }).lean();
      if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
      return res.json({ success: true, ticket });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });


  // ============================================================
  // WIKI ROUTES
  // ============================================================

  app.get("/api/wiki", async (_req, res) => {
    try {
      const entries = await WikiEntry.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, entries });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  app.post("/api/wiki", async (req, res) => {
    try {
      const entry = await WikiEntry.create({ ...req.body, createdAt: new Date() });
      return res.status(201).json({ success: true, entry });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/wiki/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id: id };
      await WikiEntry.findOneAndDelete(query);
      return res.json({ success: true, message: "Wiki entry deleted." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });


  // ============================================================
  // LEAVE REQUEST ROUTES
  // ============================================================

  app.get("/api/leave", async (_req, res) => {
    try {
      const requests = await LeaveRequest.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, requests });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  app.post("/api/leave", async (req, res) => {
    try {
      const request = await LeaveRequest.create({ ...req.body, createdAt: new Date() });
      // Notify admin
      try {
        await sendEmail(
          process.env.SMTP_USER || "admin@srmap.edu.in",
          `Leave Request: ${req.body.userName}`,
          `<div style="font-family:sans-serif;padding:20px"><h3>New Leave Request</h3>
          <p><strong>From:</strong> ${req.body.userName}</p>
          <p><strong>Dates:</strong> ${req.body.startDate} to ${req.body.endDate}</p>
          <p><strong>Reason:</strong> ${req.body.reason}</p></div>`
        );
      } catch {}
      return res.status(201).json({ success: true, request });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch("/api/leave/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id: id };
      const request = await LeaveRequest.findOneAndUpdate(query, { $set: req.body }, { new: true }).lean();
      if (!request) return res.status(404).json({ success: false, message: "Request not found." });
      return res.json({ success: true, request });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // ============================================================
  // PERSISTENT NOTIFICATION ROUTES
  // ============================================================

  // GET /api/notifications?email=...
  app.get("/api/notifications", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email required." });
    try {
      const notifications = await NotificationModel.find({ userEmail: (email as string).toLowerCase() }).sort({ date: -1 }).lean();
      return res.json({ success: true, notifications });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // POST /api/notifications
  app.post("/api/notifications", async (req, res) => {
    try {
      const notification = await NotificationModel.create({ ...req.body, date: new Date() });
      return res.status(201).json({ success: true, notification });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // PATCH /api/notifications/:id - Mark as read
  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id: id };
      const notification = await NotificationModel.findOneAndUpdate(query, { $set: { read: true } }, { new: true }).lean();
      if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
      return res.json({ success: true, notification });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // DELETE /api/notifications - Clear all for a user
  app.delete("/api/notifications", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email required." });
    try {
      await NotificationModel.deleteMany({ userEmail: (email as string).toLowerCase() });
      return res.json({ success: true, message: "Notifications cleared." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // ============================================================
  // NOTIFICATION ROUTES (Email/Logic)
  // ============================================================


  app.post("/api/notifications/ticket-resolved", async (req, res) => {
    const { email, fullName, ticketId, ticketTitle } = req.body;
    if (!email || !ticketId) return res.status(400).json({ success: false, message: "Email and Ticket ID required." });
    try {
      await sendEmail(
        email,
        `Ticket Resolved: ${ticketId}`,
        `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
          <h2 style="color:#10b981">✅ Ticket Resolved</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your ticket <strong>"${ticketTitle}"</strong> (${ticketId}) has been resolved.</p>
        </div>`
      );
      return res.json({ success: true, message: "Notification sent." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/notifications/ticket-assigned", async (req, res) => {
    const { email, fullName, ticketId, ticketTitle, adminName } = req.body;
    if (!email || !ticketId) return res.status(400).json({ success: false, message: "Email and Ticket ID required." });
    try {
      await sendEmail(
        email,
        `New Ticket Assigned: ${ticketId}`,
        `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
          <h2 style="color:#3b82f6">🎫 New Ticket Assigned</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Ticket <strong>"${ticketTitle}"</strong> (${ticketId}) has been assigned to you by ${adminName}.</p>
        </div>`
      );
      return res.json({ success: true, message: "Assignment notification sent." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/notifications/leave-request", async (req, res) => {
    const { adminEmail, technicianName, startDate, endDate, reason } = req.body;
    try {
      await sendEmail(
        adminEmail || process.env.SMTP_USER || "",
        `Leave Request from ${technicianName}`,
        `<div style="font-family:sans-serif;padding:20px"><h3 style="color:#f59e0b">Leave Request</h3>
        <p><strong>From:</strong> ${technicianName}</p>
        <p><strong>Dates:</strong> ${startDate} → ${endDate}</p>
        <p><strong>Reason:</strong> ${reason}</p></div>`
      );
      return res.json({ success: true, message: "Leave notification sent." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/notifications/manual", async (req, res) => {
    const { email, emails, fullName, subject, message: msg, isBulk } = req.body;
    if ((!email && !emails) || !subject || !msg) {
      return res.status(400).json({ success: false, message: "Recipients, subject, and message are required." });
    }
    try {
      const html = `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
        <h2 style="color:#527490">Administrative Notification</h2>
        <p>Hello ${fullName || ""},</p>
        <div style="padding:15px;border-left:4px solid #527490;background:#f8fafc;margin:20px 0">
          <p style="margin:0">${msg}</p>
        </div>
      </div>`;
      if (isBulk && Array.isArray(emails)) {
        for (const e of emails) await sendEmail(e, subject, html).catch(() => {});
      } else {
        await sendEmail(email, subject, html);
      }
      return res.json({ success: true, message: "Notification(s) sent." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Legacy create-admin / bulk-create-users routes (kept for backward compat)
  app.post("/api/admin/create-admin", async (req, res) => {
    const { email, fullName, password } = req.body;
    if (!email || !fullName || !password) return res.status(400).json({ success: false, message: "All fields required." });
    try {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(409).json({ success: false, message: "Admin with this email already exists." });
      const hashed = await bcrypt.hash(password, 10);
      await User.create({ fullName, email: email.toLowerCase(), password: hashed, role: "Admin", department: "Administration", status: "Active" });
      try {
        await sendEmail(
          email,
          "Your Admin Access – SRM Horizon",
          `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto">
            <h2 style="color:#527490">SRM Horizon Admin Access</h2>
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>You have been appointed as an <strong>Admin</strong>.</p>
            <p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
            <p style="color:red">Please log in and change your password immediately.</p>
          </div>`
        );
      } catch {}
      return res.json({ success: true, message: "Admin created and email sent." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/bulk-create-users", async (req, res) => {
    // Delegate to /api/users/bulk logic
    const { users: usersArr } = req.body;
    req.body = { users: usersArr };
    // Inline logic same as /api/users/bulk
    const results: any[] = [];
    for (const u of (usersArr || [])) {
      const emailLower = (u.email || "").toLowerCase();
      try {
        const exists = await User.findOne({ email: emailLower });
        if (exists) { results.push({ email: emailLower, status: "skipped" }); continue; }
        const rawPassword = u.dateOfBirth || "password123";
        const hashed = await bcrypt.hash(rawPassword, 10);
        await User.create({ fullName: u.fullName, email: emailLower, password: hashed, role: u.role || "Student", department: u.department || "General", regNumber: u.regNumber, dateOfBirth: u.dateOfBirth, status: "Active" });
        try {
          await sendEmail(emailLower, "Your SRM Horizon Account", `<p>Hello ${u.fullName}, your account is ready. Password: ${rawPassword}</p>`);
        } catch {}
        results.push({ email: emailLower, status: "created" });
      } catch (err: any) {
        results.push({ email: emailLower, status: "error", reason: err.message });
      }
    }
    const created = results.filter((r) => r.status === "created").length;
    return res.json({ success: true, message: `${created} users processed.`, results });
  });

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  app.get("/api/health", (_req, res) => {
    return res.json({
      status: "ok",
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      time: new Date().toISOString(),
    });
  });

  // GET /api/test-email?to=...
  app.get("/api/test-email", async (req, res) => {
    const { to } = req.query;
    if (!to) return res.status(400).json({ success: false, message: "Recipient email required (?to=...)" });
    
    try {
      console.log(`\n🧪 Testing email delivery to: ${to}...`);
      await sendEmail(
        to as string,
        "SRM Horizon – SMTP Test Connection",
        "<h3>System Test</h3><p>If you are reading this, your SMTP configuration is <b>working perfectly!</b></p>"
      );
      return res.json({ success: true, message: `Success! Test email sent to ${to}. Check the server logs for details.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: `SMTP Failure: ${err.message}` });
    }
  });

  // ============================================================
  // SERVE FRONTEND IN PRODUCTION
  // ============================================================

  const distPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // ============================================================
  // START
  // ============================================================

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`\n🚀 Backend API running at http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Email Test: http://localhost:${PORT}/api/test-email?to=YOUR_EMAIL\n`);

    // Verify SMTP on startup
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = await createTransporter();
        await transporter.verify();
        console.log("✅ SMTP Connection: Connected and ready to send emails.");
      } catch (err: any) {
        console.warn("⚠️ SMTP Connection Warning:", err.message);
        console.warn("   Emails will fail until a valid App Password is provided in .env.");
      }
    } else {
      console.log("ℹ️ SMTP: Running in MOCK mode (no credentials in .env).");
    }
  });
}

startServer();
