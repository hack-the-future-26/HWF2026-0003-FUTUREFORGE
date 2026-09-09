const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const { uploadMemory } = require("../controllers/memoryController");

const router = express.Router();


// =========================
// MULTER CONFIGURATION
// =========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage
});


// =========================
// UPLOAD MEMORY
// =========================

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadMemory
);


module.exports = router;