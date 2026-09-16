const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const { analyzeImage } = require("../services/aiService");

// =========================
// GET USER MEMORIES
// =========================

const getMemories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM memories
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({
      memories: result.rows,
    });
  } catch (error) {
    console.error("Get memories error:", error);

    res.status(500).json({
      message: "Unable to load memories",
    });
  }
};

// =========================
// UPLOAD MEMORY
// =========================

const uploadMemory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Image file is required",
      });
    }

    const {
      title,
      description,
      category,
      location,
      memory_date,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO memories
       (user_id, title, description, file_name, file_path, file_type,
        category, location, memory_date, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.userId,
        title || null,
        description || null,
        req.file.originalname,
        req.file.path,
        req.file.mimetype,
        category || null,
        location || null,
        memory_date || null,
        "UPLOADED",
      ]
    );

    const memory = result.rows[0];

    // AI image analysis
    try {
      const aiResult = await analyzeImage(
        req.file.path,
        req.file.mimetype
      );

      const updatedResult = await pool.query(
        `UPDATE memories
         SET description = $1,
             category = $2,
             tags = $3,
             processing_status = $4
         WHERE id = $5
           AND user_id = $6
         RETURNING *`,
        [
          aiResult.description,
          aiResult.category,
          JSON.stringify(aiResult.tags),
          "COMPLETED",
          memory.id,
          req.user.userId,
        ]
      );

      return res.status(201).json({
        message: "Memory uploaded and analyzed successfully",
        memory: updatedResult.rows[0],
      });
    } catch (aiError) {
      console.error("AI processing failed:", aiError);

      await pool.query(
        `UPDATE memories
         SET processing_status = $1
         WHERE id = $2
           AND user_id = $3`,
        [
          "FAILED",
          memory.id,
          req.user.userId,
        ]
      );

      return res.status(201).json({
        message: "Memory uploaded, but AI analysis failed",
        memory: {
          ...memory,
          processing_status: "FAILED",
        },
      });
    }
  } catch (error) {
    console.error("Memory upload error:", error);

    res.status(500).json({
      message: "Memory upload failed",
    });
  }
};

// =========================
// UPDATE MEMORY
// =========================

const updateMemory = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      category,
      location,
      memory_date,
    } = req.body;

    const result = await pool.query(
      `UPDATE memories
       SET title = $1,
           description = $2,
           category = $3,
           location = $4,
           memory_date = $5
       WHERE id = $6
         AND user_id = $7
       RETURNING *`,
      [
        title || null,
        description || null,
        category || null,
        location || null,
        memory_date || null,
        id,
        req.user.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Memory not found",
      });
    }

    res.json({
      message: "Memory updated successfully",
      memory: result.rows[0],
    });
  } catch (error) {
    console.error("Update memory error:", error);

    res.status(500).json({
      message: "Unable to update memory",
    });
  }
};

// =========================
// DELETE MEMORY
// =========================

const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM memories
       WHERE id = $1
         AND user_id = $2
       RETURNING file_path`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Memory not found",
      });
    }

    const filePath = result.rows[0].file_path;

    // Delete image from uploads folder
    if (filePath) {
      const absolutePath = path.resolve(filePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    res.json({
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.error("Delete memory error:", error);

    res.status(500).json({
      message: "Unable to delete memory",
    });
  }
};

// =========================
// EXPORT CONTROLLERS
// =========================

module.exports = {
  getMemories,
  uploadMemory,
  updateMemory,
  deleteMemory,
};