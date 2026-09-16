const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded memory images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Digital Memory Vault API is running"
  });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "OK",
      database: "Connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database health error:", error);

    res.status(500).json({
      status: "ERROR",
      database: "Not connected"
    });
  }
});

// Protected test route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
});