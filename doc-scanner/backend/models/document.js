const { db } = require("./database");
const fs = require("fs");
const path = require("path");
const { updateUserCredits } = require("./user");

// Save uploaded document
function saveDocument(userId, title, content, filePath) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO documents (user_id, title, content, file_path) VALUES (?, ?, ?, ?)",
      [userId, title, content, filePath],
      function (err) {
        if (err) {
          reject(err);
        } else {
          // Also log this scan in the scans table for analytics
          db.run("INSERT INTO scans (user_id, document_id) VALUES (?, ?)", [
            userId,
            this.lastID,
          ]);

          resolve({
            id: this.lastID,
            title,
            content,
            filePath,
            userId,
          });
        }
      }
    );
  });
}

// Get document by ID
function getDocumentById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM documents WHERE id = ?", [id], (err, document) => {
      if (err) {
        reject(err);
      } else {
        resolve(document);
      }
    });
  });
}

// Get all documents (for matching)
function getAllDocuments() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM documents", [], (err, documents) => {
      if (err) {
        reject(err);
      } else {
        resolve(documents);
      }
    });
  });
}

// Save match results
function saveMatches(documentId, matches) {
  const values = matches.map((match) => [
    documentId,
    match.id,
    match.similarity,
  ]);

  if (values.length === 0) {
    return Promise.resolve([]);
  }

  const placeholders = values.map(() => "(?, ?, ?)").join(", ");
  const flatValues = values.flat();

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO matches (document_id, matched_document_id, similarity) VALUES ${placeholders}`,
      flatValues,
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(matches);
        }
      }
    );
  });
}

// Process document and deduct credit
async function processDocument(userId, title, content, filePath) {
  // Create a database transaction
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Check if user has enough credits
      db.get(
        "SELECT credits FROM users WHERE id = ?",
        [userId],
        async (err, user) => {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }

          if (!user || user.credits < 1) {
            db.run("ROLLBACK");
            return reject(new Error("Insufficient credits"));
          }

          try {
            // Save the document
            const document = await saveDocument(
              userId,
              title,
              content,
              filePath
            );

            // Deduct credit
            await updateUserCredits(userId, user.credits - 1);

            // Commit transaction
            db.run("COMMIT");
            resolve(document);
          } catch (error) {
            db.run("ROLLBACK");
            reject(error);
          }
        }
      );
    });
  });
}

// Get matches for a document
function getMatchesForDocument(documentId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT d.id, d.title, d.user_id, d.scanned_at, m.similarity
      FROM matches m
      JOIN documents d ON m.matched_document_id = d.id
      WHERE m.document_id = ?
      ORDER BY m.similarity DESC
    `;

    db.all(query, [documentId], (err, matches) => {
      if (err) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  });
}

module.exports = {
  saveDocument,
  getDocumentById,
  getAllDocuments,
  saveMatches,
  processDocument,
  getMatchesForDocument,
};
