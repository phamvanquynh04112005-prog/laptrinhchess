// backend/routes/matchmakingRoutes.js - FIXED VERSION
const express = require("express");
const router = express.Router();
const matchmakingController = require("../controllers/matchmakingController");
const { protect } = require("../middleware/authMiddleware"); // ✅ ADDED IMPORT

// Queue management
router.post("/queue/join", protect, matchmakingController.joinQueue);
router.post("/queue/leave", protect, matchmakingController.leaveQueue);
router.get("/queue/status", protect, matchmakingController.getQueueStatus);

// Game management
router.get("/games/active", protect, matchmakingController.getActiveGames);
router.get("/games/:gameId", protect, matchmakingController.getGame);
router.post("/games/:gameId/move", protect, matchmakingController.makeMove);
router.post("/games/:gameId/end", protect, matchmakingController.endGame);

// Resign & Draw features
router.post("/games/:gameId/resign", protect, matchmakingController.resignGame);
router.post(
  "/games/:gameId/offer-draw",
  protect,
  matchmakingController.offerDraw,
);
router.post(
  "/games/:gameId/accept-draw",
  protect,
  matchmakingController.acceptDraw,
);

// Leaderboard and stats
router.get("/leaderboard", matchmakingController.getLeaderboard);
router.get("/rating/history", protect, matchmakingController.getRatingHistory);

module.exports = router;
