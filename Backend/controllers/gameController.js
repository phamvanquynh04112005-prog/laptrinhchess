const Game = require("../models/Game");
const User = require("../models/User");

exports.saveGame = async (req, res) => {
  try {
    const {
      opponentType,
      difficulty,
      result,
      movesCount,
      timeSpent,
      fenPosition,
      moveHistory,
    } = req.body;

    const gameId = await Game.create({
      userId: req.user.id,
      opponentType,
      difficulty,
      result,
      movesCount,
      timeSpent,
      fenPosition,
      moveHistory,
    });

    // Update user stats
    await User.updateStats(req.user.id, result === "win");

    res.status(201).json({
      success: true,
      gameId,
      message: "Lưu ván cờ thành công",
    });
  } catch (error) {
    console.error("Save game error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lưu ván cờ",
    });
  }
};

exports.getGameHistory = async (req, res) => {
  try {
    const games = await Game.findByUserId(req.user.id, 20);
    res.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error("Get game history error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử",
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Game.getUserStats(req.user.id);
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
    });
  }
};
