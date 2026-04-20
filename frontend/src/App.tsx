import React, { useState, useEffect, ReactNode, createContext, useContext, FormEvent, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Ticket, 
  User, 
  MessageSquare, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  Send,
  ChevronRight,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Camera,
  Mic,
  Loader2,
  Moon,
  Sun,
  Lock,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  Image,
  Laptop,
  BookOpen,
  Wrench,
  Home,
  FileText,
  Library,
  Bus,
  ArrowLeft,
  Database,
  ArrowRight,
  Trash2,
  Check,
  Book,
  Calendar,
  UserCheck,
  Settings,
  Truck,
  Bot,
  Headphones,
  LifeBuoy,
  Globe,
  Square,
  Edit
} from 'lucide-react';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring, 
  useTransform 
} from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Context ---
const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });

interface UserProfile {
  fullName: string;
  email: string;
  role: 'Student' | 'Staff' | 'Faculty' | 'Admin' | 'Technician' | 'SuperAdmin';
  department: string;
  regNumber?: string;
  technicianId?: string;
  yearOfStudy?: string;
  employeeId?: string;
  adminLevel?: string;
  avatarUrl?: string;
  status?: 'Active' | 'Held' | 'Blocked' | 'Restricted' | 'On Leave';
  dateOfBirth?: string;
  specializedRole?: string;
  skillTag?: string;
}

interface Ticket {
  _id?: string;
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'Pending' | 'Resolved' | 'In Progress' | 'Assigned';
  date: string;
  userEmail: string;
  assignedTo?: string;
  assignedTechnicianName?: string;
  userName?: string;
  attachment?: string;
  resolutionPhoto?: string;
  resolutionNotes?: string;
  isWikiEntry?: boolean;
  remarks?: string;
  history?: {
    status: string;
    date: string;
    remark: string;
    updatedBy: string;
  }[];
  masterIncidentId?: string;
  isMasterIncident?: boolean;
  linkedTicketIds?: string[];
  location?: string;
}

interface WikiEntry {
  _id?: string;
  id: string;
  title: string;
  description: string;
  resolution: string;
  department: string;
  technicianName: string;
  date: string;
}

interface LeaveRequest {
  _id?: string;
  id: string;
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

interface TicketContextType {
  tickets: Ticket[];
  wikiEntries: WikiEntry[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'date' | 'status' | 'userEmail' | 'assignedTo' | 'userName' | 'priority'>) => string | null;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  assignTechnician: (ticketId: string, technicianId: string, technicianName: string) => Promise<void>;
  addToWiki: (entry: Omit<WikiEntry, 'id' | 'date'>) => void;
  deleteWikiEntry: (id: string) => void;
}

interface UserContextType {
  users: UserProfile[];
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
  addUserLocal: (user: UserProfile) => void;
  updateUserLocal: (email: string, updates: Partial<UserProfile>) => void;
  deleteUserLocal: (email: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const addUserLocal = (user: UserProfile) => setUsers(prev => [user, ...prev]);
  const updateUserLocal = (email: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, ...updates } : u));
  };
  const deleteUserLocal = (email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
  };

  return (
    <UserContext.Provider value={{ users, isLoading, refreshUsers, addUserLocal, updateUserLocal, deleteUserLocal }}>
      {children}
    </UserContext.Provider>
  );
};

interface LeaveContextType {

  leaveRequests: LeaveRequest[];
  requestLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateLeaveStatus: (requestId: string, status: 'Approved' | 'Rejected') => void;
  approveLeave: (requestId: string) => void;
  rejectLeave: (requestId: string) => void;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (userData: UserProfile, remember?: boolean) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<UserProfile>) => void;
  register: (userData: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  register: () => {},
});

const TicketContext = createContext<TicketContextType>({
  tickets: [],
  wikiEntries: [],
  addTicket: () => {},
  updateTicket: () => {},
  assignTechnician: async () => {},
  addToWiki: () => {},
  deleteWikiEntry: () => {},
});

const LeaveContext = createContext<LeaveContextType>({
  leaveRequests: [],
  requestLeave: async () => {},
  updateLeaveStatus: () => {},
  approveLeave: () => {},
  rejectLeave: () => {},
});

interface Notification {
  _id?: string;
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  userEmail: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearAll: () => {},
});

const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications from API on load
  useEffect(() => {
    if (user?.email) {
      fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setNotifications(data.notifications);
        })
        .catch(err => console.error('Fetch notifications error:', err));
    } else {
      setNotifications([]);
    }
  }, [user?.email]);

  const addNotification = (notif: Omit<Notification, 'id' | 'date' | 'read'>) => {
    if (!user) return;
    
    const newNotif = {
      ...notif,
      userEmail: user.email,
      date: new Date().toISOString(),
      read: false,
    };

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(prev => [data.notification, ...prev]);
        }
      })
      .catch(err => console.error('Add notification error:', err));
  };

  const markAsRead = (id: string) => {
    fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(prev => prev.map(n => n._id === id || n.id === id ? { ...n, read: true } : n));
        }
      })
      .catch(err => console.error('Mark as read error:', err));
  };

  const clearAll = () => {
    if (!user) return;
    fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications([]);
        }
      })
      .catch(err => console.error('Clear notifications error:', err));
  };

  const userNotifications = notifications.filter(n => n.userEmail === user?.email);

  return (
    <NotificationContext.Provider value={{ notifications: userNotifications, addNotification, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('active_user') || sessionStorage.getItem('active_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Keep user in sync with storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'active_user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData: UserProfile, remember: boolean = false, token?: string) => {
    setUser(userData);
    if (remember) {
      localStorage.setItem('active_user', JSON.stringify(userData));
      if (token) localStorage.setItem('auth_token', token);
      sessionStorage.removeItem('active_user');
      sessionStorage.removeItem('auth_token');
    } else {
      sessionStorage.setItem('active_user', JSON.stringify(userData));
      if (token) sessionStorage.setItem('auth_token', token);
      localStorage.removeItem('active_user');
      localStorage.removeItem('auth_token');
    }
  };

  const register = async (userData: UserProfile & { password?: string }) => {
    // Register user via API
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        login(data.user, true);
      }
    } catch (err) {
      console.error('Register API error:', err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('active_user');
    sessionStorage.removeItem('active_user');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  };

  const updateUser = (updatedData: Partial<UserProfile>) => {
    if (user) {
      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      
      // Update in backend
      fetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      }).catch(err => console.error('updateUser API error:', err));

      const isPersistent = !!localStorage.getItem('active_user');
      const storage = isPersistent ? localStorage : sessionStorage;
      storage.setItem('active_user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, register }}>
      {children}
    </AuthContext.Provider>
  );
};

const LeaveProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Fetch leave requests from API
  useEffect(() => {
    if (user) {
      fetch('/api/leave')
        .then(res => res.json())
        .then(data => {
          if (data.success) setLeaveRequests(data.requests);
        })
        .catch(err => console.error('Fetch leave requests error:', err));
    }
  }, [user]);

  const requestLeave = async (req: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (data.success) {
        setLeaveRequests(prev => [data.request, ...prev]);
        
        // Also send notification to admin
        fetch('/api/notifications/leave-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminEmail: 'admin@srmap.edu.in',
            technicianName: req.userName,
            startDate: req.startDate,
            endDate: req.endDate,
            reason: req.reason,
          }),
        }).catch(err => console.error('Failed to send leave notification:', err));
      }
    } catch (error) {
      console.error('Failed to request leave:', error);
    }
  };

  const updateLeaveStatus = (requestId: string, status: 'Approved' | 'Rejected') => {
    fetch(`/api/leave/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeaveRequests(prev => prev.map(r => (r._id === requestId || r.id === requestId) ? data.request : r));
          
          if (status === 'Approved') {
            const request = leaveRequests.find(r => r._id === requestId || r.id === requestId);
            if (request) {
              fetch(`/api/users/${encodeURIComponent(request.userEmail)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'On Leave' }),
              }).catch(err => console.error('Leave approve user status update error:', err));
            }
          }
        }
      })
      .catch(err => console.error('Update leave status error:', err));
  };

  const approveLeave = (requestId: string) => updateLeaveStatus(requestId, 'Approved');
  const rejectLeave = (requestId: string) => updateLeaveStatus(requestId, 'Rejected');

  return (
    <LeaveContext.Provider value={{ leaveRequests, requestLeave, updateLeaveStatus, approveLeave, rejectLeave }}>
      {children}
    </LeaveContext.Provider>
  );
};

const formatDateForPassword = (dateStr: string) => {
  if (!dateStr) return '';
  // If it's already in DDMMYYYY format (8 digits), return as is
  if (/^\d{8}$/.test(dateStr)) return dateStr;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Try to extract digits if it's YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${d}${m}${y}`;
    }
    return dateStr.replace(/-/g, '');
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
};

const TicketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);

  // Fetch tickets and wiki on load
  useEffect(() => {
    if (user) {
      const params = new URLSearchParams({ email: user.email, role: user.role });
      fetch(`/api/tickets?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setTickets(data.tickets);
        })
        .catch(err => console.error('Fetch tickets error:', err));

      fetch('/api/wiki')
        .then(res => res.json())
        .then(data => {
          if (data.success) setWikiEntries(data.entries);
        })
        .catch(err => console.error('Fetch wiki error:', err));
    }
  }, [user]);

  const addToWiki = (entry: Omit<WikiEntry, 'id' | 'date'>) => {
    fetch('/api/wiki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setWikiEntries(prev => [data.entry, ...prev]);
      })
      .catch(err => console.error('Add to wiki error:', err));
  };

  const deleteWikiEntry = (id: string) => {
    fetch(`/api/wiki/${id}`, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setWikiEntries(prev => prev.filter(e => (e as any)._id !== id && e.id !== id));
      })
      .catch(err => console.error('Delete wiki error:', err));
  };

  const addTicket = (ticketData: Omit<Ticket, 'id' | 'date' | 'status' | 'userEmail' | 'assignedTo' | 'userName' | 'priority'>) => {
    if (!user) return null;
    
    // Clustering Logic (In-memory check against local state to suggest links)
    const findCluster = () => {
      const keywords = (ticketData.title + ' ' + ticketData.description).toLowerCase().split(/\W+/).filter(w => w.length > 3);
      return tickets.find(t => {
        if (t.status === 'Resolved' || t.category !== ticketData.category) return false;
        const tKeywords = (t.title + ' ' + t.description).toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const common = keywords.filter(k => tKeywords.includes(k));
        return common.length >= 2;
      });
    };

    const clusterMatch = findCluster();
    let masterId: string | undefined = clusterMatch?.isMasterIncident ? clusterMatch.id : (clusterMatch ? clusterMatch.id : undefined);

    const newTicket = {
      ...ticketData,
      id: `#TK-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending',
      priority: 'Medium',
      userEmail: user.email,
      userName: user.fullName,
      masterIncidentId: masterId,
    };

    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTickets(prev => [data.ticket, ...prev]);
          if (clusterMatch) {
            addNotification({
              title: 'Issue Clustered',
              message: `Your report has been linked to an existing issue (${masterId}). We're already working on it!`,
              type: 'info',
              userEmail: user.email,
            });
          }
        }
      })
      .catch(err => console.error('Add ticket error:', err));

    return newTicket.id;
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    const ticket = tickets.find(t => t.id === ticketId || (t as any)._id === ticketId);
    if (!ticket) return;

    const isResolving = updates.status === 'Resolved' && ticket.status !== 'Resolved';
    const idToUse = (ticket as any)._id || ticket.id;

    fetch(`/api/tickets/${encodeURIComponent(idToUse)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then(res => res.json())
      .then(async data => {
        if (data.success) {
          setTickets(prev => prev.map(t => (t.id === ticketId || (t as any)._id === ticketId) ? data.ticket : t));
          
          if (isResolving) {
            addNotification({
              title: 'Ticket Resolved',
              message: `Your ticket "${ticket.title}" (${ticket.id}) has been resolved.`,
              type: 'success',
              userEmail: ticket.userEmail,
            });
            
            try {
              await fetch('/api/notifications/ticket-resolved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: ticket.userEmail,
                  fullName: ticket.userName,
                  ticketId: ticket.id,
                  ticketTitle: ticket.title,
                }),
              });
            } catch (err) { console.error('Mail notification error:', err); }
          }
        }
      })
      .catch(err => console.error('Update ticket error:', err));
  };

  const assignTechnician = async (ticketId: string, technicianId: string, technicianName: string) => {
    const ticket = tickets.find(t => t.id === ticketId || (t as any)._id === ticketId);
    if (!ticket) return;
    const idToUse = (ticket as any)._id || ticket.id;

    const updates = { 
      assignedTo: technicianId, 
      assignedTechnicianName: technicianName, 
      status: 'Assigned' 
    };

    fetch(`/api/tickets/${encodeURIComponent(idToUse)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTickets(prev => prev.map(t => (t.id === ticketId || (t as any)._id === ticketId) ? data.ticket : t));
          
          addNotification({
            title: 'New Ticket Assigned',
            message: `You have been assigned to ticket "${ticket.title}" (${ticket.id}).`,
            type: 'info',
            userEmail: technicianId,
          });


          fetch('/api/notifications/ticket-assigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: technicianId,
              fullName: technicianName,
              ticketId: ticket.id,
              ticketTitle: ticket.title,
              adminName: user?.fullName || 'Admin',
            }),
          }).catch(err => console.error('Assignment mail error:', err));
        }
      })
      .catch(err => console.error('Assign technician error:', err));
  };


  const filteredTickets = tickets.filter(t => {
    if (!user) return false;
    const roleNormalized = user.role.toLowerCase().replace(/\s/g, '');
    const isAdmin = roleNormalized === 'admin' || roleNormalized === 'superadmin';
    return isAdmin || t.userEmail === user.email || t.assignedTo === user.email;
  });

  return (
    <TicketContext.Provider value={{ tickets: filteredTickets, wikiEntries, addTicket, updateTicket, assignTechnician, addToWiki, deleteWikiEntry }}>
      {children}
    </TicketContext.Provider>
  );
};

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const model = "gemini-3-flash-preview";

const LOGO_URL = "/logo.png";

const TICKET_CATEGORIES_DATA = {
  'Technical Support': {
    description: "For problems related to WiFi connectivity, internet issues, computer systems, printers, or software installations.",
    subcategories: ['WiFi Not Working', 'Internet Slow', 'Computer Not Working', 'Software Installation Request', 'Printer Issue', 'Smart Board Problem'],
    icon: Laptop,
    explanation: "This option is used to report problems related to campus IT infrastructure, hardware malfunctions, or software setup requirements."
  },
  'Academic Support': {
    description: "For issues related to course registration, attendance records, exam portals, or enterprise resource planning (ERP) systems.",
    subcategories: ['Course Registration Issue', 'Attendance Error', 'Exam Portal Problem', 'ERP Login Issue', 'Marks Update Issue'],
    icon: BookOpen,
    explanation: "Select this for any issues regarding your academic progress, portal access during exams, or attendance discrepancies."
  },
  'Facility Maintenance': {
    description: "For infrastructure issues such as classroom lights, AC problems, projector issues, furniture damage, or water leakage.",
    subcategories: ['Classroom Lights Not Working', 'Projector Issue', 'AC Not Working', 'Furniture Damage', 'Water Leakage'],
    icon: Wrench,
    explanation: "Report physical classroom or campus facility damages here. Our maintenance team will be notified for repairs."
  },
  'Hostel Services': {
    description: "For hostel-related issues including WiFi problems, water supply issues, electricity problems, room maintenance, or cleanliness.",
    subcategories: ['Hostel WiFi Issue', 'Water Supply Issue', 'Electricity Issue', 'Room Maintenance', 'Cleaning Issue'],
    icon: Home,
    explanation: "Dedicated support for residential students to report issues within hostel premises and basic amenities."
  },
  'Administration': {
    description: "For administrative requests such as ID card issues, certificates, fee payment problems, or document verification.",
    subcategories: ['ID Card Issue', 'Bonafide Certificate Request', 'Fee Payment Issue', 'Document Verification'],
    icon: FileText,
    explanation: "For non-technical administrative help. This includes ID cards, certificates, and financial document verification."
  },
  'Library Services': {
    description: "For problems related to book availability, library card issues, digital library access, or late fee problems.",
    subcategories: ['Book Not Available', 'Library Card Issue', 'Digital Library Access Problem', 'Late Fee Issue'],
    icon: Library,
    explanation: "Support for library resources, both physical and digital, including borrowing issues and portal access."
  },
  'Transport Services': {
    description: "For reporting issues related to bus delays, transport routes, or transport pass problems.",
    subcategories: ['Bus Delay', 'Bus Route Issue', 'Transport Pass Issue'],
    icon: Bus,
    explanation: "Report any issues regarding university transport, bus timings, routes, or pass-related grievances."
  },
  'IT Account Support': {
    description: "For issues related to password reset, student portal login problems, email access, or locked accounts.",
    subcategories: ['Password Reset', 'Email Login Issue', 'Student Portal Issue', 'Account Locked'],
    icon: ShieldCheck,
    explanation: "Critical account access support. Use this if you are locked out of your university email or student portal."
  }
};

const SUBCATEGORY_EXPLANATIONS: Record<string, string> = {
  'WiFi Not Working': "This option is used to report problems related to campus WiFi connectivity such as inability to connect to the network, frequent disconnections, or very slow internet speeds.",
};

const TICKET_CATEGORIES = Object.keys(TICKET_CATEGORIES_DATA).reduce((acc, key) => {
  acc[key] = TICKET_CATEGORIES_DATA[key as keyof typeof TICKET_CATEGORIES_DATA].subcategories;
  return acc;
}, {} as Record<string, string[]>);

const SEAS_DEPARTMENTS = [
  'B.Tech Computer Science and Engineering',
  'B.Tech Electronics and Communication Engineering',
  'B.Tech Mechanical Engineering',
  'B.Tech Civil Engineering',
  'B.Tech Electrical and Electronics Engineering',
  'B.Sc Computer Science',
  'B.Sc Physics',
  'B.Sc Chemistry',
  'B.Sc Mathematics'
];

const PSB_DEPARTMENTS = [
  'BBA (Bachelor of Business Administration)',
  'MBA (Master of Business Administration)',
  'B.Com (Bachelor of Commerce)'
];

const SLASS_DEPARTMENTS = [
  'B.A. English',
  'B.A. History',
  'B.A. Psychology',
  'B.A. Economics',
  'B.Sc. Psychology'
];

const STUDENT_DEPARTMENTS = [
  ...SEAS_DEPARTMENTS.map(d => `School of Engineering and Sciences - ${d}`),
  ...PSB_DEPARTMENTS.map(d => `Paari School of Business - ${d}`),
  ...SLASS_DEPARTMENTS.map(d => `Eswari School of Liberal Arts - ${d}`)
];

const FACULTY_DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical and Electronics Engineering',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Business Administration',
  'Commerce',
  'English',
  'History',
  'Psychology',
  'Economics'
];

const STAFF_DEPARTMENTS = [
  'Academic Affairs',
  'IT Services',
  'Human Resources',
  'Finance & Accounts',
  'Student Affairs',
  'Facility Management',
  'Library Services',
  'Research & Development',
  'Security Services',
  'Transport Department'
];

const ADMIN_DEPARTMENTS = [
  'University Administration',
  'Department Administration',
  'System Support'
];

const getOrdinal = (n: string | number | undefined) => {
  if (!n) return '';
  const num = Number(n);
  const j = num % 10, k = num % 100;
  if (j === 1 && k !== 11) return n + "st";
  if (j === 2 && k !== 12) return n + "nd";
  if (j === 3 && k !== 13) return n + "rd";
  return n + "th";
};

// --- Components ---

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { notifications, markAsRead, clearAll } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/my-tickets?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg dark:text-slate-300">
          <Menu size={20} />
        </button>
      </div>
      <div className="flex items-center gap-3 md:gap-6">
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-support-yellow rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-semibold bg-support-blue/10 text-support-blue px-2 py-1 rounded-full">{unreadCount} New</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-support-blue/5 dark:bg-support-blue/10' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            notif.type === 'success' ? 'bg-support-green' : 
                            notif.type === 'warning' ? 'bg-support-yellow' : 
                            notif.type === 'error' ? 'bg-red-500' : 'bg-support-blue'
                          }`} />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">{notif.title}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={clearAll}
                      className="text-sm text-support-blue font-semibold hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-slate-100 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold dark:text-slate-200">{user?.fullName || 'Guest'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'User'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden">
            <img src={`https://picsum.photos/seed/${user?.email || 'guest'}/100/100`} alt="Profile" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = ({ isOpen, closeSidebar }: { isOpen: boolean, closeSidebar: () => void }) => {
  const location = useLocation();
  const { isDark } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  
  const allLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Student', 'Staff', 'Faculty', 'Admin', 'SuperAdmin'] },
    { name: 'Technician Panel', path: '/technician/dashboard', icon: LayoutDashboard, roles: ['Technician'] },
    { name: 'Tickets', path: '/admin/tickets', icon: Ticket, roles: ['Admin', 'SuperAdmin'] },
    { name: 'Users', path: '/users', icon: User, roles: ['Admin', 'SuperAdmin'] },
    { name: 'Admins', path: '/admin/admins', icon: ShieldCheck, roles: ['Admin', 'SuperAdmin'] },
    { name: 'Technicians', path: '/admin/technicians', icon: Wrench, roles: ['Admin', 'SuperAdmin'] },
    { name: 'System', path: '/system', icon: ShieldCheck, roles: ['Admin', 'SuperAdmin'] },
    { name: 'Create Ticket', path: '/create-ticket', icon: PlusCircle, roles: ['Student', 'Staff', 'Faculty'] },
    { name: 'My Tickets', path: '/my-tickets', icon: Ticket, roles: ['Student', 'Staff', 'Faculty'] },
    { name: 'Internal Wiki', path: '/wiki', icon: Book, roles: ['Admin', 'Technician', 'SuperAdmin'] },
    { name: 'Profile', path: '/profile', icon: User, roles: ['Student', 'Staff', 'Faculty', 'Admin', 'Technician', 'SuperAdmin'] },
  ];

  const links = allLinks.filter(link => user && link.roles.includes(user.role));

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50 transition-all duration-300
        ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20 lg:w-64'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden p-0">
              <img 
                src={LOGO_URL} 
                alt="SRM Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=SRM";
                }}
              />
            </div>
            <span className={`font-bold text-lg dark:text-white ${!isOpen && 'md:hidden lg:block'}`}>SRM UNIVERSITY AP</span>
          </div>
          <button onClick={closeSidebar} className="ml-auto md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg dark:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2">
          {links.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              onClick={() => window.innerWidth < 768 && closeSidebar()}
              className={`sidebar-link dark:text-slate-400 dark:hover:bg-slate-800 ${location.pathname === link.path ? 'active' : ''}`}
            >
              <link.icon size={20} />
              <span className={`${!isOpen && 'md:hidden lg:block'}`}>{link.name}</span>
            </Link>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={logout}
            className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
          >
            <LogOut size={20} />
            <span className={`${!isOpen && 'md:hidden lg:block'}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

type ChatState = 'MAIN_MENU' | 'RAISE_CAT' | 'RAISE_SUBCAT' | 'RAISE_EXPLANATION' | 'RAISE_DESC' | 'RAISE_ANALYSIS' | 'RAISE_CONFIRM' | 'TRACK_ID' | 'FAQ_MENU' | 'CONTACT_DEPT' | 'ESCALATE' | 'EXIT' | 'WIFI_FLOW' | 'PASSWORD_FLOW' | 'AI_CHAT';

interface ChatMessage {
  text: string;
  isBot: boolean;
  options?: { label: string; value: string }[];
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [openDirection, setOpenDirection] = useState<'up' | 'down'>('up');
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { addTicket, tickets } = useContext(TicketContext);
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatState>('MAIN_MENU');
  const [errorCount, setErrorCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState(navigator.language || 'en-US');
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef("");
  const [draftTicket, setDraftTicket] = useState<{ category?: string; subcategory?: string; explanation?: string; description?: string }>({});

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      await sendBotMessage("Sorry, your browser doesn't support voice recognition. Please try using Chrome or Edge. 😔");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Try to start recognition immediately for speed
    const startRecognition = () => {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.lang = voiceLang;
        recognition.interimResults = true;
        recognition.continuous = true;

        baseInputRef.current = input;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          const newText = baseInputRef.current + (baseInputRef.current ? ' ' : '') + currentTranscript;
          setInput(newText);
        };

        recognition.onerror = async (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            // If it fails, then we do the deep permission check/fix
            await handlePermissionError();
          } else if (event.error === 'network') {
            await sendBotMessage("Network error during voice recognition. 🌐");
          } else if (event.error === 'no-speech') {
            await sendBotMessage("I didn't hear anything. Please speak clearly or try moving to a quieter spot! 🎤🔇");
          } else if (event.error === 'audio-capture') {
            await sendBotMessage("No microphone was found. Please ensure it's plugged in and active. 🎙️");
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognition.start();
      } catch (e) {
        console.error("Failed to initialize speech recognition:", e);
        setIsListening(false);
      }
    };

    const handlePermissionError = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as any });
          if (result.state === 'denied') {
            await sendBotMessage("Microphone access is permanently blocked. 🎤🚫\n\nTo fix this:\n1. Click the camera/mic icon in your address bar.\n2. Select 'Always allow'.\n3. Refresh the page.", [
              { label: "Open in New Tab", value: "open_new_tab" }
            ]);
            return;
          }
        }
        
        // Try to force a prompt
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await sendBotMessage("Permission granted! Try clicking the mic again. ✨");
      } catch (err: any) {
        await sendBotMessage("Microphone access was denied. 🎤❌\n\nThis usually happens in the 'Preview' window. Please open the app in a new tab to grant permission easily.", [
          { label: "🚀 Open in New Tab (Recommended)", value: "open_new_tab" }
        ]);
      }
    };

    startRecognition();
  };

  const getLanguageName = (code: string) => {
    const langs: Record<string, string> = {
      'en-US': 'English', 'hi-IN': 'Hindi', 'te-IN': 'Telugu', 'ta-IN': 'Tamil',
      'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi', 'bn-IN': 'Bengali',
      'pa-IN': 'Punjabi', 'gu-IN': 'Gujarati', 'es-ES': 'Spanish', 'fr-FR': 'French',
      'de-DE': 'German', 'zh-CN': 'Chinese', 'ja-JP': 'Japanese', 'ar-SA': 'Arabic'
    };
    return langs[code] || 'English';
  };

  const translateText = async (text: string) => {
    if (voiceLang === 'en-US' || !text || !process.env.GEMINI_API_KEY) return text;
    const target = getLanguageName(voiceLang);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate this university assistant message to ${target}. Keep emojis and university terms as they are. Return ONLY the translation.\n\nMessage: ${text}`,
      });
      return response.text.trim();
    } catch (error) {
      console.warn("Translation failed:", error);
      return text;
    }
  };

  const getAIResponse = async (userMessage: string, history: ChatMessage[]) => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. AI features will be limited.");
      return null;
    }
    setIsAnalyzing(true);
    const targetLang = getLanguageName(voiceLang);
    
    try {
      // Prepare history for Gemini
      const chatHistory = history.slice(-5).map(m => ({
        role: m.isBot ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: `You are "Horizon AI," the advanced intelligent assistant for SRM University AP.
          
          Your primary mission:
          1. Respond conversationally in ${targetLang}. This is CRITICAL. Precede commands with a helpful message.
          2. Answer university-related questions (WiFi, academics, hostels, labs, cafeteria, etc.).
          3. If a user asks about or mentions a specific service/category (e.g., "What is Facility Maintenance?" or "Library Services"), provide the full 'explanation' for that category from the list below and then explicitly ask if they would like to raise a ticket for it.
          
          Valid Categories and their Details:
          ${JSON.stringify(TICKET_CATEGORIES_DATA)}

          Action Commands:
             - RAISE A TICKET: [ACTION:RAISE_TICKET]
             - TRACK A TICKET: [ACTION:TRACK_TICKET]
             - CONTACT SUPPORT: [ACTION:CONTACT_SUPPORT]
             - MAIN MENU: [ACTION:MAIN_MENU]
             - DIRECT RAISE: [ACTION:DIRECT_RAISE:CategoryName:SubcategoryName]
             - DIRECT SUBMIT: [ACTION:DIRECT_SUBMIT:CategoryName:SubcategoryName:Title:Description]
          
          MANDATORY RULE: If you tell the user "I have raised your ticket" or "I have created your ticket", you MUST use [ACTION:DIRECT_SUBMIT:...]. 
          If the user just mentions a problem without enough details, use [ACTION:DIRECT_RAISE:...] to start the step-by-step process.
          NEVER say "I have created a ticket" without using the [ACTION:DIRECT_SUBMIT:...] tag.

          Flow Management:
          - If a user mentions a specific problem (e.g., "I have a water issue in my hostel"), use [ACTION:DIRECT_RAISE:Hostel Services:Water Supply Issue].
          - Always respond naturally in ${targetLang} first before the command.
          
          Context: SRM University AP has Blocks C, Academic Block, Hostels, ITKM department, Library, Transport, etc.`
        }
      });
      return response.text;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const solveProblemWithAI = async (userMessage: string) => {
    return getAIResponse(userMessage, []);
  };

  const enhanceTicketWithAI = async (category: string, subcategory: string, explanation: string, description: string) => {
    if (!process.env.GEMINI_API_KEY) return null;
    setIsAnalyzing(true);
    const targetLang = getLanguageName(voiceLang);
    try {
      const prompt = `Enhance the following university helpdesk ticket into a professional, structured format.
      
      User Input (potentially in ${targetLang}):
      Category: ${category}
      Subcategory: ${subcategory}
      Short Explanation: ${explanation}
      Detailed Description: ${description}
      
      CRITICAL INSTRUCTIONS:
      1. The "professionalTitle" and "professionalDescription" MUST be in English.
      2. If the user input is NOT in English, translate it to English for these fields.
      3. Provide a "localizedConfirmation" which is a brief summary or message in ${targetLang} explaining that their ticket has been prepared in English for the technical team.
      
      Return a JSON object with:
      1. "professionalTitle": concise English title.
      2. "professionalDescription": structured English description.
      3. "localizedConfirmation": polite message in ${targetLang}.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              professionalTitle: { type: Type.STRING },
              professionalDescription: { type: Type.STRING },
              localizedConfirmation: { type: Type.STRING }
            },
            required: ["professionalTitle", "professionalDescription", "localizedConfirmation"]
          }
        }
      });
      
      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Enhancement Error:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const MAIN_MENU_OPTIONS = [
    { label: "1. Raise a Ticket", value: "1" },
    { label: "2. Track Ticket", value: "2" },
    { label: "3. Resolve Common Issues", value: "3" },
    { label: "4. Contact Support", value: "4" },
    { label: "5. Exit", value: "5" }
  ];

  const CHATBOT_CATEGORIES = TICKET_CATEGORIES;

  const CATEGORY_OPTIONS = Object.keys(CHATBOT_CATEGORIES).map((cat, i) => ({
    label: `${i + 1}. ${cat}`,
    value: (i + 1).toString()
  }));

  const INTENT_MAP = {
    'RAISE_TICKET': ['raise', 'ticket', 'new', 'issue', 'problem', 'create', 'report', 'complaint'],
    'TRACK_TICKET': ['track', 'status', 'where', 'check', 'follow up', 'update'],
    'COMMON_ISSUES': ['common', 'faq', 'help', 'resolve', 'how to', 'wifi', 'password', 'portal', 'internet'],
    'CONTACT_SUPPORT': ['contact', 'support', 'human', 'agent', 'call', 'email', 'talk', 'person'],
    'EXIT': ['exit', 'bye', 'close', 'quit', 'stop', 'thanks']
  };

  const findIntent = (text: string): ChatState | null => {
    const normalized = text.toLowerCase();
    
    if (normalized.includes('wifi') || normalized.includes('internet')) return 'WIFI_FLOW';
    if (normalized.includes('password') || normalized.includes('forgot password')) return 'PASSWORD_FLOW';
    
    for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        switch (intent) {
          case 'RAISE_TICKET': return 'RAISE_CAT';
          case 'TRACK_TICKET': return 'TRACK_ID';
          case 'COMMON_ISSUES': return 'FAQ_MENU';
          case 'CONTACT_SUPPORT': return 'CONTACT_DEPT';
          case 'EXIT': return 'EXIT';
        }
      }
    }
    return null;
  };

  const FAQ_OPTIONS = [
    { label: "1. Reset Password", value: "1" },
    { label: "2. WiFi Troubleshooting", value: "2" },
    { label: "3. Portal Login Issue", value: "3" }
  ];

  const CONTACT_OPTIONS = [
    { label: "1. Technical Support", value: "1" },
    { label: "2. Academic Office", value: "2" },
    { label: "3. Hostel Warden", value: "3" },
    { label: "4. Administration Office", value: "4" }
  ];

  const sendBotMessage = async (text: string, options?: { label: string; value: string }[]) => {
    const translated = await translateText(text);
    setMessages(prev => [...prev, { text: translated, isBot: true, options }]);
  };

  const resetToMainMenu = async () => {
    setChatState('AI_CHAT');
    setDraftTicket({});
    setErrorCount(0);
    await sendBotMessage("Hello! I'm Horizon AI, your intelligent campus assistant. How can I help you today? 🌟", [
      { label: "View Main Menu", value: "menu" }
    ]);
  };

  const getSolutionForIssue = (description: string, category: string, subcategory: string) => {
    const desc = description.toLowerCase();
    const sub = subcategory.toLowerCase();
    
    if (sub.includes('wifi') || desc.includes('wifi') || desc.includes('internet')) {
      return "I totally get how annoying it is when the internet acts up! 🌐\n\nBefore we go through the whole ticket process, try this quick fix:\n1. Forget 'SRMAP_WIFI' on your phone/laptop.\n2. Turn your WiFi off and back on.\n3. Re-login with your NetID.\n4. Make sure you hit 'Trust' on the certificate.";
    }
    
    if (sub.includes('password') || desc.includes('password') || desc.includes('login')) {
      return "Locked out? That's the worst! 🔐\n\nTry the 'Forgot Password' link on the portal first. It usually fixes things in about 5 minutes. If that doesn't work, I'm right here to help you further!";
    }

    if (sub.includes('water') || desc.includes('water')) {
      return "No water? That's definitely an emergency! 💧\n\nI'll help you raise a ticket right away, but you might also want to check with your floor warden just in case it's a scheduled maintenance.";
    }

    return null;
  };

    useEffect(() => {
      if (isOpen && messages.length === 0) {
        resetToMainMenu();
      }
    }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInput = async (value: string) => {
    const val = value.trim();
    if (!val || isAnalyzing) return;

    setMessages(prev => [...prev, { text: val, isBot: false }]);
    setInput("");

    const matchOption = (val: string, options: { label: string; value: string }[]) => {
      const normalized = val.toLowerCase().trim();
      const num = parseInt(normalized);
      
      // Try exact number match first
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        return num.toString();
      }

      // Try text match (removing numbers/dots from labels like "1. Technical")
      const found = options.find(opt => {
        const cleanLabel = opt.label.replace(/^\d+\.\s*/, '').toLowerCase().trim();
        return cleanLabel === normalized || normalized.includes(cleanLabel) || (cleanLabel.length > 3 && normalized.includes(cleanLabel));
      });
      
      return found ? found.value : null;
    };

    const resolveCategory = (input: string) => {
      const lower = input.toLowerCase();
      if (lower.includes('wifi') || lower.includes('computer') || lower.includes('software')) return 'Technical Support';
      if (lower.includes('grade') || lower.includes('attendance') || lower.includes('exam') || lower.includes('academic')) return 'Academic Support';
      if (lower.includes('classroom') || lower.includes('lights') || lower.includes('projector') || lower.includes('ac') || lower.includes('maintenance')) return 'Facility Maintenance';
      if (lower.includes('water') || lower.includes('electricity') || lower.includes('hostel') || lower.includes('room') || lower.includes('mess')) return 'Hostel Services';
      if (lower.includes('fee') || lower.includes('id card') || lower.includes('scholarship') || lower.includes('admin')) return 'Administration';
      if (lower.includes('library') || lower.includes('book')) return 'Library Services';
      if (lower.includes('bus') || lower.includes('transport') || lower.includes('route')) return 'Transport Services';
      if (lower.includes('password') || lower.includes('portal') || lower.includes('email') || lower.includes('locked')) return 'IT Account Support';
      return null;
    };

    const handleInvalid = async (maxOptions: number, currentOptions?: { label: string; value: string }[]) => {
      const matchedVal = currentOptions ? matchOption(val, currentOptions) : null;
      const num = matchedVal ? parseInt(matchedVal) : parseInt(val);

      if (isNaN(num) || num < 1 || num > maxOptions) {
        // If it's not a number/option, process it as a general AI query
        const aiResponse = await getAIResponse(val, messages);
        if (aiResponse) {
          await processAIResponse(aiResponse);
          return true;
        }

        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);
        if (newErrorCount >= 2) {
          setChatState('ESCALATE');
          await sendBotMessage("I'm having trouble understanding. Would you like to connect to a human support agent?", [
            { label: "1. Yes, connect me", value: "1" },
            { label: "2. No, try again", value: "2" }
          ]);
        } else {
          await sendBotMessage(`Please select a valid option (1–${maxOptions}) or ask me anything! 🤖`);
        }
        return true;
      }
      setErrorCount(0);
      return false;
    };

    const processAIResponse = async (aiResponse: string) => {
      const cleanText = aiResponse.replace(/\[ACTION:[^\]]+\]/g, '').trim();
      
      if (aiResponse.includes('[ACTION:RAISE_TICKET]')) {
        setChatState('RAISE_CAT');
        await sendBotMessage(cleanText || "I'll help you raise a ticket. What category does this fall into?", CATEGORY_OPTIONS);
      } else if (aiResponse.includes('[ACTION:TRACK_TICKET]')) {
        setChatState('TRACK_ID');
        await sendBotMessage(cleanText || "Sure! Please provide your Ticket ID (e.g., #TK-1234).");
      } else if (aiResponse.includes('[ACTION:CONTACT_SUPPORT]')) {
        setChatState('CONTACT_DEPT');
        await sendBotMessage(cleanText || "Which department would you like to contact?", CONTACT_OPTIONS);
      } else if (aiResponse.includes('[ACTION:MAIN_MENU]')) {
        setChatState('MAIN_MENU');
        await sendBotMessage(cleanText || "Back to the main menu. How can I help?", MAIN_MENU_OPTIONS);
      } else if (aiResponse.includes('[ACTION:DIRECT_RAISE:')) {
        const match = aiResponse.match(/\[ACTION:DIRECT_RAISE:([^:]+):([^\]]+)\]/);
        if (match) {
          const category = match[1].trim();
          const subcategory = match[2].trim();
          setDraftTicket({ category, subcategory });
          setChatState('RAISE_EXPLANATION');
          await sendBotMessage(cleanText || `I've started a ${category} ticket for ${subcategory}. In just a few words, what's the main problem?`);
        } else {
          setChatState('RAISE_CAT');
          await sendBotMessage(cleanText || "Let's start your ticket. Which category?", CATEGORY_OPTIONS);
        }
      } else if (aiResponse.includes('[ACTION:DIRECT_SUBMIT:')) {
        const match = aiResponse.match(/\[ACTION:DIRECT_SUBMIT\s*:\s*([^:]+)\s*:\s*([^:]+)\s*:\s*([^:]+)\s*:\s*([^\]]+)\]/);
        if (match) {
          const category = match[1].trim();
          const subcategory = match[2].trim();
          const title = match[3].trim();
          const description = match[4].trim();
          
          if (user) {
            const ticketId = addTicket({
              title: `${subcategory}: ${title}`,
              description,
              category,
            });
            await sendBotMessage(cleanText || `I've successfully created your ticket regarding ${subcategory}! 🎫\n\nTicket ID: ${ticketId || '...'} \nMy team will review it shortly.`);
          } else {
            await sendBotMessage("I've prepared your ticket, but you need to be logged in to submit it. Please log in first! 🔒");
          }
          setTimeout(resetToMainMenu, 5000);
        } else {
          setChatState('RAISE_CAT');
          await sendBotMessage(cleanText || "I couldn't process that exactly. Let's start step-by-step. Which category?", CATEGORY_OPTIONS);
        }
      } else {
        setChatState('AI_CHAT');
        await sendBotMessage(aiResponse);
        
        // Safeguard: If AI says it raised a ticket but didn't use an action tag
        const lowerRes = aiResponse.toLowerCase();
        if ((lowerRes.includes('raised') || lowerRes.includes('created')) && lowerRes.includes('ticket') && !aiResponse.includes('[ACTION:')) {
          await sendBotMessage("I noticed I mentioned raising a ticket. Would you like me to officially start the ticket creation process for you?", [
            { label: "1. Yes, start ticket", value: "menu" }, // Re-triggering main menu or simplified flow
            { label: "2. No, I'm good", value: "2" }
          ]);
        }
      }
    };

    if (val.toLowerCase() === 'menu' || val.toLowerCase() === 'start over' || val.toLowerCase() === 'main menu') {
      setChatState('MAIN_MENU');
      await sendBotMessage("Here is the main menu. How would you like to proceed?", MAIN_MENU_OPTIONS);
      return;
    }

    if (val === 'fix_mic_permission') {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await sendBotMessage("Great! I think I have access now. Try clicking the microphone button again! 🎤✨");
      } catch (err) {
        await sendBotMessage("I still couldn't get access. 😔 Please check your browser's address bar for a blocked microphone icon, or try opening the app in a new tab.");
      }
      return;
    }

    if (val === 'open_new_tab') {
      window.open(window.location.href, '_blank');
      await sendBotMessage("I've tried to open the app in a new tab. Once it's open, try using the microphone there! 🚀");
      return;
    }

    if (chatState === 'AI_CHAT') {
      const aiResponse = await getAIResponse(val, messages);
      if (aiResponse) {
        await processAIResponse(aiResponse);
      } else {
        await sendBotMessage("I'm having a bit of trouble connecting to my brain right now. 🧠 Let's try the main menu instead.", MAIN_MENU_OPTIONS);
        setChatState('MAIN_MENU');
      }
      return;
    }

    if (chatState === 'MAIN_MENU') {
      const match = matchOption(val, MAIN_MENU_OPTIONS);
      
      if (!match) {
        // Neither a number nor a direct intent -> Use AI Chat for natural language
        const aiResponse = await getAIResponse(val, messages);
        if (aiResponse) {
          await processAIResponse(aiResponse);
          return;
        }
      }
      
      if (await handleInvalid(5, MAIN_MENU_OPTIONS)) return;
      
      const selection = match || val;
      if (selection === '1') {
        setChatState('RAISE_CAT');
        await sendBotMessage("Alright, let's get a ticket started for you. What's the main category?", CATEGORY_OPTIONS);
      } else if (selection === '2') {
        setChatState('TRACK_ID');
        await sendBotMessage("Sure! Drop your Ticket ID here (e.g., #TK-1234) and I'll find it. 🔍");
      } else if (selection === '3') {
        setChatState('FAQ_MENU');
        await sendBotMessage("I might have a quick fix for you! What's the issue?", FAQ_OPTIONS);
      } else if (selection === '4') {
        setChatState('CONTACT_DEPT');
        await sendBotMessage("Need a direct line? Which department do you need?", CONTACT_OPTIONS);
      } else if (selection === '5') {
        await sendBotMessage("Bye for now! Don't hesitate to come back if you need anything else. 👋");
        setTimeout(() => setIsOpen(false), 2000);
      }
      return;
    }

    switch (chatState) {
      case 'RAISE_CAT':
        const matchedCatVal = matchOption(val, CATEGORY_OPTIONS);
        const resolved = resolveCategory(val);
        
        if (!matchedCatVal && !resolved) {
          if (await handleInvalid(CATEGORY_OPTIONS.length, CATEGORY_OPTIONS)) return;
        }
        
        const catKeys = Object.keys(CHATBOT_CATEGORIES);
        const catValueNum = matchedCatVal ? parseInt(matchedCatVal) : 1;
        const selectedCat = resolved || catKeys[catValueNum - 1];
        setDraftTicket({ ...draftTicket, category: selectedCat });
        setChatState('RAISE_SUBCAT');
        const subcats = CHATBOT_CATEGORIES[selectedCat].map((sub, i) => ({
          label: `${i + 1}. ${sub}`,
          value: (i + 1).toString()
        }));
        await sendBotMessage(`Got it, ${selectedCat}. Now, what's the specific subcategory?`, subcats);
        break;

      case 'RAISE_SUBCAT':
        const currentCat = draftTicket.category || 'Technical';
        const subcatList = CHATBOT_CATEGORIES[currentCat];
        const subcatOptions = subcatList.map((sub, i) => ({ label: `${i+1}. ${sub}`, value: (i+1).toString() }));
        const matchedSubcatVal = matchOption(val, subcatOptions);
        if (await handleInvalid(subcatList.length, subcatOptions)) return;
        const subcatValue = matchedSubcatVal || val;
        const selectedSubcat = subcatList[parseInt(subcatValue) - 1];
        setDraftTicket({ ...draftTicket, subcategory: selectedSubcat });
        setChatState('RAISE_EXPLANATION');
        await sendBotMessage(`I'm sorry you're dealing with ${selectedSubcat}. 😔 In just a few words, what's the main problem?`);
        break;

      case 'RAISE_EXPLANATION':
        setDraftTicket({ ...draftTicket, explanation: val });
        setChatState('RAISE_DESC');
        await sendBotMessage("Thanks. Now, can you give me a bit more detail? The more I know, the faster we can fix it! 📝");
        break;

      case 'RAISE_DESC':
        setDraftTicket({ ...draftTicket, description: val });
        const aiSolutionForDesc = await solveProblemWithAI(`Category: ${draftTicket.category}, Subcategory: ${draftTicket.subcategory}, Issue: ${draftTicket.explanation}, Details: ${val}`);
        
        if (aiSolutionForDesc) {
          setChatState('RAISE_ANALYSIS');
          await sendBotMessage(aiSolutionForDesc);
          await sendBotMessage("Did that help at all?", [
            { label: "1. Yes, all good now! 🎉", value: "1" },
            { label: "2. No, I still need help.", value: "2" }
          ]);
        } else {
          const solution = getSolutionForIssue(val, draftTicket.category || '', draftTicket.subcategory || '');
          
          if (solution) {
            setChatState('RAISE_ANALYSIS');
            await sendBotMessage(`${solution}\n\nDid that help at all?`, [
              { label: "1. Yes, all good now! 🎉", value: "1" },
              { label: "2. No, still need a ticket.", value: "2" }
            ]);
          } else {
            const enhanced = await enhanceTicketWithAI(draftTicket.category || '', draftTicket.subcategory || '', draftTicket.explanation || '', val);
            if (enhanced) {
              setDraftTicket(prev => ({ ...prev, title: enhanced.professionalTitle, description: enhanced.professionalDescription }));
              setChatState('RAISE_CONFIRM');
              await sendBotMessage(`${enhanced.localizedConfirmation}\n\n*English Title:* ${enhanced.professionalTitle}\n\n*English Description:* ${enhanced.professionalDescription}\n\nDoes this look correct?`, [
                { label: "1. Yes, send it! 🚀", value: "1" },
                { label: "2. No, let's cancel.", value: "2" }
              ]);
            } else {
              setChatState('RAISE_CONFIRM');
              await sendBotMessage(`I've got all the info. Let's double-check everything before I send it to the team:\n\nCategory: ${draftTicket.category}\nSubcategory: ${draftTicket.subcategory}\nIssue: ${draftTicket.explanation}\nDetails: ${val}\n\nDoes this look right to you?`, [
                { label: "1. Yes, send it! 🚀", value: "1" },
                { label: "2. No, let's cancel.", value: "2" }
              ]);
            }
          }
        }
        break;

      case 'RAISE_ANALYSIS':
        const analysisOptions = [
          { label: "1. Yes, all good now! 🎉", value: "1" },
          { label: "2. No, I still need help.", value: "2" }
        ];
        const matchedAnalysisVal = matchOption(val, analysisOptions);
        if (await handleInvalid(2, analysisOptions)) return;
        const analysisVal = matchedAnalysisVal || val;
        if (analysisVal === '1') {
          await sendBotMessage("Awesome! Glad I could save you some time. Anything else I can do for you? 😊");
          setTimeout(resetToMainMenu, 3000);
        } else {
          const enhanced = await enhanceTicketWithAI(draftTicket.category || '', draftTicket.subcategory || '', draftTicket.explanation || '', draftTicket.description || '');
          if (enhanced) {
            setDraftTicket(prev => ({ ...prev, title: enhanced.professionalTitle, description: enhanced.professionalDescription }));
            setChatState('RAISE_CONFIRM');
            await sendBotMessage(`${enhanced.localizedConfirmation}\n\n*English Title:* ${enhanced.professionalTitle}\n\n*English Description:* ${enhanced.professionalDescription}\n\nReady to create this ticket?`, [
              { label: "1. Yes, go ahead!", value: "1" },
              { label: "2. No, cancel it.", value: "2" }
            ]);
          } else {
            setChatState('RAISE_CONFIRM');
            await sendBotMessage(`No worries, I'll get the experts on it. 🚀\n\nJust to confirm:\n\nCategory: ${draftTicket.category}\nSubcategory: ${draftTicket.subcategory}\nIssue: ${draftTicket.explanation}\nDetails: ${draftTicket.description}\n\nReady to create this ticket?`, [
              { label: "1. Yes, go ahead!", value: "1" },
              { label: "2. No, cancel it.", value: "2" }
            ]);
          }
        }
        break;

      case 'RAISE_CONFIRM':
        const confirmOptions = [
          { label: "1. Yes, send it! 🚀", value: "1" },
          { label: "2. No, let's cancel.", value: "2" }
        ];
        const matchedConfirmVal = matchOption(val, confirmOptions);
        if (await handleInvalid(2, confirmOptions)) return;
        const confirmVal = matchedConfirmVal || val;
        if (confirmVal === '1') {
          if (user) {
            const ticketId = addTicket({
              title: draftTicket.title || `${draftTicket.subcategory}: ${draftTicket.explanation}`,
              description: draftTicket.description || '',
              category: draftTicket.category || 'General',
            });
            await sendBotMessage(`All set! Your ticket has been created. 🎫\n\nYour ID is ${ticketId || 'pending'}. My team will jump on this right away. Hang in there! 🙏`);
          } else {
            await sendBotMessage("Oh wait, you need to be logged in to do that! Please log in and we'll get it sorted. 🔒");
          }
          setTimeout(resetToMainMenu, 4000);
        } else {
          await sendBotMessage("No problem, I've cleared that out. Anything else you want to chat about?");
          setTimeout(resetToMainMenu, 2000);
        }
        break;

      case 'TRACK_ID':
        const ticket = tickets.find(t => t.id.toLowerCase() === val.toLowerCase() || t.id.toLowerCase() === `#${val.toLowerCase()}`);
        if (ticket) {
          await sendBotMessage(`Ticket Found!\n\nID: ${ticket.id}\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nAssigned: ${ticket.assignedTechnicianName || 'Pending'}\n\nWould you like to do anything else?`);
        } else {
          await sendBotMessage("Sorry, I couldn't find a ticket with that ID. Please ensure it starts with #TK-.");
        }
        setTimeout(resetToMainMenu, 4000);
        break;

      case 'FAQ_MENU':
        if (await handleInvalid(3, FAQ_OPTIONS)) return;
        const matchedFaqVal = matchOption(val, FAQ_OPTIONS);
        const faqVal = matchedFaqVal || val;
        if (faqVal === '1') {
          await sendBotMessage("To reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your registered email\n4. Follow the instructions sent to your email.");
        } else if (val === '2') {
          await sendBotMessage("WiFi Troubleshooting:\n1. Ensure you are within campus range\n2. Use your university credentials to login\n3. If still not working, try 'Forget Network' and reconnect.");
        } else if (val === '3') {
          await sendBotMessage("Portal Login Issue:\n1. Check your internet connection\n2. Ensure your caps lock is off\n3. If the portal is down for maintenance, please try again in an hour.");
        }
        setTimeout(resetToMainMenu, 6000);
        break;

      case 'CONTACT_DEPT':
        if (await handleInvalid(4, CONTACT_OPTIONS)) return;
        const matchedDeptVal = matchOption(val, CONTACT_OPTIONS);
        const deptVal = matchedDeptVal || val;
        const depts = [
          { name: "Technical Support", contact: "it.support@srmap.edu.in", ext: "101" },
          { name: "Academic Office", contact: "academics@srmap.edu.in", ext: "202" },
          { name: "Hostel Warden", contact: "warden@srmap.edu.in", ext: "303" },
          { name: "Administration", contact: "admin@srmap.edu.in", ext: "404" }
        ];
        const d = depts[parseInt(deptVal) - 1];
        await sendBotMessage(`${d.name} Contact Details:\n\nEmail: ${d.contact}\nExtension: ${d.ext}\nOffice Hours: 9 AM - 5 PM`);
        setTimeout(resetToMainMenu, 6000);
        break;

      case 'ESCALATE':
        const escalateOptions = [
          { label: "1. Yes, connect me", value: "1" },
          { label: "2. No, try again", value: "2" }
        ];
        const matchedEscVal = matchOption(val, escalateOptions);
        if (await handleInvalid(2, escalateOptions)) return;
        const escVal = matchedEscVal || val;
        if (escVal === '1') {
          await sendBotMessage("Connecting you to a human agent... 🎧\n\nAll agents are currently assisting other students. Your estimated wait time is 5 minutes. Please stay online.");
          setTimeout(async () => await sendBotMessage("While you wait, would you like to leave a message for the team?"), 3000);
        } else {
          resetToMainMenu();
        }
        break;

      case 'WIFI_FLOW':
        const wifiOptions = [
          { label: "1. Hostel WiFi", value: "1" },
          { label: "2. Academic Block WiFi", value: "2" }
        ];
        const matchedWifiVal = matchOption(val, wifiOptions);
        if (await handleInvalid(2, wifiOptions)) return;
        const wifiVal = matchedWifiVal || val;
        setDraftTicket({ category: 'Technical', subcategory: wifiVal === '1' ? 'Hostel WiFi' : 'Academic WiFi' });
        setChatState('RAISE_EXPLANATION');
        sendBotMessage(`I'm sorry about the ${wifiVal === '1' ? 'Hostel' : 'Academic'} WiFi issue. 😔 In just a few words, what's the main problem?`);
        break;

      case 'PASSWORD_FLOW':
        const pwOptions = [
          { label: "1. Send OTP", value: "1" },
          { label: "2. Contact Support", value: "2" }
        ];
        const matchedPwVal = matchOption(val, pwOptions);
        if (await handleInvalid(pwOptions.length, pwOptions)) return;
        const pwVal = matchedPwVal || val;
        if (pwVal === '1') {
          sendBotMessage("An OTP has been sent to your registered mobile number. Please enter it to reset your password.");
          setTimeout(resetToMainMenu, 5000);
        } else {
          setChatState('CONTACT_DEPT');
          sendBotMessage("Which department would you like to contact for support?", CONTACT_OPTIONS);
        }
        break;
    }
  };

  const toggleChat = () => {
    if (isDragging) return;
    
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (rect.top < viewportHeight / 2) {
        setOpenDirection('down');
      } else {
        setOpenDirection('up');
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <motion.div 
      ref={containerRef}
      drag
      dragMomentum={false}
      dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDrag={(event, info) => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          if (rect.top < viewportHeight / 2) {
            setOpenDirection('down');
          } else {
            setOpenDirection('up');
          }
        }
      }}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: openDirection === 'up' ? 20 : -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openDirection === 'up' ? 20 : -20, scale: 0.95 }}
            className={`absolute ${openDirection === 'up' ? 'bottom-full mb-6' : 'top-full mt-6'} right-0 w-80 sm:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden`}
          >
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                  <Bot size={20} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-primary rounded-full"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">Horizon AI</p>
                    <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Pro</span>
                  </div>
                  <p className="text-[10px] opacity-80">Powered by Gemini 3</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.isBot 
                      ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700' 
                      : 'bg-support-lilac text-white rounded-tr-none shadow-md'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.options && (
                    <div className="mt-2 flex flex-col gap-2 w-full max-w-[85%]">
                      {msg.options.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleInput(opt.value)}
                          className="text-left px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-support-lilac/30 hover:bg-support-lilac/10 dark:hover:bg-support-lilac/20 text-support-lilac dark:text-support-lilac transition-colors rounded-xl font-medium"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[85%] p-3 rounded-2xl text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Loader2 className="animate-spin text-support-lilac" size={16} />
                    <span>Analyzing your issue...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-slate-400" />
                  <select 
                    value={voiceLang}
                    onChange={(e) => setVoiceLang(e.target.value)}
                    className="text-[10px] bg-transparent border-none p-0 text-slate-500 focus:ring-0 cursor-pointer"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="bn-IN">Bengali</option>
                    <option value="te-IN">Telugu</option>
                    <option value="mr-IN">Marathi</option>
                    <option value="ta-IN">Tamil</option>
                    <option value="gu-IN">Gujarati</option>
                    <option value="kn-IN">Kannada</option>
                    <option value="ml-IN">Malayalam</option>
                    <option value="pa-IN">Punjabi</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="zh-CN">Chinese</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="ar-SA">Arabic</option>
                  </select>
                </div>
                {isListening && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5 items-center h-3">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 0.6, 
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                          className="w-0.5 bg-red-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Listening</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInput(input)}
                  placeholder={isListening ? "Listening... 🎤" : (chatState === 'AI_CHAT' || chatState === 'RAISE_DESC' || chatState === 'TRACK_ID' ? "Ask me anything..." : "Type a number or ask a question...")}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary/20"
                />
                <button 
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all duration-300 ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                  title={isListening ? "Stop Listening" : "Voice Input"}
                >
                  {isListening ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                </button>
                <button 
                  onClick={() => handleInput(input)}
                  disabled={!input.trim()}
                  className="p-2 bg-primary text-white rounded-xl hover:brightness-90 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={toggleChat}
        className="w-14 h-14 bg-support-lilac text-white rounded-full shadow-lg shadow-support-lilac/40 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 cursor-grab active:cursor-grabbing"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </motion.div>
  );
};

const Layout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useContext(AuthContext);

  const showChatbot = user && !['Admin', 'SuperAdmin', 'Technician'].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
      <div className="md:pl-20 lg:pl-64 transition-all duration-300">
        <Navbar toggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      {showChatbot && <Chatbot />}
    </div>
  );
};

// --- Pages ---

const ForgotPasswordPage = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request, 2: Verify, 3: Reset
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use MotionValues for 3D rotation to avoid re-renders on every mouse move
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the motion
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);
  
  // Background parallax effects
  const bgX = useTransform(mouseX, [-0.5, 0.5], [20, -20]);
  const bgY = useTransform(mouseY, [-0.5, 0.5], [20, -20]);
  const bgX2 = useTransform(mouseX, [-0.5, 0.5], [-30, 30]);
  const bgY2 = useTransform(mouseY, [-0.5, 0.5], [-30, 30]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) - 0.5;
    const y = (clientY / window.innerHeight) - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const validateEmail = (val: string) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !emailRegex.test(val)) {
      setEmailError('Please enter a valid email address');
    } else if (val && !val.endsWith('@srmap.edu.in')) {
      setEmailError('Email must end with @srmap.edu.in');
    } else {
      setEmailError('');
    }
  };

  const handleSendOTP = async (e: any) => {
    e.preventDefault();
    if (!emailError && email && userId) {
      setIsSubmitting(true);
      
      // Check if user exists via API
      try {
        const checkRes = await fetch(`/api/users/${encodeURIComponent(email)}`);
        const checkData = await checkRes.json();
        if (!checkData.success || !checkData.user) {
          setIsSubmitting(false);
          setEmailError('No account found with this email');
          return;
        }
        const u = checkData.user;
        const idMatch = u.regNumber === userId || u.staffId === userId || u.facultyId === userId || u.technicianId === userId || u.employeeId === userId;
        if (!idMatch) {
          setIsSubmitting(false);
          setEmailError('No account found with these credentials');
          return;
        }
      } catch {
        setIsSubmitting(false);
        setEmailError('Connection error. Please try again.');
        return;
      }

      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        
        if (data.success) {
          if (data.otp) {
            setGeneratedOtp(data.otp); // Fallback for mock mode
          }
          setStep(2);
        } else {
          setEmailError(data.message || 'Failed to send verification code');
        }
      } catch (err) {
        setEmailError('Connection error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    const enteredOtp = otp.join('');
    setIsSubmitting(true);
    setOtpError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: enteredOtp })
      });
      const data = await response.json();

      if (data.success) {
        setStep(3);
        setOtpError('');
      } else {
        setOtpError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setOtpError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPassError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();
      if (!data.success) {
        setPassError(data.message || 'Failed to reset password.');
        setIsSubmitting(false);
        return;
      }
    } catch {
      setPassError('Connection error. Please try again.');
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(false);
    navigate('/login');
  };

  return (
    <div 
      className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#020617] transition-colors relative overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
    >
      {/* Left Side: Immersive Branding (Consistent with Login) */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] p-16 flex-col justify-between relative overflow-hidden bg-white dark:bg-slate-950">
        <motion.div 
          style={{ x: bgX, y: bgY }}
          className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"
        />
        <motion.div 
          style={{ x: bgX2, y: bgY2 }}
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px]"
        />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 p-0">
              <img 
                src={LOGO_URL} 
                alt="SRM Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=SRM";
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">SRM Horizon</span>
              <span className="text-xs font-medium text-primary mt-1 tracking-widest uppercase">Account Recovery</span>
            </div>
          </motion.div>

          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[4.5rem] font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter mb-8"
            >
              Secure <br />
              <span className="text-primary italic">Recovery.</span>
            </motion.h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-14 leading-relaxed max-w-lg">
              Follow the steps to securely verify your identity and regain access to your enterprise dashboard.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t border-slate-100 dark:border-slate-900">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
            Enterprise Security Protocol • v2.4.0
          </div>
        </div>
      </div>

      {/* Right Side: Recovery Experience */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 relative bg-[#F8FAFC] dark:bg-[#020617]">
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="absolute top-10 right-10 p-4 text-slate-500 hover:text-primary bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 transition-all z-50"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            perspective: 1200,
            rotateX,
            rotateY,
            transformStyle: "preserve-3d"
          }}
          className="w-full max-w-md relative z-10"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 opacity-50" />

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              {step === 1 ? 'Reset Password' : step === 2 ? 'Verify Identity' : 'New Password'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {step === 1 ? 'Enter your details to receive an OTP' : step === 2 ? `Enter the code sent to ${email}` : 'Set a strong new password'}
            </p>
          </div>

          <motion.div 
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-white dark:border-slate-800 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8" 
                  onSubmit={handleSendOTP}
                >
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">University ID</label>
                    <div className="group relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <User size={20} />
                      </span>
                      <input 
                        type="text" 
                        placeholder="Registration No / Employee ID" 
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary/20 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all" 
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email Address</label>
                    <div className="group relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none z-20">
                        <Mail size={20} />
                      </span>
                      <input 
                        type="email" 
                        placeholder="name@srmap.edu.in" 
                        className={`w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all relative z-10 ${emailError ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`} 
                        value={email}
                        onChange={(e) => validateEmail(e.target.value)}
                        required 
                      />
                    </div>
                    {emailError && <p className="text-xs text-red-500 font-bold ml-1">{emailError}</p>}
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={isSubmitting || !!emailError || !email || !userId}
                    className="w-full h-16 bg-primary text-white text-lg font-black rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Send Verification Code'}
                  </motion.button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <div className="flex justify-center gap-3 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        className={`w-12 h-16 text-center text-2xl font-black bg-slate-50 dark:bg-slate-950 border-2 focus:border-primary/20 rounded-2xl outline-none transition-all dark:text-white ${otpError ? 'border-red-500' : 'border-transparent'}`}
                        value={digit}
                        onChange={(e) => {
                          handleOtpChange(index, e.target.value);
                          setOtpError('');
                        }}
                      />
                    ))}
                  </div>
                  {otpError && <p className="text-xs text-red-500 font-bold mb-6">{otpError}</p>}
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyOTP}
                    disabled={otp.some(d => !d)}
                    className="w-full h-16 bg-primary text-white text-lg font-black rounded-2xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    Verify Code
                  </motion.button>
                  <button onClick={() => setStep(1)} className="mt-6 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                    Resend Code
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.form 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8" 
                  onSubmit={handleResetPassword}
                >
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">New Password</label>
                    <div className="group relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none z-20">
                        <Lock size={20} />
                      </span>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary/20 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all relative z-10" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Confirm Password</label>
                    <div className="group relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none z-20">
                        <Lock size={20} />
                      </span>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className={`w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all relative z-10 ${passError ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`} 
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPassError('');
                        }}
                        required 
                      />
                    </div>
                    {passError && <p className="text-xs text-red-500 font-bold ml-1">{passError}</p>}
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={isSubmitting || !newPassword || !confirmPassword}
                    className="w-full h-16 bg-primary text-white text-lg font-black rounded-2xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Update Password'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">Back to Sign In</Link>
            </div>
          </motion.div>
        </motion.div>

        <div className="mt-16 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
          &copy; 2026 SRM University AP • Global Support Network
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFeature, setActiveFeature] = useState<number | null>(0);

  // Use MotionValues for 3D rotation to avoid re-renders on every mouse move
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the motion
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);
  
  // Background parallax effects
  const bgX = useTransform(mouseX, [-0.5, 0.5], [20, -20]);
  const bgY = useTransform(mouseY, [-0.5, 0.5], [20, -20]);
  const bgX2 = useTransform(mouseX, [-0.5, 0.5], [-30, 30]);
  const bgY2 = useTransform(mouseY, [-0.5, 0.5], [-30, 30]);

  const features = useMemo(() => [
    { 
      icon: <Ticket />, 
      title: "Smart Routing", 
      desc: "AI-driven ticket allocation.",
      details: "Our intelligent engine analyzes ticket content and urgency to route requests to the most qualified support staff instantly, reducing resolution time by up to 40%."
    },
    { 
      icon: <MessageSquare />, 
      title: "Fluid Chat", 
      desc: "Instant real-time responses.",
      details: "Seamlessly transition from static tickets to live collaboration. Our real-time chat infrastructure ensures that complex issues are discussed and resolved without delays."
    },
    { 
      icon: <ShieldCheck />, 
      title: "Zero Trust", 
      desc: "Military-grade data protection.",
      details: "Security is at our core. We implement end-to-end encryption and multi-factor authentication to ensure that sensitive campus data remains private and protected."
    },
    { 
      icon: <LayoutDashboard />, 
      title: "Live Insights", 
      desc: "Real-time campus analytics.",
      details: "Gain a bird's-eye view of campus operations. Our analytics dashboard provides deep insights into common issues, response times, and overall community satisfaction."
    }
  ], []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) - 0.5;
    const y = (clientY / window.innerHeight) - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedEmail = emailOrUsername.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: trimmedEmail, password: trimmedPassword }),
      });
      const data = await response.json();

      if (data.success && data.user) {
        login(data.user as UserProfile, rememberMe, data.token);
        setShowWelcome(true);
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Connection error. Please make sure the backend is running.');
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#020617] transition-colors relative overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] text-center border border-white/20"
            >
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back!</h2>
              <p className="text-slate-500 dark:text-slate-400">Authenticating your session...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side: Immersive Branding & Feature Showcase */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] p-16 flex-col justify-between relative overflow-hidden bg-white dark:bg-slate-950">
        {/* Animated Background Elements */}
        <motion.div 
          style={{ x: bgX, y: bgY }}
          className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"
        />
        <motion.div 
          style={{ x: bgX2, y: bgY2 }}
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px]"
        />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 p-0">
              <img 
                src={LOGO_URL} 
                alt="SRM Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=SRM";
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">SRM Horizon</span>
              <span className="text-xs font-medium text-primary mt-1 tracking-widest uppercase">Enterprise Support</span>
            </div>
          </motion.div>

          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-[4.5rem] font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter mb-8"
            >
              Beyond the <br />
              <span className="text-primary italic">Horizon.</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg dark:prose-invert mb-12"
            >
              <p className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-6">
                A platform where problems meet solutions beyond the horizon.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">💡</span> Core Idea
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  "Horizon" represents new possibilities, solutions ahead, and a better future. A next-generation support ecosystem that helps students move beyond problems toward seamless solutions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-black text-primary text-xl mr-2">H</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Help</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-black text-primary text-xl mr-2">O</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Optimize</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-black text-primary text-xl mr-2">R</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Resolve</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-black text-primary text-xl mr-2">I</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Integrate</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-black text-primary text-xl mr-2">Z</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Zero-delay support</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-black text-primary text-xl mr-2">O</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Organize</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 col-span-2">
                  <span className="font-black text-primary text-xl mr-2">N</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Navigate issues</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div 
          style={{ x: bgX, y: bgY }}
          className="relative z-10 flex items-center justify-between pt-12 border-t border-slate-100 dark:border-slate-900"
        >
          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.img 
                  key={i}
                  whileHover={{ y: -10, zIndex: 20 }}
                  src={`https://picsum.photos/seed/user${i}/100/100`} 
                  className="w-12 h-12 rounded-full border-[3px] border-white dark:border-slate-950 object-cover shadow-xl cursor-pointer" 
                  alt="User"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Trusted by 10k+ users</span>
              <span className="text-xs text-slate-500">Across all SRM AP departments</span>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
            Version 2.4.0 • Enterprise
          </div>
        </motion.div>
      </div>

      {/* Right Side: 3D Login Experience */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 relative bg-[#F8FAFC] dark:bg-[#020617] z-20">
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="absolute top-10 right-10 p-4 text-slate-500 hover:text-primary bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 transition-all z-50"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            perspective: 1200,
            rotateX,
            rotateY,
            transformStyle: "preserve-3d"
          }}
          className="w-full max-w-md relative z-10"
        >
          {/* Subtle 3D Layering - Background Glow */}
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 opacity-50" />

          <div className="text-center mb-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="lg:hidden flex items-center gap-3 mb-8 justify-center"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg p-0 border border-slate-100 dark:border-slate-800">
                <img 
                  src={LOGO_URL} 
                  alt="SRM Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=SRM";
                  }}
                />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">SRM Horizon</span>
            </motion.div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Sign In</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Access your enterprise dashboard</p>
          </div>

          <motion.div 
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-white dark:border-slate-800 relative overflow-hidden"
          >
            {/* Glass highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            
            <form className="space-y-8" onSubmit={handleLogin}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-3"
                >
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email Address</label>
                <div className="group relative">
                  <motion.div 
                    className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none z-20">
                    <Mail size={20} />
                  </span>
                  <input 
                    type="email" 
                    placeholder="name@srmap.edu.in" 
                    className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary/20 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-400 placeholder:font-medium relative z-50" 
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Security</label>
                  <Link to="/forgot-password" className="text-support-blue text-xs font-black hover:underline underline-offset-4">Reset Password</Link>
                </div>
                <div className="group relative">
                  <motion.div 
                    className="absolute inset-0 bg-support-blue/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-support-blue transition-colors pointer-events-none z-20">
                    <Lock size={20} />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="w-full h-16 pl-14 pr-14 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-support-blue/20 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-400 relative z-50" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-support-blue transition-colors z-[60]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-1 relative z-50">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-800 appearance-none checked:bg-support-blue checked:border-support-blue transition-all cursor-pointer hover:border-support-blue/50" 
                  />
                  <CheckCircle2 size={12} className="absolute left-1 top-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <label htmlFor="remember" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-support-blue transition-colors">Keep me signed in</label>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading}
                className={`w-full h-16 bg-support-blue text-white text-lg font-black rounded-2xl shadow-lg shadow-support-blue/20 hover:shadow-xl hover:shadow-support-blue/30 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Launch Dashboard</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </motion.button>
            </form>
            
            <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                If you don't have an account, please <a href="mailto:hawlaraj3@gmail.com" className="text-support-blue hover:underline">contact the administrator</a>.
              </p>
            </div>
          </motion.div>

          {/* 3D Floating Accents */}
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -right-6 w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 z-20"
          >
            <ShieldCheck className="text-support-blue" size={32} />
          </motion.div>
        </motion.div>

        <div className="mt-16 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
          &copy; 2026 SRM University AP • Global Support Network
        </div>
      </div>
    </div>
  );
};


const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  if (user?.role === 'Technician') return <Navigate to="/technician/dashboard" replace />;
  const { tickets } = useContext(TicketContext);
  
  const studentStats = [
    { label: 'Total Tickets', value: tickets.length.toString(), icon: Ticket, color: 'bg-support-blue', gradient: 'from-support-blue to-blue-600' },
    { label: 'Pending', value: tickets.filter(t => t.status === 'Pending').length.toString(), icon: Clock, color: 'bg-support-yellow', gradient: 'from-support-yellow to-yellow-600' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length.toString(), icon: CheckCircle2, color: 'bg-support-green', gradient: 'from-support-green to-emerald-600' },
  ];

  const adminStats = [
    { label: 'Total Tickets', value: tickets.length.toString(), icon: Ticket, color: 'bg-support-blue', gradient: 'from-support-blue to-blue-600' },
    { label: 'Pending', value: tickets.filter(t => t.status === 'Pending').length.toString(), icon: Clock, color: 'bg-support-yellow', gradient: 'from-support-yellow to-yellow-600' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length.toString(), icon: CheckCircle2, color: 'bg-support-green', gradient: 'from-support-green to-emerald-600' },
  ];

  const stats = user?.role === 'Admin' ? adminStats : studentStats;
  const navigate = useNavigate();

  const recentTickets = tickets.slice(0, 3);

  const handleStatClick = (label: string) => {
    const status = label === 'Total Tickets' ? 'All' : label;
    if (user?.role === 'Admin') {
      navigate(`/admin/tickets?status=${status}`);
    } else {
      navigate(`/my-tickets?status=${status}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Welcome back, {user?.fullName.split(' ')[0]}! 👋</h2>
          <p className="text-slate-500 dark:text-slate-400 transition-colors">
            {(user?.role === 'Admin' || user?.role === 'SuperAdmin') ? "System administration dashboard overview." : "Here's what's happening with your helpdesk tickets."}
          </p>
        </div>
        {(user?.role !== 'Admin' && user?.role !== 'SuperAdmin') && (
          <Link to="/create-ticket" className="bg-support-orange hover:brightness-110 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-support-orange/20 flex items-center gap-2 w-fit">
            <PlusCircle size={18} />
            Create New Ticket
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleStatClick(stat.label)}
            className="stat-card group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-95"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                <stat.icon size={24} />
              </div>
              <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1 transition-colors">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg dark:text-white transition-colors">Recent Tickets</h3>
            <Link to="/my-tickets" className="text-primary text-sm font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {recentTickets.map((ticket, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    ticket.status === 'Pending' ? 'bg-support-yellow/10 text-support-yellow' : 'bg-support-green/10 text-support-green'
                  }`}>
                    {ticket.status === 'Pending' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{ticket.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{ticket.id} • {ticket.date}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 max-w-md">{ticket.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ticket.priority === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                    ticket.priority === 'Medium' ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {ticket.priority}
                  </span>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-support-lilac to-support-silver rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-support-lilac/20 dark:shadow-none">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
            <p className="text-slate-100 text-sm mb-6">Please reach for ITKM of SRMP for any technical issues or account queries.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                <AlertCircle size={20} className="text-slate-200" />
                <span className="text-sm">Mail to Super Admin</span>
              </div>
              <a 
                href="mailto:hawlaraj3@gmail.com"
                className="w-full py-3 bg-white text-support-lilac font-bold rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                hawlaraj3@gmail.com
              </a>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
};

const AdminTicketsPage = () => {
  const { user } = useContext(AuthContext);
  const { tickets, updateTicket, assignTechnician } = useContext(TicketContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState(searchParams.get('status') || 'All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminRemark, setAdminRemark] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState<{ techEmail: string; reason: string } | null>(null);
  const [isGettingRecommendation, setIsGettingRecommendation] = useState(false);

  const isSuperAdmin = normalizeRole(user?.role) === 'superadmin' || user?.email === 'hawlaraj3@gmail.com';

  const userCtx = useContext(UserContext);
  const usersDir = userCtx?.users || [];

  const getTechniciansForTicket = (ticketCategory: string) => {
    const assignableRoles = ['technician', 'admin', 'staff', 'faculty'];

    let techs = usersDir.filter(u => {
      const role = normalizeRole(u.role);
      return role && assignableRoles.includes(role) && u.status !== 'On Leave';
    });
    
    if (!isSuperAdmin && user?.department) {
      techs = techs.filter(t => t.department === user.department);
    }
    
    // Strict mapping of category to department
    if (ticketCategory) {
      const categoryToDept: Record<string, string> = {
        'Technical Support': 'Technical Support',
        'Academic Support': 'Academic Support',
        'Facility Maintenance': 'Facility Maintenance',
        'Hostel Services': 'Hostel Services',
        'Administration': 'Administration',
        'Library Services': 'Library Services',
        'Transport Services': 'Transport Services',
        'IT Account Support': 'IT Account Support'
      };
      
      // Extract the main category if it's in "Main - Sub" format
      const mainCategory = ticketCategory.split(' - ')[0];
      const targetDept = categoryToDept[mainCategory] || categoryToDept[ticketCategory];
      
      if (targetDept) {
        techs = techs.filter(t => t.department === targetDept);
      }
    }
    
    return techs.map(tech => {
      const activeTickets = tickets.filter(t => t.assignedTo === tech.email && t.status !== 'Resolved').length;
      return { ...tech, activeTickets };
    }).sort((a, b) => a.activeTickets - b.activeTickets);
  };

  const getAIRecommendation = async (ticket: Ticket) => {
    setIsGettingRecommendation(true);
    setAiRecommendation(null);
    try {
      const availableTechs = getTechniciansForTicket(ticket.category);
      if (availableTechs.length === 0) {
        setAiRecommendation({ techEmail: '', reason: 'No technicians available in the matching department for this category.' });
        return;
      }

      const techPrompt = availableTechs.map(t => `- ${t.fullName} (Email: ${t.email}, Dept: ${t.department}, Active Tickets: ${t.activeTickets}, Skills: ${t.skillTag || 'General'})`).join('\n');
      
      const prompt = `You are the "Horizon Intelligence Engine," the advanced AI Orchestrator for SRM University AP's Ticketing System.
      
      Ticket Title: "${ticket.title}"
      Ticket Description: "${ticket.description}"
      Ticket Category: "${ticket.category}"
      Has Attachment: ${ticket.attachment ? 'Yes' : 'No'}
      
      Available Technicians (Filtered by matching Department):
      ${techPrompt}
      
      Your task:
      1. Identify the primary Department and specific Sub-Department from the ticket details.
      2. Recommend the best technician by matching their skills to the ticket category and prioritizing those with the fewest active tickets.
      3. If an image is attached, acknowledge it.
      4. Maintain a professional, SRM-specific tone (mentioning Blocks, Labs, etc. if relevant).
      
      Return ONLY a valid JSON object in this exact format, with no markdown formatting or backticks:
      {"techEmail": "email@example.com", "reason": "Based on the issue type [Sub-Dept] and current workloads, I recommend assigning this to [Name] because they are a [Skill] expert and currently only have [X] active tickets. [Optional: Acknowledge attachment if present]"}
      `;
      
      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
      });
      
      const responseText = response.text || "{}";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setAiRecommendation(data);
      } else {
        setAiRecommendation({ techEmail: availableTechs[0].email, reason: `Based on the issue type ${ticket.category} and current workloads, I recommend assigning this to ${availableTechs[0].fullName} because they are a ${availableTechs[0].department} expert and currently only have ${availableTechs[0].activeTickets} active tickets.` });
      }
    } catch (error) {
      console.error("AI Recommendation Error", error);
      setAiRecommendation({ techEmail: '', reason: 'Error connecting to Horizon Intelligence Engine.' });
    } finally {
      setIsGettingRecommendation(false);
    }
  };

  useEffect(() => {
    const status = searchParams.get('status');
    setFilter(status || 'All');
  }, [searchParams]);

  const handleFilterChange = (f: string) => {
    setFilter(f);
    const newParams = new URLSearchParams(searchParams);
    if (f === 'All') {
      newParams.delete('status');
    } else {
      newParams.set('status', f);
    }
    setSearchParams(newParams);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) || 
                          ticket.id.toLowerCase().includes(search.toLowerCase()) ||
                          ticket.userName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' ? true : 
                          filter === 'Master' ? ticket.isMasterIncident : 
                          ticket.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleUpdateStatus = async (id: string, status: Ticket['status']) => {
    setIsUpdating(true);
    try {
      await updateTicket(id, { status, remarks: adminRemark });
      // updateTicket will update the global tickets list, and because it syncs with data from server,
      // it should ideally propagate back. To be safe for immediate UI feedback:
      if (selectedTicket?.id === id || (selectedTicket as any)?._id === id) {
        setSelectedTicket(prev => prev ? { ...prev, status, remarks: adminRemark } : null);
      }
      setAdminRemark('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignTechnician = async (id: string, technicianEmail: string) => {
    const tech = usersDir.find(u => u.email === technicianEmail);
    if (!tech) return;
    
    setIsUpdating(true);
    try {
      await assignTechnician(id, tech.email, tech.fullName);
      if (selectedTicket?.id === id || (selectedTicket as any)?._id === id) {
        setSelectedTicket(prev => prev ? { ...prev, assignedTo: tech.email, assignedTechnicianName: tech.fullName, status: 'Assigned' } : null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/dashboard" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Admin Panel</h2>
          <p className="text-slate-500 dark:text-slate-400 transition-colors">Manage all tickets and student requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by ID, title or student name..." 
                  className="input-field pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Master'].map(f => (
                  <button 
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-support-blue text-white shadow-lg shadow-support-blue/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800">
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Ticket ID</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Student</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Subject</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Assigned To</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket, i) => (
                    <motion.tr 
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-support-blue/5 dark:bg-support-blue/10' : ''}`}
                    >
                      <td className="p-4 font-black text-slate-900 dark:text-white text-sm">{ticket.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                            {ticket.userName?.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ticket.userName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{ticket.title}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">{ticket.category}</p>
                          </div>
                          {ticket.attachment && (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0" title="Has attachment">
                              <Image size={14} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${ticket.status === 'Pending' ? 'bg-support-yellow' : ticket.status === 'In Progress' ? 'bg-support-blue' : 'bg-support-green'}`} />
                          <span className={`text-xs font-bold ${ticket.status === 'Pending' ? 'text-support-yellow' : ticket.status === 'In Progress' ? 'text-support-blue' : 'text-support-green'}`}>
                            {ticket.status}
                          </span>
                        </div>
                      </td>
                    {ticket.status !== 'Resolved' && (
                      <td className="p-4">
                        <select 
                          value={ticket.assignedTo || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleAssignTechnician(ticket.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] font-bold p-2 focus:ring-2 focus:ring-primary/20 dark:text-white"
                        >
                          <option value="">Unassigned</option>
                          {getTechniciansForTicket(ticket.category).map(tech => (
                            <option key={tech.email} value={tech.email}>
                              {tech.fullName} ({tech.activeTickets} Active)
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {ticket.status === 'Resolved' && (
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-slate-500">
                          {ticket.assignedTechnicianName || 'No Technician'}
                        </span>
                      </td>
                    )}
                      <td className="p-4">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredTickets.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-slate-500 font-bold">No tickets found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div 
                key={selectedTicket.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 sticky top-24"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-support-blue bg-support-blue/10 px-2 py-1 rounded-lg mb-2 inline-block">Ticket Details</span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedTicket.id}</h3>
                    {selectedTicket.isMasterIncident && (
                      <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-support-purple bg-support-purple/10 px-2 py-1 rounded-lg inline-block">Master Incident</span>
                    )}
                    {selectedTicket.masterIncidentId && !selectedTicket.isMasterIncident && (
                      <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-support-orange bg-support-orange/10 px-2 py-1 rounded-lg inline-block">Duplicate of {selectedTicket.masterIncidentId}</span>
                    )}
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Student Information</label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-support-blue/10 flex items-center justify-center text-support-blue font-bold">
                        {selectedTicket.userName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTicket.userName}</p>
                        <p className="text-xs text-slate-500">{selectedTicket.userEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Issue Description</label>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{selectedTicket.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{selectedTicket.description}</p>
                      
                      {selectedTicket.attachment && (
                        <div className="mt-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Attachment</p>
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img 
                              src={selectedTicket.attachment} 
                              alt="Ticket attachment" 
                              className="w-full h-auto max-h-48 object-cover transition-transform group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a 
                                href={selectedTicket.attachment} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-white text-slate-900 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                              >
                                <Eye size={18} />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Priority</label>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        selectedTicket.priority === 'High' ? 'bg-red-100 text-red-600' : 
                        selectedTicket.priority === 'Medium' ? 'bg-support-orange/10 text-support-orange' : 
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Date Raised</label>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedTicket.date}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {selectedTicket.status === 'Resolved' && selectedTicket.resolutionPhoto && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-support-green block mb-1">Resolution Evidence</label>
                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-3">{selectedTicket.resolutionNotes}</p>
                          <div className="relative group rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
                            <img 
                              src={selectedTicket.resolutionPhoto} 
                              alt="Resolution proof" 
                              className="w-full h-auto max-h-48 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Live Tracking</label>
                      <TicketTracker3D status={selectedTicket.status} />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Admin Remarks</label>
                      <textarea 
                        className="input-field text-xs h-20 mb-4"
                        placeholder="Add a remark about the status update (e.g., what is wrong, who can access)..."
                        value={adminRemark}
                        onChange={(e) => setAdminRemark(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Update Status</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Pending', 'Assigned', 'In Progress', 'Resolved'].map(s => (
                          <button 
                            key={s}
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(selectedTicket.id, s as any)}
                            className={`py-2 rounded-xl text-[10px] font-bold transition-all ${selectedTicket.status === s ? 'bg-support-blue text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedTicket.status !== 'Resolved' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign Technician</label>
                          <button 
                            onClick={() => getAIRecommendation(selectedTicket)}
                            disabled={isGettingRecommendation}
                            className="text-[10px] font-bold text-support-purple hover:text-support-purple/80 flex items-center gap-1 transition-colors"
                          >
                            {isGettingRecommendation ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
                            AI Co-Pilot Recommend
                          </button>
                        </div>
                        
                        {aiRecommendation && aiRecommendation.techEmail && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-3 p-3 bg-support-purple/10 border border-support-purple/20 rounded-xl"
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 text-support-purple"><CheckCircle2 size={14} /></div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Recommendation</p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{aiRecommendation.reason}</p>
                                <button 
                                  onClick={() => handleAssignTechnician(selectedTicket.id, aiRecommendation.techEmail)}
                                  className="mt-2 text-[10px] font-bold bg-support-purple text-white px-3 py-1.5 rounded-lg hover:bg-support-purple/90 transition-colors"
                                >
                                  Approve & Assign
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <select 
                          disabled={isUpdating}
                          value={selectedTicket.assignedTo || ''}
                          onChange={(e) => handleAssignTechnician(selectedTicket.id, e.target.value)}
                          className="input-field h-10 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        >
                          <option value="">Unassigned</option>
                          {getTechniciansForTicket(selectedTicket.category).map(tech => (
                            <option key={tech.email} value={tech.email}>{tech.fullName} ({tech.department} - {tech.activeTickets} active)</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-sm mb-4">
                  <Ticket size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Select a ticket</h3>
                <p className="text-sm text-slate-500">Click on a ticket from the list to view details and manage its status.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const MyTicketsPage = () => {
  const { user } = useContext(AuthContext);
  const { tickets } = useContext(TicketContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState(searchParams.get('status') || 'All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
    const status = searchParams.get('status');
    setFilter(status || 'All');
  }, [searchParams]);

  const handleFilterChange = (f: string) => {
    setFilter(f);
    const newParams = new URLSearchParams(searchParams);
    if (f === 'All') {
      newParams.delete('status');
    } else {
      newParams.set('status', f);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) || ticket.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || ticket.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/dashboard" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">My Tickets</h2>
          <p className="text-slate-500 dark:text-slate-400 transition-colors">Manage and track your support requests.</p>
        </div>
        <Link to="/create-ticket" className="bg-support-orange hover:brightness-110 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-support-orange/20 flex items-center gap-2 w-fit">
          <PlusCircle size={18} />
          New Ticket
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID or title..." 
              className="input-field pl-10"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'].map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-support-blue text-white shadow-lg shadow-support-blue/20' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Info</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned To</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredTickets.map((ticket) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={ticket.id} 
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{ticket.title}</span>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400">{ticket.id}</span>
                        {ticket.isMasterIncident && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-support-purple bg-support-purple/10 px-1.5 py-0.5 rounded-md">Master</span>
                        )}
                        {ticket.masterIncidentId && !ticket.isMasterIncident && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-support-orange bg-support-orange/10 px-1.5 py-0.5 rounded-md">Dup of {ticket.masterIncidentId}</span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">{ticket.description}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{ticket.category}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      ticket.priority === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                      ticket.priority === 'Medium' ? 'bg-support-orange/10 text-support-orange' : 
                      'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ticket.status === 'Pending' ? 'bg-support-yellow animate-pulse' : ticket.status === 'In Progress' ? 'bg-support-blue' : 'bg-support-green'}`} />
                      <span className={`text-sm font-medium ${ticket.status === 'Pending' ? 'text-support-yellow' : ticket.status === 'In Progress' ? 'text-support-blue' : 'text-support-green'}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold dark:text-slate-300">
                        {ticket.assignedTechnicianName || 'Pending Assignment'}
                      </span>
                      {ticket.assignedTo && (
                        <span className="text-[10px] text-slate-500">{ticket.assignedTo}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    {ticket.date}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No tickets found</h3>
              <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-support-blue bg-support-blue/10 px-2 py-1 rounded-lg mb-2 inline-block">Ticket Details</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedTicket.id}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{selectedTicket.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedTicket.status === 'Pending' ? 'bg-support-yellow' : selectedTicket.status === 'In Progress' ? 'bg-support-blue' : selectedTicket.status === 'Assigned' ? 'bg-indigo-500' : 'bg-support-green'}`} />
                      <span className={`text-xs font-bold ${selectedTicket.status === 'Pending' ? 'text-support-yellow' : selectedTicket.status === 'In Progress' ? 'text-support-blue' : selectedTicket.status === 'Assigned' ? 'text-indigo-500' : 'text-support-green'}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned To</p>
                    <p className="text-xs font-bold dark:text-white">{selectedTicket.assignedTechnicianName || 'Not Assigned'}</p>
                  </div>
                </div>

                {/* 3D Tracker */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Live Tracking</label>
                  <TicketTracker3D status={selectedTicket.status} />
                </div>

                {/* User Attachment */}
                {selectedTicket.attachment && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Your Attachment</label>
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img 
                        src={selectedTicket.attachment} 
                        alt="User upload" 
                        className="w-full h-auto max-h-48 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* Remarks History */}
                {selectedTicket.history && selectedTicket.history.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Progression Log</label>
                    <div className="space-y-4">
                      {selectedTicket.history.map((h, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                            {i !== selectedTicket.history!.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-900 dark:text-white">{h.status}</span>
                              <span className="text-[8px] text-slate-400">{new Date(h.date).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">{h.remark}</p>
                            <p className="text-[8px] text-slate-400 italic mt-1">Updated by {h.updatedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.status === 'Resolved' && selectedTicket.resolutionPhoto && (
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-support-green block mb-1">Resolution Details</label>
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-3">{selectedTicket.resolutionNotes}</p>
                      <div className="relative group rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
                        <img 
                          src={selectedTicket.resolutionPhoto} 
                          alt="Resolution proof" 
                          className="w-full h-auto max-h-64 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TechnicianDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const { tickets, updateTicket, addToWiki } = useContext(TicketContext);
  const { leaveRequests, requestLeave } = useContext(LeaveContext);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState<Ticket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<Ticket | null>(null);
  const [resolveData, setResolveData] = useState({ photo: '', notes: '', saveToWiki: false });
  const [leaveData, setLeaveData] = useState({ startDate: '', endDate: '', reason: '' });
  const [customRemark, setCustomRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftingWiki, setIsDraftingWiki] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assignedTickets = tickets.filter(t => t.assignedTo === user?.email);
  
  const stats = [
    { label: 'Assigned Tickets', value: assignedTickets.length, icon: Ticket, color: 'text-support-blue', bg: 'bg-support-blue/10' },
    { label: 'Pending', value: assignedTickets.filter(t => t.status === 'Pending' || t.status === 'In Progress').length, icon: Clock, color: 'text-support-yellow', bg: 'bg-support-yellow/10' },
    { label: 'Resolved', value: assignedTickets.filter(t => t.status === 'Resolved').length, icon: CheckCircle2, color: 'text-support-green', bg: 'bg-support-green/10' },
  ];

  const QUICK_RESPONSES: Record<string, string[]> = {
    'Technical Support': ['WiFi signal checked', 'Software installed', 'Hardware troubleshooting complete', 'System rebooted'],
    'Academic Support': ['Portal access restored', 'Attendance updated', 'Course registration confirmed', 'Exam query addressed'],
    'Facility Maintenance': ['Lights repaired', 'AC serviced', 'Plumbing leak fixed', 'Furniture replaced'],
    'Hostel Services': ['Room maintenance complete', 'Water supply restored', 'Electricity issue resolved', 'Cleaning done'],
    'Administration': ['ID card processed', 'Document verified', 'Fee payment confirmed', 'Certificate issued'],
    'Library Services': ['Book located', 'Library card renewed', 'Digital access restored', 'Late fee waived'],
    'Transport Services': ['Bus delay noted', 'Route updated', 'Transport pass issued', 'Vehicle inspected'],
    'IT Account Support': ['Password reset successful', 'Email access restored', 'Account unlocked', 'MFA updated'],
  };

  const currentQuickResponses = QUICK_RESPONSES[user?.department || 'Technical Support'] || QUICK_RESPONSES['Technical Support'];

  const handleStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
    if (newStatus === 'Resolved') {
      const ticket = assignedTickets.find(t => t.id === ticketId);
      if (ticket) {
        setShowResolveModal(ticket);
        return;
      }
    }
    updateTicket(ticketId, { status: newStatus, remarks: `Technician updated status to ${newStatus}` });
    setMessage({ text: `Status updated to ${newStatus}`, type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleQuickUpdate = (ticketId: string, response: string) => {
    updateTicket(ticketId, { 
      status: 'In Progress',
      remarks: response
    });
    setMessage({ text: 'Quick update posted!', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleAddCustomRemark = () => {
    if (!showDetailsModal || !customRemark.trim()) return;
    updateTicket(showDetailsModal.id, {
      remarks: customRemark
    });
    
    // Update the local modal state to show the new remark immediately
    const newHistoryEntry = {
      status: showDetailsModal.status,
      date: new Date().toISOString(),
      remark: customRemark,
      updatedBy: user?.fullName || 'Technician'
    };
    setShowDetailsModal({
      ...showDetailsModal,
      history: [...(showDetailsModal.history || []), newHistoryEntry]
    });
    
    setCustomRemark('');
    setMessage({ text: 'Remark added successfully!', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const generateWikiDraft = async () => {
    if (!showResolveModal || !resolveData.notes) {
      setMessage({ text: 'Please write some rough notes first to generate a draft.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
    setIsDraftingWiki(true);
    try {
      const prompt = `You are an AI assistant for a Helpdesk system.
      A technician has written some rough notes about how they resolved a ticket.
      Ticket Title: "${showResolveModal.title}"
      Ticket Description: "${showResolveModal.description}"
      Technician's Rough Notes: "${resolveData.notes}"
      
      Please rewrite these rough notes into a clean, professional, step-by-step Knowledge Base / Wiki article.
      Keep it concise but clear. Do not include markdown formatting like **bold** or asterisks.
      `;
      
      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
      });
      
      if (response.text) {
        setResolveData(prev => ({ ...prev, notes: response.text }));
        setMessage({ text: 'Wiki draft generated successfully!', type: 'success' });
      }
    } catch (error) {
      console.error("AI Drafting Error", error);
      setMessage({ text: 'Failed to generate wiki draft.', type: 'error' });
    } finally {
      setIsDraftingWiki(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleResolveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!showResolveModal || !user) return;
    
    if (!resolveData.photo || !resolveData.notes) {
      setMessage({ text: 'Photo and notes are required for resolution.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update ticket
      updateTicket(showResolveModal.id, { 
        status: 'Resolved',
        resolutionPhoto: resolveData.photo,
        resolutionNotes: resolveData.notes,
        isWikiEntry: resolveData.saveToWiki
      });

      // Add to wiki if checked
      if (resolveData.saveToWiki) {
        addToWiki({
          title: showResolveModal.title,
          description: showResolveModal.description,
          resolution: resolveData.notes,
          department: user.department,
          technicianName: user.fullName
        });
      }

      setMessage({ text: 'Ticket resolved successfully!', type: 'success' });
      setResolveData({ photo: '', notes: '', saveToWiki: false });
      setTimeout(() => setShowResolveModal(null), 2000);
    } catch (error) {
      setMessage({ text: 'Failed to resolve ticket.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolveData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLeaveRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await requestLeave({
        userEmail: user.email,
        userName: user.fullName,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
      });
      setMessage({ text: 'Leave request submitted successfully!', type: 'success' });
      setLeaveData({ startDate: '', endDate: '', reason: '' });
      setTimeout(() => setShowLeaveModal(false), 2000);
    } catch (error) {
      setMessage({ text: 'Failed to submit leave request.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/dashboard" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
          <h2 className="text-2xl font-bold dark:text-white">Technician Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500">Manage your assigned support tickets and availability.</p>
            {user?.technicianId && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-md border border-slate-200 dark:border-slate-700">
                ID: {user.technicianId}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowLeaveModal(true)}
          className="px-6 py-3 bg-support-orange text-white rounded-xl font-bold shadow-lg shadow-support-orange/20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Clock size={20} />
          Request Leave
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold dark:text-white">Assigned Tickets</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-support-blue"></div>
                Real-time Updates
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Ticket ID</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {assignedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center text-slate-400 italic">
                        No tickets assigned to you yet.
                      </td>
                    </tr>
                  ) : (
                    assignedTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-support-blue">{ticket.id}</span>
                            <span className={`w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest mt-1 ${
                              ticket.priority === 'High' ? 'bg-red-100 text-red-600' :
                              ticket.priority === 'Medium' ? 'bg-support-yellow/10 text-support-yellow' :
                              'bg-support-blue/10 text-support-blue'
                            }`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold dark:text-white">{ticket.userName}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[150px]">{ticket.title}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => setShowDetailsModal(ticket)}
                              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <select 
                              value={ticket.status}
                              onChange={(e) => handleStatusChange(ticket.id, e.target.value as any)}
                              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-[10px] font-bold p-2 focus:ring-2 focus:ring-primary/20 dark:text-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Assigned">Assigned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-support-orange" />
                My Leaves
              </h3>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {leaveRequests.filter(r => r.userEmail === user?.email).length === 0 ? (
                <p className="text-center text-slate-400 text-xs italic py-8">No leave requests found.</p>
              ) : (
                leaveRequests.filter(r => r.userEmail === user?.email).map((req) => (
                  <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-support-blue">{req.id}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                        req.status === 'Approved' ? 'bg-support-green/10 text-support-green' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                        'bg-support-yellow/10 text-support-yellow'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold dark:text-white mb-1">{req.startDate} - {req.endDate}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{req.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDetailsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-support-blue bg-support-blue/10 px-2 py-1 rounded-lg mb-2 inline-block">Ticket Details</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{showDetailsModal.id}</h3>
                </div>
                <button onClick={() => setShowDetailsModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{showDetailsModal.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{showDetailsModal.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Live Tracking</label>
                  <TicketTracker3D status={showDetailsModal.status} />
                </div>

                {showDetailsModal.attachment && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">User Attachment</label>
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img 
                        src={showDetailsModal.attachment} 
                        alt="User upload" 
                        className="w-full h-auto max-h-48 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={showDetailsModal.attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-white text-slate-900 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                        >
                          <Eye size={18} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {showDetailsModal.history && showDetailsModal.history.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Progression Log</label>
                    <div className="space-y-4">
                      {showDetailsModal.history.map((h, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                            {i !== showDetailsModal.history!.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-900 dark:text-white">{h.status}</span>
                              <span className="text-[8px] text-slate-400">{new Date(h.date).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">{h.remark}</p>
                            <p className="text-[8px] text-slate-400 italic mt-1">Updated by {h.updatedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showDetailsModal.status !== 'Resolved' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Add Remark</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Add a custom update for the user..."
                        className="input-field flex-1 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        value={customRemark}
                        onChange={(e) => setCustomRemark(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomRemark()}
                      />
                      <button 
                        onClick={handleAddCustomRemark}
                        disabled={!customRemark.trim()}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showResolveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Resolve Ticket</h3>
                  <p className="text-xs text-slate-500">Provide proof of work and resolution details.</p>
                </div>
                <button onClick={() => setShowResolveModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleResolveSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Resolution Photo (Required)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden relative group"
                  >
                    {resolveData.photo ? (
                      <>
                        <img src={resolveData.photo} alt="Resolution" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-xs font-bold">Change Photo</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera size={32} className="text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-400">Click to upload proof of work</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolution Notes</label>
                    <button
                      type="button"
                      onClick={generateWikiDraft}
                      disabled={isDraftingWiki || !resolveData.notes}
                      className="text-[10px] font-bold text-support-purple hover:text-support-purple/80 flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isDraftingWiki ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
                      AI Draft Wiki
                    </button>
                  </div>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe how the issue was resolved (write rough notes, then use AI to draft)..."
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                    value={resolveData.notes}
                    onChange={(e) => setResolveData({...resolveData, notes: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      id="saveToWiki" 
                      checked={resolveData.saveToWiki}
                      onChange={(e) => setResolveData({...resolveData, saveToWiki: e.target.checked})}
                      className="peer w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-800 appearance-none checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                    />
                    <Check size={12} className="absolute left-1 top-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <label htmlFor="saveToWiki" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">Save resolution to Knowledge Base (Wiki)?</label>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-support-green text-white rounded-2xl font-bold shadow-lg shadow-support-green/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  Complete Resolution
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showLeaveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Request Leave</h3>
                <button onClick={() => setShowLeaveModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${
                  message.type === 'success' ? 'bg-support-green/10 text-support-green' : 'bg-red-50 text-red-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleLeaveRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Start Date</label>
                    <input 
                      type="date" 
                      required
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={leaveData.startDate}
                      onChange={(e) => setLeaveData({...leaveData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">End Date</label>
                    <input 
                      type="date" 
                      required
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={leaveData.endDate}
                      onChange={(e) => setLeaveData({...leaveData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Reason</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Briefly explain the reason for leave..."
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                    value={leaveData.reason}
                    onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-support-orange text-white rounded-2xl font-bold shadow-lg shadow-support-orange/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  Submit Request
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InternalWikiPage = () => {
  const { wikiEntries, addToWiki, deleteWikiEntry } = useContext(TicketContext);
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', description: '', resolution: '', department: user?.department || 'IT Support' });

  const handleAddWiki = (e: FormEvent) => {
    e.preventDefault();
    addToWiki({
      ...newEntry,
      technicianName: user?.fullName || 'Admin'
    });
    setShowAddModal(false);
    setNewEntry({ title: '', description: '', resolution: '', department: user?.department || 'IT Support' });
  };

  const filteredEntries = wikiEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(search.toLowerCase()) || 
                          entry.description.toLowerCase().includes(search.toLowerCase()) ||
                          entry.resolution.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || entry.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = [
    'IT Support',
    'Electrical Maintenance',
    'Plumbing',
    'Hostel Maintenance',
    'Academic Support',
    'Security',
    'General Maintenance',
    'University Administration'
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/dashboard" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
          <h2 className="text-2xl font-bold dark:text-white">Internal Knowledge Base</h2>
          <p className="text-slate-500">Shared resolutions and technical documentation for staff.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
            <Book size={16} className="text-primary" />
            {wikiEntries.length} Articles
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <PlusCircle size={16} />
            Add Article
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search knowledge base..." 
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="input-field md:w-64"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-20">
              <Book size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
              <p className="text-slate-400 italic">No articles found matching your criteria.</p>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-md">
                        {entry.department}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {entry.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{entry.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User size={14} />
                      <span className="font-medium">By {entry.technicianName}</span>
                    </div>
                    {entry.technicianName === user?.fullName && (
                      <button 
                        onClick={() => deleteWikiEntry(entry.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete Article"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Issue Description</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{entry.description}</p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-support-green mb-1">Verified Resolution</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{entry.resolution}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Add Wiki Article</h3>
                  <p className="text-xs text-slate-500">Create a new technical documentation entry.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddWiki} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Title</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g., How to reset the main router"
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Department</label>
                  <select 
                    required
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={newEntry.department}
                    onChange={(e) => setNewEntry({...newEntry, department: e.target.value})}
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Problem Description</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe the issue or scenario..."
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Resolution / Documentation</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Provide step-by-step instructions or technical details..."
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                    value={newEntry.resolution}
                    onChange={(e) => setNewEntry({...newEntry, resolution: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Publish Article
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateTicketPage = () => {
  const { addTicket, updateTicket, tickets } = useContext(TicketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Features State
  const { wikiEntries } = useContext(TicketContext);
  const [showAutoCatModal, setShowAutoCatModal] = useState(false);
  const [autoCatDesc, setAutoCatDesc] = useState('');
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [suggestedWiki, setSuggestedWiki] = useState<WikiEntry | null>(null);
  const [duplicateTicket, setDuplicateTicket] = useState<Ticket | null>(null);

  // Duplicate Ticket Detection
  useEffect(() => {
    if (title.length > 10 || description.length > 20) {
      const timer = setTimeout(() => {
        const titleWords = title.toLowerCase().split(' ').filter(w => w.length > 4);
        const descWords = description.toLowerCase().split(' ').filter(w => w.length > 4);
        const allWords = [...titleWords, ...descWords];
        
        const duplicate = tickets.find(t => 
          t.userEmail === user?.email && 
          t.status !== 'Resolved' &&
          allWords.some(word => t.title.toLowerCase().includes(word) || t.description.toLowerCase().includes(word))
        );
        setDuplicateTicket(duplicate || null);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setDuplicateTicket(null);
    }
  }, [title, description, tickets, user]);

  // Smart Deflection Effect
  useEffect(() => {
    if (description.length > 15) {
      const timer = setTimeout(() => {
        const words = description.toLowerCase().split(' ').filter(w => w.length > 4);
        const match = wikiEntries.find(w => 
          words.some(word => w.title.toLowerCase().includes(word) || w.description.toLowerCase().includes(word))
        );
        setSuggestedWiki(match || null);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setSuggestedWiki(null);
    }
  }, [description, wikiEntries]);

  const handleAutoCategorize = async () => {
    if (!autoCatDesc.trim()) return;
    setIsAutoCategorizing(true);
    try {
      const prompt = `You are an AI assistant for a Helpdesk system.
      A user has described their issue: "${autoCatDesc}"
      
      Determine the best Category and Subcategory from this exact list:
      ${JSON.stringify(Object.keys(TICKET_CATEGORIES_DATA).map(k => ({ category: k, subcategories: TICKET_CATEGORIES_DATA[k as keyof typeof TICKET_CATEGORIES_DATA].subcategories })))}
      
      Return ONLY a valid JSON object in this exact format, with no markdown formatting or backticks:
      {"category": "Found Category", "subcategory": "Found Subcategory"}
      If you cannot determine, default to {"category": "General", "subcategory": "Other"}
      `;
      
      const response = await genAI.models.generateContent({ model, contents: prompt });
      const match = response.text?.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (TICKET_CATEGORIES_DATA[data.category as keyof typeof TICKET_CATEGORIES_DATA]) {
          setCategory(data.category);
          setSubCategory(data.subcategory);
          setDescription(autoCatDesc);
          setShowAutoCatModal(false);
          setStep(4);
        }
      }
    } catch (e) {
      console.error("Auto-categorize error", e);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Check for Master Incident (Duplicate Detection)
      const recentOpenTickets = tickets.filter(t => t.status !== 'Resolved' && t.category.includes(category));
      let masterIncidentId = undefined;
      let isMasterIncident = undefined;

      if (recentOpenTickets.length > 0) {
        const ticketsPrompt = recentOpenTickets.map(t => `ID: ${t.id}, Title: "${t.title}", Desc: "${t.description}"`).join('\n');
        const prompt = `You are an AI Incident Grouper.
        A user is submitting a new ticket:
        Title: "${title}"
        Description: "${description}"
        Category: "${category} - ${subCategory}"
        
        Here are recent open tickets in similar categories:
        ${ticketsPrompt}
        
        If this new ticket is describing the exact same widespread issue (e.g., campus WiFi down, power outage, specific software down) as one of the recent tickets, return the ID of that ticket. Otherwise, return null.
        Return ONLY a valid JSON object in this exact format:
        {"duplicateOfId": "ID-HERE" | null}
        `;
        
        const response = await genAI.models.generateContent({ model, contents: prompt });
        const match = response.text?.match(/\{[\s\S]*\}/);
        if (match) {
          const data = JSON.parse(match[0]);
          if (data.duplicateOfId) {
            masterIncidentId = data.duplicateOfId;
            // Also update the original ticket to be a master incident if it isn't already
            const masterTicket = tickets.find(t => t.id === masterIncidentId);
            if (masterTicket && !masterTicket.isMasterIncident) {
              updateTicket(masterIncidentId, { isMasterIncident: true });
            }
          }
        }
      }

      addTicket({
        title,
        category: `${category} - ${subCategory}`,
        description,
        attachment: attachment || undefined,
        masterIncidentId,
      });
      
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => navigate('/my-tickets'), 1000);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-2xl text-center max-w-md"
        >
          <div className="w-20 h-20 bg-support-green/10 text-support-green rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Ticket Created!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Your ticket has been submitted successfully. You can track its progress in the "My Tickets" section.</p>
          <div className="flex items-center justify-center gap-2 text-support-blue font-bold">
            <Loader2 className="animate-spin" size={18} />
            <span>Redirecting...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/dashboard" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 -z-10" />
          {[1, 2, 3, 4].map((s) => {
            const isClickable = (s === 1) || (s === 2 && category) || (s === 3 && category && subCategory) || (s === 4 && category && subCategory);
            return (
              <button 
                key={s}
                onClick={() => isClickable && setStep(s)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all z-10 ${
                  step >= s 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'bg-white dark:bg-slate-900 text-slate-400 border-2 border-slate-200 dark:border-slate-800'
                } ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'}`}
              >
                {step > s ? <CheckCircle2 size={20} /> : s}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between max-w-2xl mx-auto mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
          <button 
            onClick={() => setStep(1)} 
            className={`hover:text-primary transition-colors ${step === 1 ? 'text-primary' : ''}`}
          >
            Category
          </button>
          <button 
            onClick={() => category && setStep(2)} 
            disabled={!category}
            className={`hover:text-primary transition-colors ${step === 2 ? 'text-primary' : ''} ${!category ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Subcategory
          </button>
          <button 
            onClick={() => category && subCategory && setStep(3)} 
            disabled={!category || !subCategory}
            className={`hover:text-primary transition-colors ${step === 3 ? 'text-primary' : ''} ${(!category || !subCategory) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Info
          </button>
          <button 
            onClick={() => category && subCategory && setStep(4)} 
            disabled={!category || !subCategory}
            className={`hover:text-primary transition-colors ${step === 4 ? 'text-primary' : ''} ${(!category || !subCategory) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Details
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Select the Type of Issue</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Choose a category that best describes your problem.</p>
              
              <button 
                onClick={() => setShowAutoCatModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-support-purple/10 text-support-purple hover:bg-support-purple/20 rounded-2xl font-bold transition-colors"
              >
                <Wrench size={18} />
                Not sure? Let AI Auto-Categorize
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(TICKET_CATEGORIES_DATA).map(([name, data]) => (
                <motion.button
                  key={name}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCategory(name);
                    setStep(2);
                  }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-left hover:border-primary/50 transition-colors group"
                >
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <data.icon size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{data.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && category && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-10">
              <button 
                onClick={() => setStep(1)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Select Subcategory</h2>
                <p className="text-slate-500 dark:text-slate-400">Help us narrow down the issue for {category}.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {TICKET_CATEGORIES_DATA[category as keyof typeof TICKET_CATEGORIES_DATA].subcategories.map((sub) => (
                <motion.button
                  key={sub}
                  whileHover={{ scale: 1.02, backgroundColor: 'var(--primary-color)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSubCategory(sub);
                    setStep(3);
                  }}
                  className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center font-bold text-slate-700 dark:text-slate-300 hover:text-white hover:bg-primary transition-all shadow-sm"
                >
                  {sub}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && category && subCategory && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">You selected: {subCategory}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-10">
                {SUBCATEGORY_EXPLANATIONS[subCategory] || TICKET_CATEGORIES_DATA[category as keyof typeof TICKET_CATEGORIES_DATA].explanation}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setStep(2)}
                  className="px-8 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Go Back
                </button>
                <button 
                  onClick={() => setStep(4)}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                  Proceed to Create Ticket
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && category && subCategory && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setStep(3)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Ticket Details</h2>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Ticket Title</label>
                  <input 
                    type="text" 
                    placeholder="Brief summary of the issue" 
                    className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary/20 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                    <input 
                      type="text" 
                      value={category} 
                      readOnly 
                      className="w-full h-14 px-6 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-slate-500 font-bold cursor-not-allowed" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Subcategory</label>
                    <input 
                      type="text" 
                      value={subCategory} 
                      readOnly 
                      className="w-full h-14 px-6 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-slate-500 font-bold cursor-not-allowed" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Upload Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                    >
                      <Upload size={18} className="text-slate-400 group-hover:text-primary" />
                      <span className="text-sm font-bold text-slate-500 group-hover:text-primary">
                        {attachment ? 'Image Selected' : 'Upload Screenshot'}
                      </span>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAttachment(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                  <textarea 
                    rows={5} 
                    placeholder="Explain the problem in detail..." 
                    className="w-full p-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary/20 rounded-3xl outline-none text-slate-900 dark:text-white font-bold transition-all resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                <AnimatePresence>
                  {duplicateTicket && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-support-yellow/10 border border-support-yellow/20 rounded-2xl mb-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 text-support-yellow"><AlertCircle size={18} /></div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-support-yellow mb-1">Possible Duplicate Ticket</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">You already have an active ticket for this issue:</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">"{duplicateTicket.title}" ({duplicateTicket.status})</p>
                            <Link to="/my-tickets" className="text-xs font-bold text-support-yellow hover:underline">View your active tickets &rarr;</Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {suggestedWiki && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-support-blue/10 border border-support-blue/20 rounded-2xl">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 text-support-blue"><BookOpen size={18} /></div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-support-blue mb-1">Smart Suggestion</p>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{suggestedWiki.title}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{suggestedWiki.resolution}</p>
                            <Link to="/wiki" className="text-xs font-bold text-support-blue hover:underline">Read full article in Wiki &rarr;</Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 bg-primary text-white text-lg font-black rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (
                    <>
                      <PlusCircle size={22} />
                      Submit Ticket
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAutoCatModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <Wrench className="text-support-purple" size={24} />
                    AI Auto-Categorize
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Describe your issue, and AI will route it correctly.</p>
                </div>
                <button onClick={() => setShowAutoCatModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <textarea 
                  rows={4}
                  placeholder="E.g., The projector in Room 304 is not turning on and the HDMI cable looks broken."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-support-purple/20 rounded-2xl outline-none text-slate-900 dark:text-white text-sm resize-none"
                  value={autoCatDesc}
                  onChange={(e) => setAutoCatDesc(e.target.value)}
                />
                <button 
                  onClick={handleAutoCategorize}
                  disabled={isAutoCategorizing || !autoCatDesc.trim()}
                  className="w-full py-4 bg-support-purple text-white rounded-2xl font-bold shadow-lg shadow-support-purple/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAutoCategorizing ? <Loader2 className="animate-spin" size={20} /> : <Wrench size={20} />}
                  Categorize & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfilePage = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">My Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 transition-colors">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center transition-colors">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <img 
                src={user.avatarUrl || `https://picsum.photos/seed/${user.email}/200/200`}
                alt="Profile" 
                className="w-full h-full rounded-full border-4 border-white dark:border-slate-800 shadow-lg object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => navigate('/edit-profile')}
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800 hover:scale-110 transition-transform"
              >
                <PlusCircle size={18} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">{user.fullName}</h3>
            <p className="text-slate-500 dark:text-slate-400 transition-colors">{user.role} • {user.department}</p>
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => navigate('/edit-profile')}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Edit Avatar
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Account Status</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Verification</span>
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg">VERIFIED</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold dark:text-white transition-colors">Personal Information</h3>
              <button 
                onClick={() => navigate('/edit-profile')}
                className="text-primary font-bold text-sm hover:underline"
              >
                Edit Info
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Role</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.role}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Department</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.department}</p>
              </div>
              {user.role === 'Student' && (
                <>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Registration Number</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.regNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Year of Study</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{getOrdinal(user.yearOfStudy)} Year</p>
                  </div>
                </>
              )}
              {user.role === 'Technician' && (
                <>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Technician ID</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.technicianId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Specialization</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.skillTag}</p>
                  </div>
                </>
              )}
              {(user.role === 'Staff' || user.role === 'Faculty') && (
                <>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Employee ID</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Staff Code</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.regNumber}</p>
                  </div>
                </>
              )}
              {user.role === 'Admin' && (
                <>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Admin Level</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.adminLevel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">System ID</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{user.regNumber}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-6 dark:text-white transition-colors">Security</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">Password</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Last changed 3 months ago</p>
                  </div>
                  <button 
                    onClick={() => navigate('/change-password')}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 transition-colors">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Secure your account with 2FA</p>
                    </div>
                    <div 
                      onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${is2FAEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <motion.div 
                        animate={{ x: is2FAEnabled ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                  {is2FAEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg"
                    >
                      <ShieldCheck size={14} />
                      Two-factor authentication enabled and linked to email
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ChangePasswordPage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (trimmedNewPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          currentPassword: trimmedCurrentPassword,
          newPassword: trimmedNewPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to change password.');
        return;
      }
    } catch {
      setError('Connection error. Please try again.');
      return;
    }

    setError('');
    setIsSuccess(true);
    setTimeout(() => navigate('/profile'), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Change Password</h2>
        <p className="text-slate-500 dark:text-slate-400 transition-colors">Update your account security credentials.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors"
      >
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Password Updated!</h3>
            <p className="text-slate-500 dark:text-slate-400">Your password has been changed successfully. Redirecting...</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-field pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </p>
            )}

            <div className="pt-4 flex gap-4">
              <button 
                type="button" 
                onClick={() => navigate('/profile')}
                className="flex-1 py-3 px-6 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 btn-primary py-3 px-6"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const EditProfilePage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [originalEmail] = useState(user.email);
  const [department, setDepartment] = useState(user.department);
  const [regNumber, setRegNumber] = useState(user.regNumber);
  const [regError, setRegError] = useState('');
  const [year, setYear] = useState(user.yearOfStudy || '1');
  const [employeeId, setEmployeeId] = useState(user.employeeId || '');
  const [adminLevel, setAdminLevel] = useState(user.adminLevel || 'Super Admin');
  const [avatar, setAvatar] = useState<string | null>(user.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1); // 1: Edit, 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateRegNumber = (val: string) => {
    setRegNumber(val);
    if (user?.role === 'Student') {
      if (val && !/^AP\d{11}$/.test(val)) {
        setRegError('Format: AP followed by 11 digits');
      } else {
        setRegError('');
      }
    } else {
      setRegError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (regError) return;
    if (email !== originalEmail) {
      setStep(2);
    } else {
      updateUser({ 
        fullName, 
        department, 
        regNumber, 
        yearOfStudy: user.role === 'Student' ? year : undefined,
        employeeId: (user.role === 'Staff' || user.role === 'Faculty') ? employeeId : undefined,
        adminLevel: user.role === 'Admin' ? adminLevel : undefined,
        avatarUrl: avatar || undefined
      });
      setIsSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`edit-otp-${index + 1}`)?.focus();
    }
  };

  const handleVerifyOtp = () => {
    updateUser({ 
      fullName, 
      email, 
      department, 
      regNumber, 
      yearOfStudy: user.role === 'Student' ? year : undefined,
      employeeId: (user.role === 'Staff' || user.role === 'Faculty') ? employeeId : undefined,
      adminLevel: user.role === 'Admin' ? adminLevel : undefined,
      avatarUrl: avatar || undefined
    });
    setIsSuccess(true);
    setTimeout(() => navigate('/profile'), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Edit Profile Information</h2>
        <p className="text-slate-500 dark:text-slate-400 transition-colors">Update your personal details below.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors"
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Profile Updated!</h3>
              <p className="text-slate-500 dark:text-slate-400">Your changes have been saved successfully.</p>
            </motion.div>
          ) : step === 1 ? (
            <motion.form 
              key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6" 
              onSubmit={handleSave}
            >
              <div className="flex flex-col items-center mb-8">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors overflow-hidden relative group"
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={24} />
                      <span className="text-[10px] mt-1 text-center px-2">Change Photo</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {email !== originalEmail && (
                    <p className="text-orange-500 text-[10px] mt-1 font-medium flex items-center gap-1">
                      <AlertCircle size={10} /> Changing email requires verification
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                  <select 
                    className="input-field"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {user.role === 'Student' && STUDENT_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    {user.role === 'Staff' && STAFF_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    {user.role === 'Faculty' && FACULTY_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    {user.role === 'Admin' && ADMIN_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {user.role === 'Student' ? 'Registration Number' : (user.role === 'Staff' || user.role === 'Faculty') ? 'Staff Code' : 'System ID'}
                  </label>
                  <input 
                    type="text" 
                    className={`input-field ${regError ? 'border-red-500 focus:ring-red-200' : ''}`}
                    value={regNumber}
                    onChange={(e) => validateRegNumber(e.target.value)}
                    required
                  />
                  {regError && <p className="text-red-500 text-[10px] mt-1 font-medium">{regError}</p>}
                </div>
                {user.role === 'Student' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Year of Study</label>
                    <select 
                      className="input-field"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}
                {(user.role === 'Staff' || user.role === 'Faculty') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employee ID</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    />
                  </div>
                )}
                {user.role === 'Admin' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Admin Level</label>
                    <select 
                      className="input-field"
                      value={adminLevel}
                      onChange={(e) => setAdminLevel(e.target.value)}
                    >
                      <option>Super Admin</option>
                      <option>Department Admin</option>
                      <option>Support Staff</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => navigate('/profile')}
                  className="flex-1 py-3 px-6 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-3">
                  Save Changes
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Verify New Email</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">We've sent a 6-digit code to <br/><span className="font-bold text-slate-800 dark:text-slate-200">{email}</span></p>
                
                <div className="flex justify-between gap-2 max-w-xs mx-auto">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`edit-otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-10 h-12 text-center text-xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleVerifyOtp}
                  className="btn-primary w-full py-3"
                >
                  Verify & Update Email
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-primary"
                >
                  Back to Editing
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const normalizeRole = (role: string | undefined): string => {
  if (!role) return '';
  return role.toLowerCase().replace(/\s/g, '');
};

const ProtectedRoute = ({ children, roles }: { children: ReactNode, roles?: string[] }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.some(r => normalizeRole(r) === normalizeRole(user.role))) {
    const userRole = normalizeRole(user.role);
    if (userRole === 'technician') return <Navigate to="/technician/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const UsersPage = () => {
  const { user } = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  if (!userCtx) return null;
  const { users, isLoading, refreshUsers, addUserLocal, updateUserLocal, deleteUserLocal } = userCtx;

  if (isLoading && users.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }
  const [showAddUser, setShowAddUser] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showSendNotification, setShowSendNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({ email: '', subject: '', message: '', sendToAll: false });
  const [newUser, setNewUser] = useState({ fullName: '', email: '', dateOfBirth: '', role: 'Student', regNumber: '', department: 'University Administration' });
  const [bulkInput, setBulkInput] = useState('');
  const [bulkDeleteInput, setBulkDeleteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [promoteAdminDept, setPromoteAdminDept] = useState('IT Support');

  const isSuperAdmin = normalizeRole(user?.role) === 'superadmin' || user?.email === 'hawlaraj3@gmail.com';
  const roles = ['All', 'SuperAdmin', 'Admin', 'Student', 'Faculty', 'Staff', 'Technician'];

  useEffect(() => { refreshUsers(); }, []);

  const filteredUsers = roleFilter === 'All' 
    ? users 
    : users.filter(u => normalizeRole(u.role) === normalizeRole(roleFilter));


  const handleStatusChange = async (email: string, newStatus: 'Active' | 'Held' | 'Blocked' | 'Restricted' | 'On Leave') => {
    try {
      await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      updateUserLocal(email, { status: newStatus });
      if (selectedUser?.email === email) setSelectedUser({ ...selectedUser, status: newStatus });
    } catch (err) {
      setMessage({ text: 'Failed to update status.', type: 'error' });
    }
  };

  const handleRoleChange = async (email: string, newRole: UserProfile['role'], dept?: string) => {
    const updates: any = { role: newRole };
    if (newRole === 'Admin' || newRole === 'SuperAdmin') updates.department = dept || 'University Administration';
    try {
      await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      updateUserLocal(email, updates);
      if (selectedUser?.email === email) setSelectedUser({ ...selectedUser, ...updates });
      setMessage({ text: `User role updated to ${newRole} successfully!`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to update role.', type: 'error' });
    }
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(selectedUser?.email || '')}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.success) {
        updateUserLocal(selectedUser?.email || '', editData);
        setSelectedUser(editData);
        setIsEditing(false);
        setMessage({ text: 'User details updated successfully!', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Failed to update user.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error.', type: 'error' });
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (email.toLowerCase() === 'hawlaraj3@gmail.com') {
      setMessage({ text: 'Cannot delete the Super Admin account.', type: 'error' });
      setShowDeleteConfirm(false);
      return;
    }
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        deleteUserLocal(email);
        setSelectedUser(null);
      } else {
        setMessage({ text: data.message || 'Failed to delete user.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error.', type: 'error' });
    }
    setShowDeleteConfirm(false);
  };

  const handleBulkDelete = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const emailsToDelete = bulkDeleteInput.split(/[\n,]+/).map(e => e.trim().toLowerCase()).filter(e => e);
    if (emailsToDelete.length === 0) {
      setMessage({ text: 'Please enter at least one email.', type: 'error' });
      setIsSubmitting(false);
      return;
    }
    if (emailsToDelete.includes('hawlaraj3@gmail.com')) {
      setMessage({ text: 'Cannot delete the Super Admin account.', type: 'error' });
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/users/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToDelete }),
      });
      if (data.success) {
        refreshUsers(); // Simpler than complex local filter
        setMessage({ text: data.message, type: 'success' });
        setBulkDeleteInput('');
        setTimeout(() => setShowBulkDelete(false), 2000);
      } else {
        setMessage({ text: data.message || 'Failed to delete users.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error.', type: 'error' });
    }
    setIsSubmitting(false);
  };

  const handleSendManualNotification = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      let payload;
      if (notificationData.sendToAll) {
        payload = {
          emails: users.map(u => u.email),
          subject: notificationData.subject,
          message: notificationData.message,
          isBulk: true
        };
      } else {
        const targetUser = users.find(u => u.email.toLowerCase() === notificationData.email.toLowerCase());
        payload = {
          email: notificationData.email,
          fullName: targetUser?.fullName || 'User',
          subject: notificationData.subject,
          message: notificationData.message,
          isBulk: false
        };
      }
      
      const response = await fetch('/api/notifications/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to send notification');

      const data = await response.json();
      if (data.success) {
        setMessage({ text: notificationData.sendToAll ? 'Bulk notifications sent successfully!' : 'Notification sent successfully!', type: 'success' });
        setNotificationData({ email: '', subject: '', message: '', sendToAll: false });
        setTimeout(() => setShowSendNotification(false), 2000);
      } else {
        setMessage({ text: 'Failed to send: ' + data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage({ text: 'Error sending notification. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser }),
      });
      const data = await res.json();
      if (data.success) {
        addUserLocal(data.user);
        setMessage({ text: `User created! Welcome email sent to ${newUser.email}. Initial password: ${newUser.dateOfBirth || 'password123'}`, type: 'success' });
        setNewUser({ fullName: '', email: '', dateOfBirth: '', role: 'Student', regNumber: '', department: 'University Administration' });
        setTimeout(() => setShowAddUser(false), 4000);
      } else {
        setMessage({ text: data.message || 'Failed to create user.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error. Is the backend running?', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAdd = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      const lines = bulkInput.split('\n').filter(line => line.trim());
      const newUsersList: any[] = [];
      const errors: string[] = [];
      const allowedRoles = ['Student', 'Faculty', 'Staff', 'Technician', 'Admin'];

      lines.forEach((line, index) => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 5) { errors.push(`Line ${index + 1}: Missing fields (5 required)`); return; }
        const [regNumber, fullName, email, dateOfBirth, role] = parts;
        if (!regNumber || !fullName || !email || !dateOfBirth || !role) { errors.push(`Line ${index + 1}: Empty fields`); return; }
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        if (!allowedRoles.includes(formattedRole)) { errors.push(`Line ${index + 1}: Invalid role "${role}"`); return; }
        newUsersList.push({ regNumber, fullName, email, dateOfBirth, role: formattedRole });
      });

      if (errors.length > 0) {
        setMessage({ text: errors.join('\n'), type: 'error' });
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: newUsersList }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshUsers();
        setMessage({ text: data.message + '. Welcome emails sent to each user.', type: 'success' });
        setBulkInput('');
        setTimeout(() => setShowBulkAdd(false), 4000);
      } else {
        setMessage({ text: data.message || 'Bulk creation failed.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">User Management</h2>
          <p className="text-sm text-slate-500">Manage campus users and administrators.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Users: {users.length}</span>
        </div>
      </div>

      {/* Admin Actions Section - Separate from Table */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-support-blue/10 flex items-center justify-center text-support-blue">
                <PlusCircle size={20} />
              </div>
              <h3 className="font-bold dark:text-white">Single Addition</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Add a single user manually with specific details.</p>
            <button 
              onClick={() => {
                setMessage({ text: '', type: '' });
                setShowAddUser(true);
              }}
              className="w-full py-3 bg-support-blue text-white rounded-xl font-bold text-sm shadow-lg shadow-support-blue/20 hover:brightness-110 transition-all"
            >
              Add New User
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-support-lilac/10 flex items-center justify-center text-support-lilac">
                <Database size={20} />
              </div>
              <h3 className="font-bold dark:text-white">Bulk Addition</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Import multiple students, faculty, or staff at once.</p>
            <button 
              onClick={() => {
                setMessage({ text: '', type: '' });
                setShowBulkAdd(true);
              }}
              className="w-full py-3 bg-support-lilac text-white rounded-xl font-bold text-sm shadow-lg shadow-support-lilac/20 hover:brightness-110 transition-all"
            >
              Bulk Import Users
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                <Trash2 size={20} />
              </div>
              <h3 className="font-bold dark:text-white">Bulk Deletion</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Remove multiple users by providing their email addresses.</p>
            <button 
              onClick={() => {
                setMessage({ text: '', type: '' });
                setShowBulkDelete(true);
              }}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:brightness-110 transition-all"
            >
              Bulk Delete Users
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-support-orange/10 flex items-center justify-center text-support-orange">
                <Bell size={20} />
              </div>
              <h3 className="font-bold dark:text-white">Send Notification</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Send a manual email notification to any campus user.</p>
            <button 
              onClick={() => {
                setMessage({ text: '', type: '' });
                setShowSendNotification(true);
              }}
              className="w-full py-3 bg-support-orange text-white rounded-xl font-bold text-sm shadow-lg shadow-support-orange/20 hover:brightness-110 transition-all"
            >
              Send Notification
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Wrench size={20} />
              </div>
              <h3 className="font-bold dark:text-white">Technician Management</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Manage technicians, departments, and specialized roles.</p>
            <Link 
              to="/admin/technicians"
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center"
            >
              Go to Technicians
            </Link>
          </div>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              roleFilter === role 
                ? 'bg-white dark:bg-slate-700 text-support-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showSendNotification && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Send Notification</h3>
                <button onClick={() => setShowSendNotification(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium whitespace-pre-wrap ${
                  message.type === 'success' ? 'bg-support-green/10 text-support-green' : 'bg-red-50 text-red-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSendManualNotification} className="space-y-4">
                <div className="flex items-center gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <input 
                    type="checkbox" 
                    id="sendToAll"
                    className="w-4 h-4 rounded border-slate-300 text-support-orange focus:ring-support-orange"
                    checked={notificationData.sendToAll}
                    onChange={(e) => setNotificationData({...notificationData, sendToAll: e.target.checked})}
                  />
                  <label htmlFor="sendToAll" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Send to all users ({users.length} recipients)
                  </label>
                </div>

                {!notificationData.sendToAll && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Recipient Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="user@srmap.edu.in"
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={notificationData.email}
                      onChange={(e) => setNotificationData({...notificationData, email: e.target.value})}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Subject</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Important Update"
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={notificationData.subject}
                    onChange={(e) => setNotificationData({...notificationData, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Message</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Write your message here..."
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-support-orange text-white rounded-2xl font-bold shadow-lg shadow-support-orange/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  Send Notification
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Add New User</h3>
                <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium whitespace-pre-wrap ${
                  message.type === 'success' ? 'bg-support-green/10 text-support-green' : 
                  message.type === 'warning' ? 'bg-support-yellow/10 text-support-yellow' : 'bg-red-50 text-red-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                      {newUser.role === 'Technician' ? 'Technician ID' : 'Registration No.'}
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder={newUser.role === 'Technician' ? 'e.g. TECH-IT-001' : 'e.g. AP21110010'}
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={newUser.role === 'Technician' ? (newUser as any).technicianId : newUser.regNumber}
                      onChange={(e) => {
                        if (newUser.role === 'Technician') {
                          setNewUser({...newUser, regNumber: '', [ 'technicianId' as any]: e.target.value} as any);
                        } else {
                          setNewUser({...newUser, regNumber: e.target.value});
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Role</label>
                    <select 
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    >
                      <option value="Student">Student</option>
                      <option value="Staff">Staff</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Admin">Admin</option>
                      <option value="Technician">Technician</option>
                      {isSuperAdmin && <option value="SuperAdmin">SuperAdmin</option>}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Harsha Vardhan"
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  />
                </div>

                {(newUser.role === 'Admin' || newUser.role === 'Technician') && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Department</label>
                    <select 
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    >
                      <option value="Technical Support">Technical Support</option>
                      <option value="Academic Support">Academic Support</option>
                      <option value="Facility Maintenance">Facility Maintenance</option>
                      <option value="Hostel Services">Hostel Services</option>
                      <option value="Administration">Administration</option>
                      <option value="Library Services">Library Services</option>
                      <option value="Transport Services">Transport Services</option>
                      <option value="IT Account Support">IT Account Support</option>
                    </select>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="user.name@srmap.edu.in"
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Date of Birth (Password)</label>
                  <input 
                    type="date" 
                    required
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={newUser.dateOfBirth}
                    onChange={(e) => setNewUser({...newUser, dateOfBirth: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">* This will be used as the initial password.</p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create User & Send Email'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showBulkAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Bulk Add Users</h3>
                  <p className="text-xs text-slate-500">Add multiple users using comma-separated format.</p>
                </div>
                <button onClick={() => setShowBulkAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium whitespace-pre-wrap max-h-40 overflow-y-auto ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                  message.type === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleBulkAdd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">User Data (CSV Format)</label>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-2">
                    <p className="text-[10px] font-mono text-slate-500">Format: regNumber, fullName, email, dateOfBirth, role</p>
                    <p className="text-[10px] font-mono text-slate-400 italic">Example: AP2111, John Doe, john@srmap.edu.in, 2000-01-01, Student</p>
                    <p className="text-[10px] text-orange-500 mt-1">* Allowed roles: Student, Faculty, Staff, Admin, Technician, SuperAdmin</p>
                  </div>
                  <textarea 
                    required
                    rows={8}
                    placeholder="Enter one user per line..."
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-xs resize-none"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowBulkAdd(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Process Bulk Addition'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showBulkDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Bulk Delete Users</h3>
                  <p className="text-xs text-slate-500">Remove multiple users by email.</p>
                </div>
                <button onClick={() => setShowBulkDelete(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium whitespace-pre-wrap ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleBulkDelete} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Addresses</label>
                  <p className="text-[10px] text-slate-400 mb-2">Enter emails separated by commas or new lines.</p>
                  <textarea 
                    required
                    rows={8}
                    placeholder="user1@srmap.edu.in&#10;user2@srmap.edu.in"
                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-xs resize-none"
                    value={bulkDeleteInput}
                    onChange={(e) => setBulkDeleteInput(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowBulkDelete(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Process Bulk Deletion'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">User</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Reg Number</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Email</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Role</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">DOB</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: UserProfile, index: number) => (
                <tr key={`${u.email}-${index}`} className="border-t border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {u.fullName.charAt(0)}
                      </div>
                      <span className="dark:text-slate-300 font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 dark:text-slate-400 text-sm font-mono">{u.regNumber || u.employeeId || 'N/A'}</td>
                  <td className="p-4 dark:text-slate-400 text-sm">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      u.role === 'SuperAdmin' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                      u.role === 'Admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 
                      (u.role === 'Staff' || u.role === 'Faculty') ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 dark:text-slate-400 text-sm">{u.dateOfBirth || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      u.status === 'Blocked' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      u.status === 'Held' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      u.status === 'Restricted' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {(u.status || 'Active').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => {
                        setSelectedUser(u);
                        setShowDeleteConfirm(false);
                      }}
                      className="text-primary hover:underline font-bold text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic">No {roleFilter !== 'All' ? roleFilter.toLowerCase() + 's' : 'users'} found in the system.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <h3 className="text-lg font-bold dark:text-white">{isEditing ? 'Edit User Details' : 'User Details'}</h3>
                <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">

              {isEditing && editData ? (
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={editData.fullName}
                      onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Role</label>
                      <select 
                        className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        value={editData.role}
                        onChange={(e) => setEditData({...editData, role: e.target.value as any})}
                      >
                        <option value="Student">Student</option>
                        <option value="Staff">Staff</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Admin">Admin</option>
                        <option value="Technician">Technician</option>
                        <option value="SuperAdmin">SuperAdmin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Status</label>
                      <select 
                        className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        value={editData.status || 'Active'}
                        onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                      >
                        <option value="Active">Active</option>
                        <option value="Held">Held</option>
                        <option value="Restricted">Restricted</option>
                        <option value="Blocked">Blocked</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Department</label>
                    <input 
                      type="text" 
                      className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={editData.department}
                      onChange={(e) => setEditData({...editData, department: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Reg/Emp ID</label>
                      <input 
                        type="text" 
                        className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        value={editData.regNumber || editData.employeeId || ''}
                        onChange={(e) => setEditData({...editData, regNumber: e.target.value, employeeId: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">DOB</label>
                      <input 
                        type="date" 
                        className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        value={editData.dateOfBirth}
                        onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <p className="font-medium dark:text-white">{selectedUser.fullName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                      <p className="font-medium dark:text-white">{selectedUser.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
                        <p className="font-medium dark:text-white">{selectedUser.role}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</label>
                        <p className="font-medium dark:text-white">{selectedUser.department}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID Number</label>
                      <p className="font-medium dark:text-white">{selectedUser.regNumber || selectedUser.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                      <p className="font-medium dark:text-white">{selectedUser.dateOfBirth || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                      <p className="font-medium dark:text-white uppercase text-xs">{selectedUser.status || 'Active'}</p>
                    </div>
                  </div>

                  {isSuperAdmin && selectedUser.email !== user?.email && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Super Admin Actions</h4>
                      
                      <button 
                        onClick={() => {
                          setEditData({...selectedUser});
                          setIsEditing(true);
                        }}
                        className="w-full py-3 bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mb-2"
                      >
                        <Edit size={18} />
                        Edit User Details
                      </button>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Status Change</label>
                        <select 
                          value={selectedUser.status || 'Active'}
                          onChange={(e) => handleStatusChange(selectedUser.email, e.target.value as any)}
                          className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Held">Hold (Temporary)</option>
                          <option value="Restricted">Restrict Access</option>
                          <option value="Blocked">Block Account</option>
                        </select>
                      </div>

                      {selectedUser.role !== 'Admin' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Department</label>
                            <select 
                              className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                              value={promoteAdminDept}
                              onChange={(e) => setPromoteAdminDept(e.target.value)}
                            >
                              <option value="University Administration">University Administration</option>
                              <option value="IT Support">IT Support</option>
                              <option value="Electrical Maintenance">Electrical Maintenance</option>
                              <option value="Plumbing">Plumbing</option>
                              <option value="Hostel Maintenance">Hostel Maintenance</option>
                              <option value="Academic Support">Academic Support</option>
                              <option value="Security">Security</option>
                              <option value="General Maintenance">General Maintenance</option>
                            </select>
                          </div>
                          <button 
                            onClick={() => handleRoleChange(selectedUser.email, 'Admin', promoteAdminDept)}
                            className="w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            <ShieldCheck size={18} />
                            Make Administrator
                          </button>
                        </div>
                      )}

                      {selectedUser.role === 'Admin' && selectedUser.email !== 'hawlaraj3@gmail.com' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demote to Student</label>
                          <button 
                            onClick={() => handleRoleChange(selectedUser.email, 'Student')}
                            className="w-full py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            <User size={18} />
                            Change to Student Role
                          </button>
                        </div>
                      )}

                      {showDeleteConfirm ? (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
                            Are you sure you want to permanently remove this user? This action cannot be undone.
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleDeleteUser(selectedUser.email)}
                              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
                            >
                              Confirm Remove
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={selectedUser.email.toLowerCase() === 'hawlaraj3@gmail.com'}
                          className={`w-full py-3 rounded-xl font-bold transition-colors mt-4 ${
                            selectedUser.email.toLowerCase() === 'hawlaraj3@gmail.com' 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                          }`}
                        >
                          {selectedUser.email.toLowerCase() === 'hawlaraj3@gmail.com' ? 'Cannot Remove Super Admin' : 'Remove User'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TechniciansPage = () => {
  const { user } = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const users = userCtx?.users || [];
  const refreshUsers = userCtx?.refreshUsers || (async () => {});
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [selectedTech, setSelectedTech] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [techInputs, setTechInputs] = useState(Array(5).fill(null).map(() => ({
    fullName: '',
    email: '',
    dateOfBirth: '',
    department: 'Technical Support',
    specializedRole: 'Co-worker',
    technicianId: ''
  })));

  useEffect(() => { refreshUsers(); }, []);
  
  const technicians = users.filter(u => normalizeRole(u.role) === 'technician');
  
  const departments = [
    'Technical Support',
    'Academic Support',
    'Facility Maintenance',
    'Hostel Services',
    'Administration',
    'Library Services',
    'Transport Services',
    'IT Account Support'
  ];

  const techRoles = ['Head', 'Senior Technician', 'Junior Technician', 'Co-worker', 'Assistant'];

  const getSkillTags = (role: string) => {
    switch(role) {
      case 'Head': return ['Leadership', 'Strategy', 'Management'];
      case 'Senior Technician': return ['Advanced Repair', 'Mentoring', 'Diagnostic'];
      case 'Junior Technician': return ['Basic Repair', 'Maintenance', 'Support'];
      case 'Co-worker': return ['General Support', 'Collaboration', 'Maintenance'];
      case 'Assistant': return ['Support', 'Logistics', 'Documentation'];
      default: return ['Technical Support', 'Maintenance'];
    }
  };

  const groupedTechnicians = departments.reduce((acc, dept) => {
    acc[dept] = technicians.filter(t => t.department === dept);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  const handleBulkAddTechs = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    const validTechs = techInputs.filter(t => t.fullName && t.email && t.dateOfBirth);
    if (validTechs.length === 0) {
      setMessage({ text: 'Please fill in at least one technician details.', type: 'error' });
      setIsSubmitting(false);
      return;
    }

    const newTechs = validTechs.map(t => ({
      ...t,
      role: 'Technician' as const,
      status: 'Active' as const,
      skillTag: getSkillTags(t.specializedRole).join(', '),
      technicianId: t.technicianId || `TECH-${t.department.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    }));

    try {
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: newTechs }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh users from API
        const refreshRes = await fetch('/api/users');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          // Global context will be updated, but we can call it if needed
          await refreshUsers();
        }
        setMessage({ text: `Successfully added ${newTechs.length} technicians! Welcome emails sent.`, type: 'success' });
        setTechInputs(Array(5).fill(null).map(() => ({
          fullName: '', email: '', dateOfBirth: '',
          department: 'Technical Support', specializedRole: 'Co-worker', technicianId: ''
        })));
        setTimeout(() => setShowBulkAdd(false), 3000);
      } else {
        setMessage({ text: data.message || 'Failed to add technicians.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Technician Management</h2>
          <p className="text-sm text-slate-500">Manage specialized technical staff by department.</p>
        </div>
        <button 
          onClick={() => setShowBulkAdd(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <PlusCircle size={20} />
          Add Technicians (Max 5)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {departments.map(dept => (
          <div key={dept} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="w-2 h-6 bg-primary rounded-full" />
              <h3 className="text-lg font-bold dark:text-white">{dept}</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                {groupedTechnicians[dept]?.length || 0} Staff
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedTechnicians[dept]?.length === 0 ? (
                <p className="text-sm text-slate-400 italic p-4">No technicians assigned to this department.</p>
              ) : (
                groupedTechnicians[dept].map(tech => (
                  <div 
                    key={tech.email} 
                    onClick={() => setSelectedTech(tech)}
                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold text-xl">
                          {tech.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold dark:text-white group-hover:text-primary transition-colors">{tech.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{tech.employeeId}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        tech.status === 'On Leave' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {tech.status || 'Active'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck size={14} className="text-primary" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{tech.specializedRole || 'Technician'}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {getSkillTags(tech.specializedRole || '').map(tag => (
                          <span key={tag} className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md border border-slate-100 dark:border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-50 dark:border-slate-800">
                        <Mail size={14} />
                        <span className="truncate">{tech.email}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTech && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Technician Profile</h3>
                <button onClick={() => setSelectedTech(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center text-4xl font-black mb-4">
                  {selectedTech.fullName.charAt(0)}
                </div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white">{selectedTech.fullName}</h4>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">{selectedTech.specializedRole}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Department</p>
                    <p className="text-xs font-bold dark:text-white">{selectedTech.department}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Technician ID</p>
                    <p className="text-xs font-bold dark:text-white font-mono">{selectedTech.technicianId}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Skill Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {getSkillTags(selectedTech.specializedRole || '').map(tag => (
                      <span key={tag} className="text-[10px] font-bold px-3 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <Mail size={18} className="text-slate-400" />
                    <span className="font-medium">{selectedTech.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="font-medium">Joined: {selectedTech.dateOfBirth ? 'Jan 2026' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showBulkAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Add Technicians</h3>
                  <p className="text-xs text-slate-500">Register up to 5 technicians with specialized roles.</p>
                </div>
                <button onClick={() => setShowBulkAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleBulkAddTechs} className="space-y-6">
                <div className="space-y-4">
                  {techInputs.map((input, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                      <div className="lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Name"
                          className="input-field text-sm py-2"
                          value={input.fullName}
                          onChange={(e) => {
                            const newInputs = [...techInputs];
                            newInputs[idx].fullName = e.target.value;
                            setTechInputs(newInputs);
                          }}
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Email</label>
                        <input 
                          type="email" 
                          placeholder="Email"
                          className="input-field text-sm py-2"
                          value={input.email}
                          onChange={(e) => {
                            const newInputs = [...techInputs];
                            newInputs[idx].email = e.target.value;
                            setTechInputs(newInputs);
                          }}
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">DOB (Password)</label>
                        <input 
                          type="date" 
                          className="input-field text-sm py-2"
                          value={input.dateOfBirth}
                          onChange={(e) => {
                            const newInputs = [...techInputs];
                            newInputs[idx].dateOfBirth = e.target.value;
                            setTechInputs(newInputs);
                          }}
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Department</label>
                        <select 
                          className="input-field text-sm py-2"
                          value={input.department}
                          onChange={(e) => {
                            const newInputs = [...techInputs];
                            newInputs[idx].department = e.target.value;
                            setTechInputs(newInputs);
                          }}
                        >
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Specialized Role</label>
                        <select 
                          className="input-field text-sm py-2"
                          value={input.specializedRole}
                          onChange={(e) => {
                            const newInputs = [...techInputs];
                            newInputs[idx].specializedRole = e.target.value;
                            setTechInputs(newInputs);
                          }}
                        >
                          {techRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Technician ID</label>
                        <input 
                          type="text" 
                          placeholder="Tech ID"
                          className="input-field text-sm py-2"
                          value={input.technicianId}
                          onChange={(e) => {
                            const newInputs = [...techInputs];
                            newInputs[idx].technicianId = e.target.value;
                            setTechInputs(newInputs);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowBulkAdd(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Register Technicians'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminManagementPage = () => {
  const { user } = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const users = userCtx?.users || [];
  const isLoading = userCtx?.isLoading || false;

  const admins = users.filter(u => normalizeRole(u.role) === 'admin');
  
  const departments = [
    'Technical Support',
    'Academic Support',
    'Facility Maintenance',
    'Hostel Services',
    'Administration',
    'Library Services',
    'Transport Services',
    'IT Account Support'
  ];

  const groupedAdmins = departments.reduce((acc, dept) => {
    acc[dept] = admins.filter(a => a.department === dept);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Admin Management</h2>
          <p className="text-sm text-slate-500">View administrators separated by their respective departments.</p>
        </div>
        <Link 
          to="/users"
          className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <User size={20} />
          Manage Users
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {departments.map(dept => (
          <div key={dept} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="w-2 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-lg font-bold dark:text-white">{dept}</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                {groupedAdmins[dept]?.length || 0} Admins
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAdmins[dept]?.length === 0 ? (
                <p className="text-sm text-slate-400 italic p-4">No admins assigned to this department.</p>
              ) : (
                groupedAdmins[dept].map(admin => (
                  <div key={admin.email} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                          {admin.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold dark:text-white group-hover:text-indigo-500 transition-colors">{admin.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{admin.employeeId || 'ADM-XXX'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        admin.status === 'On Leave' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {admin.status || 'Active'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">Administrator</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={14} />
                        <span className="truncate">{admin.email}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemPage = () => {
  const { leaveRequests, approveLeave, rejectLeave } = useContext(LeaveContext);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/dashboard" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
      <h2 className="text-2xl font-bold dark:text-white">System Overview</h2>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold dark:text-white">Technician Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Technician</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Dates</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Reason</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">No leave requests found.</td>
                </tr>
              ) : (
                leaveRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold dark:text-white">{req.userName}</span>
                        <span className="text-[10px] text-slate-500">{req.userEmail}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium dark:text-slate-300">{req.startDate} to {req.endDate}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate" title={req.reason}>{req.reason}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        req.status === 'Approved' ? 'bg-support-green/10 text-support-green' :
                        req.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                        'bg-support-yellow/10 text-support-yellow'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => approveLeave(req.id)}
                            className="p-2 bg-support-green/10 text-support-green hover:bg-support-green hover:text-white rounded-lg transition-all"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => rejectLeave(req.id)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold mb-4 dark:text-white">Server Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">API Server</span>
              <span className="text-emerald-500 font-bold">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Database</span>
              <span className="text-emerald-500 font-bold">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Storage</span>
              <span className="text-emerald-500 font-bold">92% Free</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold mb-4 dark:text-white">Recent Activity</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-500"><span className="font-bold text-slate-700 dark:text-slate-300">Admin</span> updated system config (10m ago)</p>
            <p className="text-sm text-slate-500"><span className="font-bold text-slate-700 dark:text-slate-300">System</span> backup completed (1h ago)</p>
            <p className="text-sm text-slate-500"><span className="font-bold text-slate-700 dark:text-slate-300">Staff</span> resolved 12 tickets (2h ago)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

// --- Components ---

const TicketTracker3D = ({ status }: { status: Ticket['status'] }) => {
  const steps = [
    { label: 'Submitted', status: 'Pending', icon: <FileText size={18} /> },
    { label: 'Assigned', status: 'Assigned', icon: <UserCheck size={18} /> },
    { label: 'In Progress', status: 'In Progress', icon: <Settings size={18} /> },
    { label: 'Resolved', status: 'Resolved', icon: <CheckCircle2 size={18} /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === status);
  const progressPercentage = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className="py-8 px-4">
      <div className="relative flex justify-between items-center max-w-3xl mx-auto">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full" />
        
        {/* Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-10 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
        />

        {/* Moving Truck Icon */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${progressPercentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-10 h-10 bg-white dark:bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <Truck size={18} className="text-primary" />
        </motion.div>

        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <div key={step.label} className="relative z-20 flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted ? 'var(--primary)' : 'var(--bg-card)',
                  borderColor: isCompleted ? 'var(--primary)' : 'var(--border-color)',
                  boxShadow: isActive ? '0 0 20px rgba(var(--primary-rgb), 0.4)' : 'none',
                  rotateY: isActive ? 360 : 0
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`
                  w-12 h-12 rounded-2xl border-2 flex items-center justify-center
                  ${isCompleted ? 'text-white' : 'text-slate-400 dark:text-slate-600'}
                  bg-white dark:bg-slate-900
                `}
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                <motion.div
                  animate={{ rotateY: isActive ? [0, 180, 360] : 0 }}
                  transition={{ repeat: isActive ? Infinity : 0, duration: 3, ease: "linear" }}
                >
                  {step.icon}
                </motion.div>
              </motion.div>
              
              <div className="absolute -bottom-8 whitespace-nowrap text-center">
                <span className={`text-xs font-bold transition-colors ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                  {step.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="active-dot"
                    className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-1"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <AuthProvider>
      <UserProvider>
        <NotificationProvider>
          <LeaveProvider>
            <TicketProvider>
              <ThemeContext.Provider value={{ isDark, toggleTheme }}>
                <Router>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    
                    <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
                    <Route path="/technician/dashboard" element={<ProtectedRoute roles={['Technician']}><Layout><TechnicianDashboardPage /></Layout></ProtectedRoute>} />
                    <Route path="/create-ticket" element={<ProtectedRoute roles={['Student', 'Staff', 'Faculty']}><Layout><CreateTicketPage /></Layout></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
                    <Route path="/edit-profile" element={<ProtectedRoute><Layout><EditProfilePage /></Layout></ProtectedRoute>} />
                    <Route path="/change-password" element={<ProtectedRoute><Layout><ChangePasswordPage /></Layout></ProtectedRoute>} />
                    <Route path="/my-tickets" element={<ProtectedRoute roles={['Student', 'Staff', 'Faculty']}><Layout><MyTicketsPage /></Layout></ProtectedRoute>} />
                    <Route path="/admin/tickets" element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><Layout><AdminTicketsPage /></Layout></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><Layout><UsersPage /></Layout></ProtectedRoute>} />
                    <Route path="/admin/admins" element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><Layout><AdminManagementPage /></Layout></ProtectedRoute>} />
                    <Route path="/admin/technicians" element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><Layout><TechniciansPage /></Layout></ProtectedRoute>} />
                    <Route path="/wiki" element={<ProtectedRoute roles={['Admin', 'Technician', 'SuperAdmin']}><Layout><InternalWikiPage /></Layout></ProtectedRoute>} />
                    <Route path="/system" element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><Layout><SystemPage /></Layout></ProtectedRoute>} />
                    
                    <Route path="/" element={<Navigate to="/login" replace />} />
                  </Routes>
                </Router>
              </ThemeContext.Provider>
            </TicketProvider>
          </LeaveProvider>
        </NotificationProvider>
      </UserProvider>
    </AuthProvider>
  );
}
