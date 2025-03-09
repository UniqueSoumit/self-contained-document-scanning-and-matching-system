const express = require("express");
const { authenticateToken } = require("../utils/auth");
const { getUserById, updateUserCredits } = require("../models/user");

const router = express.Router();

// Admin-only route to update user credits
router.post("/update-credits", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId, credits } = req.body;
    const result = await updateUserCredits(userId, credits);
    
    if (result.updated) {
      res.json({ message: "Credits updated successfully" });
    } else {
      res.status(400).json({ error: "Failed to update credits" });
    }
  } catch (error) {
    console.error("Error updating credits:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
