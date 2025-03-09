const { db } = require("./database");
const { updateUserCredits } = require("./user");

// Request additional credits
function requestCredits(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO credit_requests (user_id, amount) VALUES (?, ?)",
      [userId, amount],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            userId,
            amount,
            status: "pending",
            requestedAt: new Date().toISOString(),
          });
        }
      }
    );
  });
}

// Get all pending credit requests (for admin)
function getPendingCreditRequests() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT cr.id, cr.user_id, cr.amount, cr.status, cr.requested_at, 
             u.username
      FROM credit_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.status = 'pending'
      ORDER BY cr.requested_at ASC
    `;

    db.all(query, [], (err, requests) => {
      if (err) {
        reject(err);
      } else {
        resolve(requests);
      }
    });
  });
}

// Process credit request (approve or deny)
function processCreditRequest(requestId, status, adminId) {
  return new Promise((resolve, reject) => {
    // Start a transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Get the request details
      db.get(
        "SELECT * FROM credit_requests WHERE id = ?",
        [requestId],
        async (err, request) => {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }

          if (!request) {
            db.run("ROLLBACK");
            return reject(new Error("Credit request not found"));
          }

          try {
            // Update request status
            db.run(
              "UPDATE credit_requests SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?",
              [status, requestId]
            );

            // If approved, add credits to user
            if (status === "approved") {
              // Get current user credits
              const user = await new Promise((resolve, reject) => {
                db.get(
                  "SELECT credits FROM users WHERE id = ?",
                  [request.user_id],
                  (err, user) => {
                    if (err) reject(err);
                    else resolve(user);
                  }
                );
              });

              if (!user) {
                db.run("ROLLBACK");
                return reject(new Error("User not found"));
              }

              // Update user credits
              await updateUserCredits(
                request.user_id,
                user.credits + request.amount
              );

              // Log the approval
              db.run(
                "INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)",
                [
                  adminId,
                  "credit_approval",
                  JSON.stringify({
                    requestId,
                    userId: request.user_id,
                    amount: request.amount,
                  }),
                ]
              );
            }

            // Commit the transaction
            db.run("COMMIT");

            resolve({
              id: requestId,
              status,
              processedAt: new Date().toISOString(),
            });
          } catch (error) {
            db.run("ROLLBACK");
            reject(error);
          }
        }
      );
    });
  });
}

// Get credit request history for a user
function getUserCreditRequestHistory(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT id, amount, status, requested_at, processed_at FROM credit_requests WHERE user_id = ? ORDER BY requested_at DESC",
      [userId],
      (err, requests) => {
        if (err) {
          reject(err);
        } else {
          resolve(requests);
        }
      }
    );
  });
}

// Check if user has pending credit requests
function hasPendingRequests(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM credit_requests WHERE user_id = ? AND status = "pending"',
      [userId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.count > 0);
        }
      }
    );
  });
}

// Reset daily credits for all users
function resetDailyCredits() {
  return new Promise((resolve, reject) => {
    // Get current time
    const now = new Date();

    // Calculate 24 hours ago
    const yesterday = new Date(now);
    yesterday.setHours(yesterday.getHours() - 24);

    const yesterdayStr = yesterday.toISOString();

    db.run(
      `UPDATE users 
       SET credits = CASE
         WHEN credits < 20 THEN 20
         ELSE credits
       END,
       last_reset = CURRENT_TIMESTAMP
       WHERE role = 'user' AND last_reset <= ?`,
      [yesterdayStr],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            usersUpdated: this.changes,
          });
        }
      }
    );
  });
}

// Get credit statistics for analytics
function getCreditStatistics() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_approved_credits,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'denied' THEN 1 END) as denied_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        AVG(CASE WHEN status = 'approved' THEN amount END) as avg_approved_amount
      FROM credit_requests
    `;

    db.get(query, [], (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

// Get top users by credit usage
function getTopCreditUsers(limit = 10) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        COUNT(s.id) as total_scans,
        (SELECT COUNT(*) FROM credit_requests cr WHERE cr.user_id = u.id AND cr.status = 'approved') as approved_requests,
        (SELECT SUM(amount) FROM credit_requests cr WHERE cr.user_id = u.id AND cr.status = 'approved') as additional_credits
      FROM users u
      LEFT JOIN scans s ON u.id = s.user_id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY total_scans DESC
      LIMIT ?
    `;

    db.all(query, [limit], (err, users) => {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });
}

module.exports = {
  requestCredits,
  getPendingCreditRequests,
  processCreditRequest,
  getUserCreditRequestHistory,
  hasPendingRequests,
  resetDailyCredits,
  getCreditStatistics,
  getTopCreditUsers,
};
