const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// ================= GET MY REGISTRATION =================
router.get("/my", verifyToken, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];

  db.query(
    `SELECT br.*, p.amount, p.transaction_id, p.payment_method, p.created_at as payment_date,
            p.expires_at,
            dsl.shift as today_shift, dsl.route as today_route, dsl.bus_stop as today_bus_stop
     FROM bus_registrations br
     JOIN payments p ON br.payment_id = p.id
     LEFT JOIN daily_shift_logs dsl ON dsl.user_id = br.user_id AND dsl.log_date = ?
     WHERE br.user_id = ? AND br.status = 'active' AND p.expires_at > NOW()
     ORDER BY br.created_at DESC LIMIT 1`,
    [today, userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results[0] || null);
    }
  );
});

// ================= ADMIN: GET ALL REGISTRATIONS =================
router.get("/all", verifyToken, verifyAdmin, (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  db.query(
    `SELECT br.*, u.name, u.email, u.phone, u.student_id, u.semester, u.department,
            p.amount, p.transaction_id, p.payment_method, p.created_at as payment_date, p.expires_at,
            dsl.shift as today_shift, dsl.route as today_route, dsl.bus_stop as today_bus_stop
     FROM bus_registrations br
     JOIN users u ON br.user_id = u.id
     JOIN payments p ON br.payment_id = p.id
     LEFT JOIN daily_shift_logs dsl ON dsl.user_id = br.user_id AND dsl.log_date = ?
     ORDER BY br.created_at DESC`,
    [today],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ================= ADMIN: GET STATS =================
router.get("/stats", verifyToken, verifyAdmin, (req, res) => {
  const STUDENT_LIMIT = 1400;
  const today = new Date().toISOString().split("T")[0];

  const queries = {
    totalRegistered:  "SELECT COUNT(*) as count FROM bus_registrations WHERE status = 'active'",
    totalStudents:    "SELECT COUNT(*) as count FROM users WHERE role = 'student'",
    studentLimit:     `SELECT ${STUDENT_LIMIT} as limit_count`,
    totalRevenue:     "SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'completed'",
    // Today's live shift breakdown from daily_shift_logs
    byShift:          `SELECT shift, COUNT(*) as count FROM daily_shift_logs WHERE log_date = '${today}' GROUP BY shift`,
    // Today's live route breakdown from daily_shift_logs
    byRoute:          `SELECT route, COUNT(*) as count FROM daily_shift_logs WHERE log_date = '${today}' GROUP BY route`,
    // Today's active students count
    todayActive:      `SELECT COUNT(*) as count FROM daily_shift_logs WHERE log_date = '${today}'`,
    recentPayments:   `SELECT p.transaction_id, p.amount, p.payment_method, p.created_at, p.expires_at, u.name, u.email
                       FROM payments p JOIN users u ON p.user_id = u.id
                       ORDER BY p.created_at DESC LIMIT 5`,
    // Today's individual shift log with student details
    todayShiftLogs:   `SELECT dsl.shift, dsl.route, dsl.bus_stop, dsl.log_date,
                              u.name, u.email, u.student_id, u.department, u.semester
                       FROM daily_shift_logs dsl
                       JOIN users u ON dsl.user_id = u.id
                       WHERE dsl.log_date = '${today}'
                       ORDER BY dsl.shift, dsl.route`,
  };

  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, result) => {
      if (!err) stats[key] = result;
      completed++;
      if (completed === total) res.json(stats);
    });
  });
});

// ================= ADMIN: UPDATE REGISTRATION STATUS =================
router.put("/:id/status", verifyToken, verifyAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  db.query(
    "UPDATE bus_registrations SET status = ? WHERE id = ?",
    [status, id],
    (err) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Status updated successfully" });
    }
  );
});

module.exports = router;
