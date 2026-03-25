const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const STUDENT_LIMIT = 1400;

// ================= REGISTER (students only) =================
router.post("/register", async (req, res) => {
  const { name, email, password, phone, studentId, semester, department } = req.body;

  if (!name || !email || !password || !phone || !studentId || !semester || !department) {
    return res.status(400).json({ message: "All fields are required: Name, Email, Password, Phone, Student ID, Semester, and Department." });
  }
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

  db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'", async (err, countResult) => {
    if (err) return res.status(500).json({ message: "Database error" });
    const currentCount = countResult[0].count;
    if (currentCount >= STUDENT_LIMIT) return res.status(400).json({ message: `Registration is closed. The maximum student limit of ${STUDENT_LIMIT} has been reached.` });

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.length > 0) return res.status(400).json({ message: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users (name,email,password,phone,student_id,semester,department,role) VALUES (?,?,?,?,?,?,?,'student')",
        [name, email, hashedPassword, phone, studentId, semester, department],
        (err) => {
          if (err) return res.status(500).json({ message: "Registration failed" });
          res.json({ message: "Account registered successfully", registered: currentCount + 1, remaining: STUDENT_LIMIT - currentCount - 1 });
        }
      );
    });
  });
});

// ================= GET STUDENT COUNT =================
router.get("/student-count", (req, res) => {
  db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'", (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ registered: result[0].count, total: STUDENT_LIMIT, remaining: STUDENT_LIMIT - result[0].count, isFull: result[0].count >= STUDENT_LIMIT });
  });
});

// ================= LOGIN (all roles) =================
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length === 0) return res.status(400).json({ message: "Invalid email or password" });

    const user = result[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid email or password" });

    const isAdmin  = user.role === "admin";
    const isDriver = user.role === "driver";

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, isAdmin, isDriver, assignedRoute: user.assigned_route },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin, isDriver, assignedRoute: user.assigned_route }
    });
  });
});

module.exports = router;
