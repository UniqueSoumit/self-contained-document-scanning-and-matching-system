// server.js (Updated)
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { db } = require('./doc-scanner/backend/models/database');
const authRoutes = require("./doc-scanner/backend/routes/auth");
const userRoutes = require("./doc-scanner/backend/routes/user");
const adminRoutes = require("./doc-scanner/backend/routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Welcome to the server! The API is working.');
});

