const express = require("express");
const cors = require("cors");
const http = require("http");
const os = require("os");
const { Server } = require("socket.io");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";

const corsOptions = {
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const learningRoutes = require("./routes/learningRoutes");
const matchmakingRoutes = require("./routes/matchmakingRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/matchmaking", matchmakingRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Chess Game API is running", status: "OK" });
});

app.get("/api/health", (req, res) => {
  res.json({ message: "Chess Game API is running", status: "OK" });
});

const setupSocketHandlers = require("./utils/socketHandler");
setupSocketHandlers(io);

console.log("Socket.IO initialized successfully");
console.log("Socket.IO setup complete");

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}`);

  const networkInterfaces = os.networkInterfaces();

  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        console.log(`Network: http://${iface.address}:${PORT}`);
      }
    });
  });

  console.log("Socket.IO ready for connections");
  console.log(`CORS enabled for: ${Array.isArray(corsOrigin) ? corsOrigin.join(", ") : corsOrigin}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

module.exports = { app, server, io };
