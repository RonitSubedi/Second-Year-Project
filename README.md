<<<<<<< HEAD
# Project
This is my Project
=======
# 🚌 IIC Bus Management System
**Itahari International College — Full-Stack Bus Management System**
Built with React + Node.js + Express + MySQL

---

## 📁 Project Structure

```
bus_management_system/
├── backend/
│   ├── config/db.js          → MySQL connection
│   ├── middleware/auth.js    → JWT auth middleware
│   ├── routes/
│   │   ├── auth.js           → Login & Register
│   │   ├── payment.js        → Payment processing
│   │   ├── registration.js   → Bus registration
│   │   ├── feedback.js       → Feedback system
│   │   └── user.js           → User profile
│   ├── database.sql          → MySQL schema
│   ├── server.js             → Express server
│   └── .env                  → Environment variables
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx           → Login page
        │   ├── Register.jsx        → Register page
        │   ├── Home.jsx            → Student home
        │   ├── MorningShift.jsx    → Morning shift + map
        │   ├── DayShift.jsx        → Day shift + map
        │   ├── Payment.jsx         → Payment system
        │   ├── StudentDashboard.jsx→ Student profile/dashboard
        │   ├── Feedback.jsx        → Submit feedback
        │   ├── AdminDashboard.jsx  → Admin overview
        │   ├── AdminStudents.jsx   → Admin student list
        │   └── AdminFeedback.jsx   → Admin feedback replies
        └── components/
            └── Navbar.jsx          → Navigation bar
```

---

## 🗄️ MYSQL SETUP (Step by Step)

### Step 1: Open MySQL Workbench or Terminal
```bash
mysql -u root -p
```

### Step 2: Run the Database Schema
```bash
# In MySQL Workbench: Open database.sql and click Run
# In terminal:
mysql -u root -p < database.sql
```

### Step 3: Verify Tables Created
```sql
USE bus_management;
SHOW TABLES;
```
You should see: `users`, `payments`, `bus_registrations`, `feedbacks`

---

## ⚙️ BACKEND SETUP

### Step 1: Go to backend folder
```bash
cd backend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure .env file
Open `backend/.env` and set your MySQL password:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YourMySQLPassword
DB_NAME=bus_management
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

### Step 4: Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server will run at: **http://localhost:5000**

---

## 💻 FRONTEND SETUP

### Step 1: Go to frontend folder
```bash
cd frontend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Start React app
```bash
npm run dev
```

App will open at: **http://localhost:3000**

---

## 🔑 LOGIN CREDENTIALS

### Admin Login
- **Email:** 
- **Password:** 
- → Redirected to Admin Dashboard

### Student Login
- Register a new account via /register
- → Redirected to Student Home

---

## 📮 POSTMAN TESTING GUIDE

### 1. Import Base URL
Set base URL in Postman: `http://localhost:5000/api`

### 2. Auth Endpoints

#### Register Student
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "name": "Ram Kumar",
  "email": "ram@student.com",
  "password": "password123",
  "phone": "9800000001",
  "studentId": "IIC-2024-001",
  "semester": "Semester 4",
  "department": "BCA"
}
```

#### Login (Student or Admin)
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "admin@iic.edu.np",
  "password": "admin123"
}
→ Returns: { token, role, user }
```

**Copy the token from the response.**

### 3. Set Authorization Header
In Postman → Headers tab:
```
Key: Authorization
Value: Bearer <paste_your_token_here>
```

### 4. Payment Endpoint
```
POST http://localhost:5000/api/payment/initiate
Authorization: Bearer <token>
Body (JSON):
{
  "amount": 8500,
  "paymentMethod": "esewa",
  "shift": "morning",
  "route": "Dharan",
  "busStop": "BPKIHS"
}
→ Returns: { transactionId, details }
```

### 5. Registration Endpoints

#### Get My Registration (student)
```
GET http://localhost:5000/api/registration/my
Authorization: Bearer <student_token>
```

#### Get All Registrations (admin only)
```
GET http://localhost:5000/api/registration/all
Authorization: Bearer <admin_token>
```

#### Get Stats (admin only)
```
GET http://localhost:5000/api/registration/stats
Authorization: Bearer <admin_token>
```

### 6. Feedback Endpoints

#### Submit Feedback
```
POST http://localhost:5000/api/feedback
Authorization: Bearer <student_token>
Body (JSON):
{
  "subject": "Bus was late",
  "message": "The Dharan route bus was 20 minutes late today.",
  "rating": 3
}
```

#### Get My Feedbacks
```
GET http://localhost:5000/api/feedback/my
Authorization: Bearer <student_token>
```

#### Admin: Get All Feedbacks
```
GET http://localhost:5000/api/feedback/all
Authorization: Bearer <admin_token>
```

#### Admin: Reply to Feedback
```
PUT http://localhost:5000/api/feedback/1/reply
Authorization: Bearer <admin_token>
Body (JSON):
{
  "reply": "We apologize for the delay. We have addressed the issue with the driver."
}
```

### 7. User Profile Endpoints

#### Get My Profile
```
GET http://localhost:5000/api/user/profile
Authorization: Bearer <student_token>
```

#### Update Profile
```
PUT http://localhost:5000/api/user/profile
Authorization: Bearer <student_token>
Body (JSON):
{
  "name": "Ram Kumar Shrestha",
  "phone": "9800000001",
  "studentId": "IIC-2024-001",
  "semester": "Semester 5",
  "department": "BCA"
}
```

#### Admin: Get All Students
```
GET http://localhost:5000/api/user/students
Authorization: Bearer <admin_token>
```

### 8. Health Check
```
GET http://localhost:5000/api/health
→ Returns: { status: "OK", message: "..." }
```

---

## 🗺️ ROUTES & STOP COUNT

| Route      | Morning Start | Day Start | Stops |
|------------|--------------|-----------|-------|
| Dharan     | 6:40 AM      | 10:40 AM  | 12    |
| Biratnagar | 6:45 AM      | 10:45 AM  | 19    |
| Damak      | 6:00 AM      | 10:00 AM  | 18    |
| Inaruwa    | 6:30 AM      | 10:30 AM  | 15    |

---

## 📋 FEATURES SUMMARY

### Student Panel
- ✅ Register & Login
- ✅ View Morning/Day Shift schedules
- ✅ Live Route Map (Google Maps embed)
- ✅ Pay bus fee (eSewa, Khalti, IME Pay, Bank Transfer, Cash)
- ✅ Dashboard with profile, registration, payment history
- ✅ Submit and track feedback

### Admin Panel
- ✅ Separate admin login (single admin account)
- ✅ Dashboard with stats, charts, recent payments
- ✅ View all registered students with filters
- ✅ Manage and reply to feedback

---

## 🛠️ TECH STACK

| Layer    | Technology              |
|----------|------------------------|
| Frontend | React 18 + Vite        |
| Routing  | React Router v6         |
| HTTP     | Axios                   |
| Backend  | Node.js + Express       |
| Database | MySQL 8.x               |
| Auth     | JWT + bcryptjs          |
| Maps     | Google Maps Embed API   |
| CSS      | Separate CSS per page   |

---

## ⚠️ TROUBLESHOOTING

**MySQL connection error:**
→ Check DB_PASSWORD in .env matches your MySQL root password

**CORS error in frontend:**
→ Make sure backend is running on port 5000

**Token errors:**
→ Login again to get a fresh token

**npm install fails:**
→ Delete node_modules and package-lock.json, then run npm install again
>>>>>>> e4f9e69 (Initial commit - Bus Management System)
