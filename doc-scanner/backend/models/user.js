const { db } = require("./database");
const bcrypt = require("bcryptjs");

// Get user by ID
function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, username, role, credits, last_reset, created_at FROM users WHERE id = ?",
      [id],
      (err, user) => (err ? reject(err) : resolve(user))
    );
  });
}

// Get user by username
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
      err ? reject(err) : resolve(user);
    });
  });
}

// Create new user
async function createUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (username, password, credits, last_reset) VALUES (?, ?, 20, CURRENT_TIMESTAMP)",
      [username, hashedPassword],
      function (err) {
        err
          ? reject(err)
          : resolve({ id: this.lastID, username, role: "user", credits: 20 });
      }
    );
  });
}

// Update user credits
function updateUserCredits(userId, credits) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE users SET credits = ? WHERE id = ?", [credits, userId], function (err) {
      err ? reject(err) : resolve({ updated: this.changes > 0 });
    });
  });
}

// Reset free credits for all users (at midnight)
function resetFreeCredits() {
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET credits = CASE WHEN credits < 20 THEN 20 ELSE credits END, last_reset = ? WHERE role = "user"',
      [now],
      function (err) {
        err ? reject(err) : resolve({ updated: this.changes });
      }
    );
  });
}

module.exports = { getUserById, getUserByUsername, createUser, updateUserCredits, resetFreeCredits };
