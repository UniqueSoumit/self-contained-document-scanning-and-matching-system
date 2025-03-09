const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../utils/auth");
const {
  processDocument,
  getAllDocuments,
  saveMatches,
  getMatchesForDocument,
} = require("../models/document");
const { findSimilarDocuments } = require("../utils/textMatching");

const router = express.Router();

// Configure file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../storage/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only text files
    if (file.mimetype === "text/plain") {
      cb(null, true);
    } else {
      cb(new Error("Only plain text files are allowed"), false);
    }
  },
});

// Upload and scan document
router.post(
  "/",
  authenticateToken,
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Read file content
      const filePath = req.file.path;
      const content = fs.readFileSync(filePath, "utf-8");

      // Get title from original filename or use default
      const title =
        path.basename(
          req.file.originalname,
          path.extname(req.file.originalname)
        ) || "Untitled Document";

      // Process document and deduct credit
      const document = await processDocument(
        req.user.id,
        title,
        content,
        filePath
      );

      // Get all existing documents for matching
      const allDocs = await getAllDocuments();

      // Find similar documents
      const matches = findSimilarDocuments(document, allDocs);

      // Save matches in database
      await saveMatches(document.id, matches);

      res.status(201).json({
        message: "Document scanned successfully",
        document: {
          id: document.id,
          title: document.title,
        },
        matches: matches.map((match) => ({
          id: match.id,
          title: match.title,
          similarity: match.similarity,
        })),
        creditsRemaining: req.user.credits - 1,
      });
    } catch (error) {
      console.error("Error scanning document:", error);

      if (error.message === "Insufficient credits") {
        return res.status(403).json({ error: "Insufficient credits" });
      }

      res.status(500).json({ error: "Failed to scan document" });
    }
  }
);

// Get matches for a document
router.get("/matches/:docId", authenticateToken, async (req, res) => {
  try {
    const docId = req.params.docId;
    const matches = await getMatchesForDocument(docId);

    res.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

module.exports = router;
