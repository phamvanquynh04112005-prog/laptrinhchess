const { query } = require("../config/database");

class Game {
  static async create(gameData) {
    const {
      userId,
      opponentType,
      difficulty,
      result,
      movesCount,
      timeSpent,
      fenPosition,
      moveHistory,
    } = gameData;

    result = await query(
      `INSERT INTO games (user_id, opponent_type, difficulty, result, moves_count, time_spent, fen_position, move_history) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        opponentType,
        difficulty,
        result,
        movesCount || 0,
        timeSpent || 0,
        fenPosition,
        JSON.stringify(moveHistory || []),
      ]
    );

    return result.insertId;
  }

  static async findByUserId(userId, limit = 10) {
    const games = await query(
      `SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return games;
  }

  static async findById(gameId) {
    const games = await query("SELECT * FROM games WHERE id = ?", [gameId]);
    return games[0] || null;
  }

  static async getUserStats(userId) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
        AVG(moves_count) as avg_moves,
        AVG(time_spent) as avg_time
       FROM games WHERE user_id = ?`,
      [userId]
    );
    return (
      result[0] || {
        total_games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        avg_moves: 0,
        avg_time: 0,
      }
    );
  }

  // Lấy lịch sử chi tiết với phân tích
  static async getDetailedHistory(userId, limit = 20) {
    const games = await query(
      `SELECT 
        g.*,
        ga.accuracy_percentage,
        ga.mistakes_count
      FROM games g
      LEFT JOIN game_analysis ga ON g.id = ga.game_id
      WHERE g.user_id = ?
      ORDER BY g.created_at DESC
      LIMIT ?`,
      [userId, limit]
    );

    // Parse JSON fields
    return games.map((game) => ({
      ...game,
      move_history: game.move_history ? JSON.parse(game.move_history) : [],
    }));
  }

  // Lấy thống kê theo độ khó
  static async getStatsByDifficulty(userId) {
    const stats = await query(
      `SELECT 
        difficulty,
        COUNT(*) as games_count,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        ROUND((SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as win_rate
      FROM games
      WHERE user_id = ? AND opponent_type = 'AI'
      GROUP BY difficulty`,
      [userId]
    );
    return stats;
  }

  // Lấy recent games
  static async getRecentGames(userId, days = 7) {
    const games = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as games_played,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins
      FROM games
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
      [userId, days]
    );
    return games;
  }

  // Lưu phân tích trận đấu
  static async saveAnalysis(gameId, analysisData) {
    const { bestMoves, mistakesCount, accuracyPercentage } = analysisData;

    await query(
      `INSERT INTO game_analysis (game_id, analysis_data, best_moves, mistakes_count, accuracy_percentage)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       analysis_data = VALUES(analysis_data),
       best_moves = VALUES(best_moves),
       mistakes_count = VALUES(mistakes_count),
       accuracy_percentage = VALUES(accuracy_percentage)`,
      [
        gameId,
        JSON.stringify(analysisData),
        JSON.stringify(bestMoves),
        mistakesCount,
        accuracyPercentage,
      ]
    );
  }
}

module.exports = Game;
