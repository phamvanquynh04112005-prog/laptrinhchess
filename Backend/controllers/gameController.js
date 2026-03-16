const Game = require("../models/Game");
const User = require("../models/User");
const Rating = require("../models/Rating");

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
    res.json({ success: true, games });
  } catch (error) {
    console.error("Get game history error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử",
    });
  }
};

exports.getCombinedHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const games = await Game.getCombinedHistory(req.user.id, limit);
    res.json({ success: true, games });
  } catch (error) {
    console.error("Get combined history error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử",
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const aiStats = await Game.getUserStats(req.user.id);
    const onlineStats = await Game.getOnlineStats(req.user.id);
    const userStatsRow = await Rating.getUserStats(req.user.id);

    const totalGames = (Number(aiStats.total_games) || 0) + (Number(onlineStats.total) || 0);
    const wins = (Number(aiStats.wins) || 0) + (Number(onlineStats.wins) || 0);
    const losses = (Number(aiStats.losses) || 0) + (Number(onlineStats.losses) || 0);
    const draws = (Number(aiStats.draws) || 0) + (Number(onlineStats.draws) || 0);
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
    const avgTime = aiStats.avg_time || 0;
    const bestStreak = (userStatsRow && userStatsRow.best_streak) || 0;

    res.json({
      success: true,
      stats: {
        total_games: totalGames,
        wins,
        losses,
        draws,
        win_rate: parseFloat(winRate),
        avg_time: Math.round(avgTime),
        best_streak: bestStreak,
        bullet_rating: userStatsRow?.bullet_rating ?? 1200,
        blitz_rating: userStatsRow?.blitz_rating ?? 1200,
        rapid_rating: userStatsRow?.rapid_rating ?? 1200,
        classical_rating: userStatsRow?.classical_rating ?? 1200,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
    });
  }
};
