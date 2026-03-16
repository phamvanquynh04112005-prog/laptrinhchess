// controllers/learningController.js - FIXED VERSION
const Puzzle = require("../models/Puzzle");
const Opening = require("../models/Opening");
const Endgame = require("../models/Endgame");
const Game = require("../models/Game");

// ============ PUZZLE CONTROLLERS ============
exports.getRandomPuzzle = async (req, res) => {
  try {
    const { difficulty } = req.query;
    const userId = req.user?.id;

    let puzzle;
    if (difficulty) {
      puzzle = await Puzzle.getRandomByDifficulty(difficulty, userId);
    } else {
      puzzle = await Puzzle.getByUserRating(userId);
    }

    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy puzzle phù hợp",
      });
    }

    res.json({
      success: true,
      puzzle,
    });
  } catch (error) {
    console.error("Get puzzle error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy puzzle",
    });
  }
};

// NEW: Daily puzzle
exports.getDailyPuzzle = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get puzzle based on current day
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000,
    );

    const puzzle = await Puzzle.getDailyPuzzle(dayOfYear, userId);

    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy puzzle hôm nay",
      });
    }

    res.json({
      success: true,
      puzzle,
    });
  } catch (error) {
    console.error("Get daily puzzle error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy daily puzzle",
    });
  }
};

exports.submitPuzzleAttempt = async (req, res) => {
  try {
    const { puzzleId, solved, timeSpent } = req.body;

    if (!puzzleId || solved === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    await Puzzle.saveAttempt(req.user.id, puzzleId, solved, timeSpent || 0);

    res.json({
      success: true,
      message: solved ? "Chính xác! 🎉" : "Sai rồi, thử lại nhé! 💪",
    });
  } catch (error) {
    console.error("Submit puzzle error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lưu kết quả",
    });
  }
};

exports.getPuzzleStats = async (req, res) => {
  try {
    const stats = await Puzzle.getUserStats(req.user.id);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get puzzle stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
    });
  }
};

exports.getPuzzlesByTheme = async (req, res) => {
  try {
    const { theme } = req.params;

    if (!theme) {
      return res.status(400).json({
        success: false,
        message: "Thiếu theme",
      });
    }

    const puzzles = await Puzzle.getByTheme(theme);

    res.json({
      success: true,
      puzzles,
    });
  } catch (error) {
    console.error("Get puzzles by theme error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy puzzles",
    });
  }
};

// ============ OPENING CONTROLLERS ============
exports.getAllOpenings = async (req, res) => {
  try {
    const openings = await Opening.getAll();

    res.json({
      success: true,
      openings,
    });
  } catch (error) {
    console.error("Get openings error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách khai cuộc",
    });
  }
};

exports.searchOpenings = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập ít nhất 2 ký tự",
      });
    }

    const openings = await Opening.searchByName(q);

    res.json({
      success: true,
      openings,
    });
  } catch (error) {
    console.error("Search openings error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm",
    });
  }
};

exports.getPopularOpenings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const openings = await Opening.getPopular(limit);

    res.json({
      success: true,
      openings,
    });
  } catch (error) {
    console.error("Get popular openings error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy khai cuộc phổ biến",
    });
  }
};

exports.getUserOpeningStats = async (req, res) => {
  try {
    const stats = await Opening.getUserOpeningStats(req.user.id);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get opening stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
    });
  }
};

exports.getOpeningRecommendations = async (req, res) => {
  try {
    const recommendations = await Opening.getRecommendations(req.user.id);

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy gợi ý",
    });
  }
};

// ============ ENDGAME CONTROLLERS ============
exports.getEndgameCategories = async (req, res) => {
  try {
    const categories = await Endgame.getCategories();

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh mục",
    });
  }
};

exports.getEndgamesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Thiếu category",
      });
    }

    const endgames = await Endgame.getByCategory(category);

    res.json({
      success: true,
      endgames,
    });
  } catch (error) {
    console.error("Get endgames error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy tàn cuộc",
    });
  }
};

exports.getNextEndgame = async (req, res) => {
  try {
    const endgame = await Endgame.getNextForUser(req.user.id);

    if (!endgame) {
      return res.status(404).json({
        success: false,
        message: "Bạn đã hoàn thành tất cả tàn cuộc! 🎉",
      });
    }

    res.json({
      success: true,
      endgame,
    });
  } catch (error) {
    console.error("Get next endgame error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy tàn cuộc",
    });
  }
};

exports.submitEndgameAttempt = async (req, res) => {
  try {
    const { endgameId, success } = req.body;

    if (!endgameId || success === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    await Endgame.saveProgress(req.user.id, endgameId, success);

    res.json({
      success: true,
      message: success ? "Chính xác! 🎯" : "Sai rồi, thử lại nhé! 💪",
    });
  } catch (error) {
    console.error("Submit endgame error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lưu kết quả",
    });
  }
};

exports.getEndgameProgress = async (req, res) => {
  try {
    const progress = await Endgame.getUserProgress(req.user.id);

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy tiến độ",
    });
  }
};

// ============ GAME ANALYSIS CONTROLLERS ============
exports.analyzeGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);

    if (!game || game.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ván cờ",
      });
    }

    const moveHistory = JSON.parse(game.move_history || "[]");

    // Simple analysis (integrate Stockfish later)
    const analysis = {
      totalMoves: moveHistory.length,
      averageTime: game.time_spent / Math.max(moveHistory.length, 1),
      blunders: Math.floor(Math.random() * 3), // Placeholder
      mistakes: Math.floor(Math.random() * 5),
      inaccuracies: Math.floor(Math.random() * 8),
      accuracy: Math.max(70, 100 - moveHistory.length / 10), // Placeholder
      bestMoves: [],
      evaluation: [],
    };

    await Game.saveAnalysis(gameId, {
      bestMoves: [],
      mistakesCount: analysis.mistakes,
      blundersCount: analysis.blunders,
      inaccuraciesCount: analysis.inaccuracies,
      accuracyPercentage: analysis.accuracy,
    });

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Analyze game error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi phân tích",
    });
  }
};

exports.getGameAnalysis = async (req, res) => {
  try {
    const { gameId } = req.params;

    const games = await Game.getDetailedHistory(req.user.id, 100);
    const game = games.find((g) => g.id === parseInt(gameId));

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân tích",
      });
    }

    res.json({
      success: true,
      analysis: game,
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy phân tích",
    });
  }
};

module.exports = exports;
