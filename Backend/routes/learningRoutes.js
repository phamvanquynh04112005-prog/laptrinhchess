// routes/learningRoutes.js - UPDATED
const express = require("express");
const router = express.Router();
const {
  getRandomPuzzle,
  getDailyPuzzle,
  submitPuzzleAttempt,
  getPuzzleStats,
  getPuzzlesByTheme,
  getAllOpenings,
  searchOpenings,
  getPopularOpenings,
  getUserOpeningStats,
  getOpeningRecommendations,
  getEndgameCategories,
  getEndgamesByCategory,
  getNextEndgame,
  submitEndgameAttempt,
  getEndgameProgress,
  analyzeGame,
  getGameAnalysis,
} = require("../controllers/learningController");
const { protect } = require("../middleware/authMiddleware");

// ============ PUZZLE ROUTES ============
router.get("/puzzles/random", protect, getRandomPuzzle);
router.get("/puzzles/daily", protect, getDailyPuzzle); // NEW
router.post("/puzzles/attempt", protect, submitPuzzleAttempt);
router.get("/puzzles/stats", protect, getPuzzleStats);
router.get("/puzzles/theme/:theme", protect, getPuzzlesByTheme);

// ============ OPENING ROUTES ============
router.get("/openings", protect, getAllOpenings);
router.get("/openings/search", protect, searchOpenings);
router.get("/openings/popular", protect, getPopularOpenings);
router.get("/openings/stats", protect, getUserOpeningStats);
router.get("/openings/recommendations", protect, getOpeningRecommendations);

// ============ ENDGAME ROUTES ============
router.get("/endgames/categories", protect, getEndgameCategories);
router.get("/endgames/category/:category", protect, getEndgamesByCategory);
router.get("/endgames/next", protect, getNextEndgame);
router.post("/endgames/attempt", protect, submitEndgameAttempt);
router.get("/endgames/progress", protect, getEndgameProgress);

// ============ ANALYSIS ROUTES ============
router.post("/analysis/:gameId", protect, analyzeGame);
router.get("/analysis/:gameId", protect, getGameAnalysis);

module.exports = router;
