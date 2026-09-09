const pool = require("../config/db");
const { analyzeImage } = require("../services/aiService");

const uploadMemory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required"
      });
    }

    const {
      title,
      description,
      category,
      location,
      memory_date
    } = req.body;

    // 1. Save uploaded file information in database
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
        "UPLOADED"
      ]
    );

    const memory = result.rows[0];

    // 2. Send image to AI for analysis
    const aiResult = await analyzeImage(req.file.path);

    // 3. Save AI-generated information
    const updatedResult = await pool.query(
      `UPDATE memories
       SET description = $1,
           category = $2,
           tags = $3,
           processing_status = $4
       WHERE id = $5
       RETURNING *`,
      [
        aiResult.description,
        aiResult.category,
        JSON.stringify(aiResult.tags),
        "COMPLETED",
        memory.id
      ]
    );

    // 4. Send final memory to frontend
    res.status(201).json({
      message: "Memory uploaded and analyzed successfully",
      memory: updatedResult.rows[0]
    });

  } catch (error) {
    console.error("Memory upload error:", error);

    res.status(500).json({
      message: "Memory upload failed"
    });
  }
};

module.exports = {
  uploadMemory
};