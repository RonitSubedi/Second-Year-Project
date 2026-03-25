const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// ================= GET MY PROFILE =================
router.get("/profile", verifyToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id, name, email, phone, student_id, semester, department, created_at FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
});

// ================= UPDATE PROFILE =================
router.put("/profile", verifyToken, (req, res) => {
  const userId = req.user.id;
  const { name, phone, studentId, semester, department } = req.body;

  db.query(
    "UPDATE users SET name = ?, phone = ?, student_id = ?, semester = ?, department = ? WHERE id = ?",
    [name, phone, studentId, semester, department, userId],
    (err) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Profile updated successfully" });
    }
  );
});

// ================= ADMIN: GET ALL STUDENTS =================
router.get("/students", verifyToken, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });

  db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.student_id, u.semester, u.department, u.created_at,
            br.shift, br.route, br.bus_stop, br.status as reg_status
     FROM users u
     LEFT JOIN bus_registrations br ON u.id = br.user_id AND br.status = 'active'
     ORDER BY u.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

module.exports = router;
