const { query } = require("../config/database");

class Opening {
  // Lấy tất cả khai cuộc
  static async getAll() {
    const openings = await query(
      `SELECT * FROM openings ORDER BY popularity DESC`,
    );

    return openings.map((o) => ({
      ...o,
      moves: o.moves ? o.moves.split(",") : [],
    }));
  }

  // Lấy khai cuộc theo ECO code
  static async getByECO(ecoCode) {
    const openings = await query("SELECT * FROM openings WHERE eco_code = ?", [
      ecoCode,
    ]);

    if (openings[0]) {
      openings[0].moves = openings[0].moves ? openings[0].moves.split(",") : [];
    }

    return openings[0] || null;
  }

  // Tìm kiếm khai cuộc theo tên
  static async searchByName(searchTerm) {
    const openings = await query(
      `SELECT * FROM openings 
       WHERE name LIKE ? 
       ORDER BY popularity DESC
       LIMIT 20`,
      [`%${searchTerm}%`],
    );

    return openings.map((o) => ({
      ...o,
      moves: o.moves ? o.moves.split(",") : [],
    }));
  }

  // Lấy khai cuộc phổ biến nhất
  static async getPopular(limit = 10) {
    const openings = await query(
      `SELECT * FROM openings 
       ORDER BY popularity DESC 
       LIMIT ?`,
      [limit],
    );

    return openings.map((o) => ({
      ...o,
      moves: o.moves ? o.moves.split(",") : [],
    }));
  }

  // Phân tích khai cuộc của user
  static async getUserOpeningStats(userId) {
    const stats = await query(
      `SELECT 
        o.name,
        o.eco_code,
        uo.times_played,
        uo.win_count,
        uo.loss_count,
        uo.draw_count,
        ROUND((uo.win_count / NULLIF(uo.times_played, 0)) * 100, 2) as win_rate
       FROM user_openings uo
       JOIN openings o ON uo.opening_id = o.id
       WHERE uo.user_id = ?
       ORDER BY uo.times_played DESC
       LIMIT 10`,
      [userId],
    );

    return stats;
  }

  // Cập nhật thống kê khai cuộc user
  static async updateUserOpening(userId, openingId, result) {
    const existing = await query(
      "SELECT * FROM user_openings WHERE user_id = ? AND opening_id = ?",
      [userId, openingId],
    );

    if (existing[0]) {
      let updateField = "";
      if (result === "win") updateField = "win_count = win_count + 1";
      else if (result === "loss") updateField = "loss_count = loss_count + 1";
      else updateField = "draw_count = draw_count + 1";

      await query(
        `UPDATE user_openings 
         SET times_played = times_played + 1,
             ${updateField},
             last_played = NOW()
         WHERE user_id = ? AND opening_id = ?`,
        [userId, openingId],
      );
    } else {
      const winCount = result === "win" ? 1 : 0;
      const lossCount = result === "loss" ? 1 : 0;
      const drawCount = result === "draw" ? 1 : 0;

      await query(
        `INSERT INTO user_openings (user_id, opening_id, times_played, win_count, loss_count, draw_count)
         VALUES (?, ?, 1, ?, ?, ?)`,
        [userId, openingId, winCount, lossCount, drawCount],
      );
    }
  }

  // Gợi ý khai cuộc dựa trên phong cách chơi
  static async getRecommendations(userId) {
    // Lấy thống kê user
    const userStats = await query(
      `SELECT 
        AVG(moves_count) as avg_moves,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        COUNT(*) as total
       FROM games
       WHERE user_id = ?`,
      [userId],
    );

    const stats = userStats[0];

    // Nếu user thích ván nhanh -> gợi ý aggressive openings
    // Nếu user thích ván dài -> gợi ý positional openings
    const isAggressive = stats.avg_moves < 40;

    const recommendations = await query(
      `SELECT * FROM openings 
       WHERE ${isAggressive ? "win_rate_white > 52" : "draw_rate < 30"}
       ORDER BY popularity DESC
       LIMIT 5`,
    );

    return recommendations.map((o) => ({
      ...o,
      moves: o.moves ? o.moves.split(",") : [],
      reason: isAggressive
        ? "Phù hợp với lối chơi tấn công"
        : "Phù hợp với lối chơi chiến lược",
    }));
  }

  // Tạo khai cuộc mới (Admin)
  static async create(openingData) {
    const {
      name,
      ecoCode,
      moves,
      fenPosition,
      winRateWhite,
      winRateBlack,
      drawRate,
      description,
    } = openingData;

    const result = await query(
      `INSERT INTO openings (name, eco_code, moves, fen_position, win_rate_white, win_rate_black, draw_rate, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        ecoCode,
        Array.isArray(moves) ? moves.join(",") : moves,
        fenPosition,
        winRateWhite || 0,
        winRateBlack || 0,
        drawRate || 0,
        description,
      ],
    );

    return result.insertId;
  }
}

module.exports = Opening;
