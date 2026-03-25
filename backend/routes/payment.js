const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// ================= INITIATE PAYMENT =================
router.post("/initiate", verifyToken, (req, res) => {
  const userId = req.user.id;
  const { amount, paymentMethod, cardNumber, cardHolder, shift, route, busStop } = req.body;

  if (!amount || !paymentMethod || !shift || !route || !busStop) {
    return res.status(400).json({ message: "All fields required" });
  }

  // Check if there is a currently ACTIVE and NOT EXPIRED payment/registration
  db.query(
    `SELECT br.*, p.expires_at, p.amount as paid_amount, p.transaction_id, p.id as pid
     FROM bus_registrations br
     JOIN payments p ON br.payment_id = p.id
     WHERE br.user_id = ? AND br.status = 'active' AND p.expires_at > NOW()
     LIMIT 1`,
    [userId],
    (err, existing) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (existing.length > 0) {
        // They have a valid active payment — log today's shift choice (allow daily change)
        const today = new Date().toISOString().split("T")[0];
        const reg = existing[0];

        db.query(
          `INSERT INTO daily_shift_logs (user_id, payment_id, shift, route, bus_stop, log_date)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE shift = VALUES(shift), route = VALUES(route), bus_stop = VALUES(bus_stop)`,
          [userId, reg.pid, shift, route, busStop, today],
          (err2) => {
            if (err2) return res.status(500).json({ message: "Failed to update today's shift" });

            return res.json({
              message: `Today's shift updated to ${shift} shift successfully!`,
              transactionId: reg.transaction_id,
              details: { shift, route, busStop, amount: reg.paid_amount },
              expiresAt: reg.expires_at,
              alreadyPaid: true,
            });
          }
        );
        return;
      }

      // No active registration — create new payment (expires in 1 month)
      const transactionId = "TXN" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      db.query(
        "INSERT INTO payments (user_id, amount, payment_method, transaction_id, status, expires_at) VALUES (?, ?, ?, ?, 'completed', ?)",
        [userId, amount, paymentMethod, transactionId, expiresAt],
        (err, payResult) => {
          if (err) return res.status(500).json({ message: "Payment failed" });

          const paymentId = payResult.insertId;

          db.query(
            "INSERT INTO bus_registrations (user_id, payment_id, shift, route, bus_stop, status) VALUES (?, ?, ?, ?, ?, 'active')",
            [userId, paymentId, shift, route, busStop],
            (err) => {
              if (err) return res.status(500).json({ message: "Registration failed after payment" });

              // Log today's shift
              const today = new Date().toISOString().split("T")[0];
              db.query(
                `INSERT INTO daily_shift_logs (user_id, payment_id, shift, route, bus_stop, log_date)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE shift = VALUES(shift), route = VALUES(route), bus_stop = VALUES(bus_stop)`,
                [userId, paymentId, shift, route, busStop, today],
                () => {} // non-critical
              );

              res.json({
                message: "Payment successful and bus slot registered!",
                transactionId,
                details: { shift, route, busStop, amount },
                expiresAt,
              });
            }
          );
        }
      );
    }
  );
});

// ================= GET PAYMENT HISTORY =================
router.get("/history", verifyToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT p.*, br.shift, br.route, br.bus_stop
     FROM payments p
     LEFT JOIN bus_registrations br ON p.id = br.payment_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ================= ADMIN: GET ALL PAYMENTS =================
router.get("/all", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    `SELECT p.id, p.transaction_id, p.amount, p.payment_method, p.status, p.created_at, p.expires_at,
            u.name, u.email, u.student_id,
            br.shift, br.route, br.bus_stop
     FROM payments p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN bus_registrations br ON p.id = br.payment_id
     ORDER BY p.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

module.exports = router;
