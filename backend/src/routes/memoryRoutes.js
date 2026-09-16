const express = require("express");
const multer = require("multer");
const path = require("path");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getMemories,
  uploadMemory,
  updateMemory,
  deleteMemory,
} = require("../controllers/memoryController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// GET memories
router.get(
  "/",
  authMiddleware,
  getMemories
);

// UPLOAD memory
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadMemory
);

// UPDATE memory
router.put(
  "/:id",
  authMiddleware,
  updateMemory
);

// DELETE memory
router.delete(
  "/:id",
  authMiddleware,
  deleteMemory
);

module.exports = router;