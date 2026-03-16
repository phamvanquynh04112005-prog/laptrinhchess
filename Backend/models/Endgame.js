const { query } = require("../config/database");

class Endgame {
  // Lấy tàn cuộc theo category
  static async getByCategory(category) {
    const endgames = await query(
      `SELECT * FROM endgames 
       WHERE category = ?
       ORDER BY difficulty ASC`,
      [category],
    );

    return endgames.map((e) => ({
      ...e,
      solution: e.solution ? JSON.parse(e.solution) : [],
    }));
  }

  // Lấy tàn cuộc theo độ khó
  static async getByDifficulty(difficulty) {
    const endgames = await query(
      `SELECT * FROM endgames 
       WHERE difficulty = ?
       ORDER BY RAND()
       LIMIT 10`,
      [difficulty],
    );

    return endgames.map((e) => ({
      ...e,
      solution: e.solution ? JSON.parse(e.solution) : [],
    }));
  }

  // Lấy tất cả categories
  static async getCategories() {
    const categories = await query(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM endgames
       GROUP BY category
       ORDER BY count DESC`,
    );

    return categories;
  }

  // Lấy endgame ngẫu nhiên chưa master
  static async getNextForUser(userId) {
    const endgames = await query(
      `SELECT e.* 
       FROM endgames e
       LEFT JOIN endgame_progress ep ON e.id = ep.endgame_id AND ep.user_id = ?
       WHERE ep.mastered IS NULL OR ep.mastered = 0
       ORDER BY RAND()
       LIMIT 1`,
      [userId],
    );

    if (endgames[0]) {
      endgames[0].solution = JSON.parse(endgames[0].solution || "[]");
    }

    return endgames[0] || null;
  }

  // Lưu tiến độ
  static async saveProgress(userId, endgameId, success) {
    const existing = await query(
      "SELECT * FROM endgame_progress WHERE user_id = ? AND endgame_id = ?",
      [userId, endgameId],
    );

    if (existing[0]) {
      const newSuccesses = existing[0].successes + (success ? 1 : 0);
      const newAttempts = existing[0].attempts + 1;
      const mastered = newSuccesses >= 3 && newSuccesses / newAttempts >= 0.75;

      await query(
        `UPDATE endgame_progress 
         SET attempts = attempts + 1,
             successes = successes + ?,
             mastered = ?,
             last_attempt = NOW()
         WHERE user_id = ? AND endgame_id = ?`,
        [success ? 1 : 0, mastered ? 1 : 0, userId, endgameId],
      );
    } else {
      await query(
        `INSERT INTO endgame_progress (user_id, endgame_id, attempts, successes, mastered)
         VALUES (?, ?, 1, ?, 0)`,
        [userId, endgameId, success ? 1 : 0],
      );
    }
  }

  // Thống kê tiến độ user
  static async getUserProgress(userId) {
    const stats = await query(
      `SELECT 
        COUNT(DISTINCT ep.endgame_id) as total_practiced,
        SUM(CASE WHEN ep.mastered = 1 THEN 1 ELSE 0 END) as mastered_count,
        (SELECT COUNT(*) FROM endgames) as total_endgames,
        AVG(ep.successes / NULLIF(ep.attempts, 0) * 100) as avg_success_rate
       FROM endgame_progress ep
       WHERE ep.user_id = ?`,
      [userId],
    );

    const byCategory = await query(
      `SELECT 
        e.category,
        COUNT(*) as total,
        SUM(CASE WHEN ep.mastered = 1 THEN 1 ELSE 0 END) as mastered
       FROM endgame_progress ep
       JOIN endgames e ON ep.endgame_id = e.id
       WHERE ep.user_id = ?
       GROUP BY e.category`,
      [userId],
    );

    return {
      overall: stats[0] || {
        total_practiced: 0,
        mastered_count: 0,
        total_endgames: 0,
        avg_success_rate: 0,
      },
      by_category: byCategory,
    };
  }

  // Tạo endgame mới (Admin)
  static async create(endgameData) {
    const { name, category, fenPosition, solution, difficulty, description } =
      endgameData;

    const result = await query(
      `INSERT INTO endgames (name, category, fen_position, solution, difficulty, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        fenPosition,
        JSON.stringify(solution),
        difficulty,
        description,
      ],
    );

    return result.insertId;
  }
}

module.exports = Endgame;
