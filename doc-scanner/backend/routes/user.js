const express = require("express");
const { authenticateToken } = require("../utils/auth");
const { db } = require("../models/database");

const router = express.Router();

// Get user profile
router.get("/profile", authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      credits: req.user.credits,
      lastReset: req.user.last_reset,
    },
  });
});

// Get user scan history
router.get("/history", authenticateToken, (req, res) => {
  const query = `
    SELECT d.id, d.title, d.scanned_at, COUNT(m.id) as matches
    FROM documents d
    LEFT JOIN (
      SELECT DISTINCT document_id, matched_document_id as id
      FROM matches
      WHERE document_id IN (SELECT id FROM documents WHERE user_id = ?)
    ) m ON d.id = m.id
    WHERE d.user_id = ?
    GROUP BY d.id
    ORDER BY d.scanned_at DESC
  `;

  db.all(query, [req.user.id, req.user.id], (err, rows) => {
    if (err) {
      console.error("Error fetching scan history:", err);
      return res.status(500).json({ error: "Failed to fetch scan history" });
    }

    res.json({ history: rows });
  });
});

// Get user credit requests
router.get("/credit-requests", authenticateToken, (req, res) => {
  db.all(
    "SELECT id, amount, status, requested_at, processed_at FROM credit_requests WHERE user_id = ? ORDER BY requested_at DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("Error fetching credit requests:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch credit requests" });
      }

      res.json({ requests: rows });
    }
  );
});

module.exports = router;
