const { getUserById } = require("../models/user");
const crypto = require("crypto");

// Secret key for signing tokens
const SECRET_KEY = crypto.randomBytes(64).toString("hex");

// Generate JWT token
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  // Simple token creation (in real apps, use a proper JWT library)
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64"
  );
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(`${header}.${encodedPayload}`)
    .digest("base64");

  return `${header}.${encodedPayload}.${signature}`;
}

// Verify JWT token
function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split(".");

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(`${header}.${payload}`)
      .digest("base64");

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64").toString()
    );
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate token
async function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    // Get fresh user data
    const user = await getUserById(payload.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error("Error authenticating token:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  isAdmin,
};
