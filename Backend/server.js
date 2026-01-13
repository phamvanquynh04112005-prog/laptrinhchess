const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initDatabase, checkConnection } = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ], // Cho phép cả 3 port
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);

// Health check với kiểm tra database
app.get("/api/health", async (req, res) => {
  try {
    const dbConnected = await checkConnection();
    res.json({
      status: "OK",
      message: "Server is running",
      database: dbConnected ? "Connected" : "Disconnected",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Server error",
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🚀 Starting Chess Server...");
    console.log("📦 Initializing database...");

    await initDatabase();

    console.log(`✅ Database initialized successfully!`);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: ${process.env.DB_NAME}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.log("\n🔧 TROUBLESHOOTING:");
    console.log("1. Chạy test-chess-admin.js để kiểm tra kết nối");
    console.log("2. Kiểm tra SQL Server service đang chạy");
    console.log("3. Kiểm tra file .env có đúng cấu hình");
    console.log("4. Kiểm tra quyền của user chess_admin");

    process.exit(1);
  }
};

startServer();
