# 🏢 VisiPass — Visitor Pass Management System

A full-stack MERN application to digitize and manage visitor registrations, pass issuance, check-in/out, and reporting for organizations.

![VisiPass Dashboard](https://via.placeholder.com/900x500/0f1117/4f8ef7?text=VisiPass+Dashboard)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Guide](#setup-guide)
- [Demo Accounts](#demo-accounts)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Environment Variables](#environment-variables)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth & RBAC** | JWT authentication with 4 role levels |
| 👤 **Visitor Registration** | Multi-step form with photo upload |
| 📅 **Appointments** | Pre-registration + email/SMS invites |
| 🎫 **Pass Issuance** | QR code generation + PDF badge |
| 🚪 **Check-In/Out** | QR scan with real-time log |
| 📧 **Notifications** | Email (Nodemailer) + SMS (Twilio) |
| 📊 **Dashboard** | Analytics, charts, occupancy |
| 📈 **Reports** | CSV/JSON export with date filters |
| 🌑 **Dark UI** | Responsive dark-theme design |
| 🌍 **Multi-location** | Location field on all records |

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication (jsonwebtoken)
- QR Code generation (qrcode)
- PDF generation (pdfkit)
- Email (nodemailer)
- SMS (twilio)
- File uploads (multer)

**Frontend**
- React 18 + React Router v6
- Recharts (charts)
- Axios (HTTP client)
- React Hot Toast (notifications)
- html5-qrcode (QR scanner)
- jsPDF + jsPDF-AutoTable (client PDF export)
- PapaParse (CSV export)

---

## 📁 Project Structure

```
visitor-pass-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Login, register, me
│   │   ├── visitorController.js   # CRUD + approve/reject
│   │   ├── passController.js      # Issue, verify, revoke, PDF
│   │   ├── checkLogController.js  # Check-in/out logs
│   │   └── reportController.js    # Dashboard + export
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + authorize
│   │   ├── errorHandler.js        # Global error handler
│   │   └── upload.js              # Multer file upload
│   ├── models/
│   │   ├── User.js                # Users (admin/security/host/visitor)
│   │   ├── Visitor.js             # Visitor records
│   │   ├── Appointment.js         # Scheduled visits
│   │   ├── Pass.js                # Digital passes + QR
│   │   └── CheckLog.js            # Entry/exit audit log
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── visitors.js
│   │   ├── appointments.js
│   │   ├── passes.js
│   │   ├── checkLogs.js
│   │   └── reports.js
│   ├── utils/
│   │   ├── email.js               # Nodemailer + templates
│   │   ├── sms.js                 # Twilio SMS
│   │   ├── qrGenerator.js         # QR code as base64
│   │   ├── pdfGenerator.js        # PDFKit badge
│   │   └── seed.js                # Demo data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   └── layout/
        │       └── AppLayout.js   # Sidebar + topbar
        ├── context/
        │   └── AuthContext.js     # Auth state + JWT
        ├── pages/
        │   ├── Admin/
        │   │   ├── DashboardPage.js
        │   │   ├── VisitorsPage.js
        │   │   ├── PassesPage.js
        │   │   ├── AppointmentsPage.js
        │   │   ├── ReportsPage.js
        │   │   ├── UsersPage.js
        │   │   └── SettingsPage.js
        │   ├── Security/
        │   │   └── CheckInOutPage.js
        │   ├── Visitor/
        │   │   └── MyPassPage.js
        │   ├── LoginPage.js
        │   ├── VerifyPassPage.js
        │   └── NotFoundPage.js
        ├── utils/
        │   └── api.js             # Axios API layer
        ├── App.js
        ├── index.js
        └── index.css
```

---

## 📦 Prerequisites

- Node.js ≥ 18.x
- MongoDB ≥ 6.x (local or Atlas)
- npm or yarn

---

## 🚀 Setup Guide

### 1. Clone the repository

```bash
git clone https://github.com/yourname/visitor-pass-system.git
cd visitor-pass-system
```

### 2. Backend setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, email, etc.

# Seed demo data
npm run seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
npm install

# Start React dev server
npm start
```

The app will open at `http://localhost:3000`

### 4. Production build

```bash
# Build frontend
cd frontend && npm run build

# The build/ folder can be served by the backend or a CDN
```

---

## 👤 Demo Accounts

After running `npm run seed` in the backend:

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@visipass.com | password123 |
| **Security** | security@visipass.com | password123 |
| **Host** | emma@visipass.com | password123 |
| **Host** | robert@visipass.com | password123 |

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register user |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/update-password` | Change password |

### Visitors
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/visitors` | admin, security, host |
| POST | `/api/visitors` | admin, security, host |
| GET | `/api/visitors/:id` | all |
| PUT | `/api/visitors/:id/approve` | admin, host |
| PUT | `/api/visitors/:id/reject` | admin, host |
| DELETE | `/api/visitors/:id` | admin |

### Passes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/passes` | Issue new pass |
| GET | `/api/passes` | List all passes |
| POST | `/api/passes/verify` | Verify QR token |
| PUT | `/api/passes/:id/revoke` | Revoke pass |
| GET | `/api/passes/:id/pdf` | Download PDF badge |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/dashboard` | Analytics stats |
| GET | `/api/reports/export` | Export visitor data |

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access: users, settings, analytics, all CRUD |
| **Security** | Issue passes, check-in/out, view visitors |
| **Host/Employee** | Register visitors, approve own visitors, view appointments |
| **Visitor** | View own digital pass and appointments |

---

## 🌍 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/visipass
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE=+1234567890

CLIENT_URL=http://localhost:3000
```

> 💡 For Gmail, create an **App Password** at myaccount.google.com/apppasswords (requires 2FA)

---

## 🎯 Extra Features Implemented

- ✅ **Blacklist check** — auto-blocks blacklisted visitor emails/IDs
- ✅ **Multi-gate support** — each check-log records entry gate
- ✅ **Audit trail** — every action logged with user + timestamp
- ✅ **Pass auto-expiry** — expired passes flagged on verify
- ✅ **Access zones** — lobby, meeting rooms, restricted, executive
- ✅ **Badge types** — standard, VIP, contractor, delivery (color-coded)
- ✅ **Pre-registration token** — appointments generate a shareable link
- ✅ **Role-based nav** — sidebar dynamically adapts per role
- ✅ **PDF badge** — pdfkit-generated downloadable pass with QR code
- ✅ **CSV/JSON export** — filterable date-range report export

---

## 📸 Screenshots

| Dashboard | Visitors | Pass Card |
|---|---|---|
| Analytics + charts | Registration + approval | QR + PDF badge |

---

## 📄 License

MIT — free to use for educational purposes.
