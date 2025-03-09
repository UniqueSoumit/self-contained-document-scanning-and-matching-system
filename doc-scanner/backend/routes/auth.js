const express = require("express");
const bcrypt = require("bcryptjs");
const { getUserByUsername, createUser } = require("../models/user");
const { authenticateToken, generateToken } = require("../utils/auth");

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required" });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Username already exists" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(username, hashedPassword);
    
    // Generate authentication token
    const token = generateToken(user);

    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
    return res.status(201).json({ success: true, message: "User registered successfully", user });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
  
      const user = await getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      const token = generateToken(user);
      res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
  
      res.status(200).json({
        success: true,
        message: "Login successful",
        user: { id: user.id, username: user.username, role: user.role },
        token,
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });
  

// Export Router
module.exports = router;
