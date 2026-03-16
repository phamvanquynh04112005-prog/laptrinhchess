// backend/middleware/authMiddleware.js - FIXED VERSION
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-here",
      );

      // Get user from database (without password)
      const users = await db.query(
        "SELECT id, username, email, created_at FROM users WHERE id = ?",
        [decoded.id],
      );

      if (users.length === 0) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      // Add user to request object
      req.user = users[0];
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
        error: error.message,
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

module.exports = { protect };
