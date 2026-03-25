const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// ================= SUBMIT FEEDBACK =================
router.post("/", verifyToken, (req, res) => {
  const userId = req.user.id;
  const { subject, message, rating } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: "Subject and message are required" });
  }

  db.query(
    "INSERT INTO feedbacks (user_id, subject, message, rating) VALUES (?, ?, ?, ?)",
    [userId, subject, message, rating || 5],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to submit feedback" });
      res.json({ message: "Feedback submitted successfully. Thank you!" });
    }
  );
});

// ================= GET MY FEEDBACKS =================
router.get("/my", verifyToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT * FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ================= ADMIN: GET ALL FEEDBACKS =================
router.get("/all", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    `SELECT f.*, u.name, u.email, u.student_id 
     FROM feedbacks f 
     JOIN users u ON f.user_id = u.id 
     ORDER BY f.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ================= ADMIN: REPLY TO FEEDBACK =================
router.put("/:id/reply", verifyToken, verifyAdmin, (req, res) => {
  const { reply } = req.body;
  const { id } = req.params;

  db.query(
    "UPDATE feedbacks SET admin_reply = ?, status = 'replied' WHERE id = ?",
    [reply, id],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to send reply" });
      res.json({ message: "Reply sent successfully" });
    }
  );
});

module.exports = router;
