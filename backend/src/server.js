const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// AUTH ROUTES
app.use("/api/auth", authRoutes);

// MEMORY ROUTES
app.use("/api/memories", memoryRoutes);

// BASIC TEST ROUTE
app.get("/", (req, res) => {
  res.json({
    message: "Digital Memory Vault API is running"
  });
});

// DATABASE HEALTH CHECK
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

// PROTECTED TEST ROUTE
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle unexpected errors
server.on("error", (error) => {
  console.error("Server error:", error);
});