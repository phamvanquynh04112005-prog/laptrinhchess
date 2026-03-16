const express = require("express");
const router = express.Router();
const {
  saveGame,
  getGameHistory,
  getStats,
  getCombinedHistory,
} = require("../controllers/gameController");
const { protect } = require("../middleware/authMiddleware");

router.post("/save", protect, saveGame);
router.get("/history", protect, getGameHistory);
router.get("/history/combined", protect, getCombinedHistory);
router.get("/stats", protect, getStats);

module.exports = router;
