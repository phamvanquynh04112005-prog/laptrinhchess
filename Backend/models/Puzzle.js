// models/Puzzle.js - FIXED VERSION
const { query } = require("../config/database");

class Puzzle {
  // Lấy puzzle ngẫu nhiên theo độ khó
  static async getRandomByDifficulty(difficulty, userId = null) {
    let sql = `
      SELECT p.* 
      FROM puzzles p
      WHERE p.difficulty = ?
    `;

    if (userId) {
      sql += `
        AND p.id NOT IN (
          SELECT puzzle_id 
          FROM puzzle_attempts 
          WHERE user_id = ? AND solved = 1 
          AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        )
      `;
    }

    sql += ` ORDER BY RAND() LIMIT 1`;

    const params = userId ? [difficulty, userId] : [difficulty];
    const puzzles = await query(sql, params);

    if (puzzles[0]) {
      puzzles[0].solution_moves = puzzles[0].solution_moves;
      puzzles[0].themes = puzzles[0].themes || "";
    }

    return puzzles[0] || null;
  }

  // NEW: Daily puzzle based on day
  static async getDailyPuzzle(dayOfYear, userId = null) {
    try {
      // Get total puzzles count
      const countResult = await query("SELECT COUNT(*) as total FROM puzzles");
      const totalPuzzles = countResult[0].total;

      if (totalPuzzles === 0) return null;

      // Use modulo to cycle through puzzles
      const puzzleIndex = dayOfYear % totalPuzzles;

      const puzzles = await query(
        `SELECT * FROM puzzles 
         ORDER BY id 
         LIMIT 1 OFFSET ?`,
        [puzzleIndex],
      );

      if (puzzles[0]) {
        puzzles[0].solution_moves = puzzles[0].solution_moves;
        puzzles[0].themes = puzzles[0].themes || "";
      }

      return puzzles[0] || null;
    } catch (error) {
      console.error("Get daily puzzle error:", error);
      return null;
    }
  }

  // Lấy puzzle theo rating người dùng
  static async getByUserRating(userId) {
    const user = await query("SELECT puzzle_rating FROM users WHERE id = ?", [
      userId,
    ]);

    if (!user[0]) return null;

    const rating = user[0].puzzle_rating;
    const minRating = rating - 200;
    const maxRating = rating + 200;

    const puzzles = await query(
      `SELECT p.* 
       FROM puzzles p
       WHERE p.rating BETWEEN ? AND ?
       AND p.id NOT IN (
         SELECT puzzle_id 
         FROM puzzle_attempts 
         WHERE user_id = ? AND solved = 1 
         AND created_at > DATE_SUB(NOW(), INTERVAL 3 DAY)
       )
       ORDER BY RAND() LIMIT 1`,
      [minRating, maxRating, userId],
    );

    if (puzzles[0]) {
      puzzles[0].solution_moves = puzzles[0].solution_moves;
      puzzles[0].themes = puzzles[0].themes || "";
    }

    return puzzles[0] || null;
  }

  // Lưu kết quả làm puzzle
  static async saveAttempt(userId, puzzleId, solved, timeSpent) {
    const existing = await query(
      "SELECT * FROM puzzle_attempts WHERE user_id = ? AND puzzle_id = ?",
      [userId, puzzleId],
    );

    if (existing[0]) {
      await query(
        `UPDATE puzzle_attempts 
         SET attempts = attempts + 1, 
             solved = ?, 
             time_spent = time_spent + ?,
             created_at = NOW()
         WHERE user_id = ? AND puzzle_id = ?`,
        [solved ? 1 : 0, timeSpent, userId, puzzleId],
      );
    } else {
      await query(
        `INSERT INTO puzzle_attempts (user_id, puzzle_id, solved, time_spent) 
         VALUES (?, ?, ?, ?)`,
        [userId, puzzleId, solved ? 1 : 0, timeSpent],
      );
    }

    // Cập nhật rating người dùng nếu giải đúng
    if (solved) {
      await query(
        `UPDATE users 
         SET puzzles_solved = puzzles_solved + 1,
             puzzle_rating = LEAST(puzzle_rating + 10, 3000)
         WHERE id = ?`,
        [userId],
      );
    }
  }

  // Thống kê puzzle của user
  static async getUserStats(userId) {
    const stats = await query(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved_count,
        AVG(time_spent) as avg_time,
        (SELECT puzzle_rating FROM users WHERE id = ?) as current_rating
       FROM puzzle_attempts
       WHERE user_id = ?`,
      [userId, userId],
    );

    return (
      stats[0] || {
        total_attempts: 0,
        solved_count: 0,
        avg_time: 0,
        current_rating: 1200,
      }
    );
  }

  // Tạo puzzle mới (Admin)
  static async create(puzzleData) {
    const {
      fenPosition,
      solutionMoves,
      difficulty,
      rating,
      themes,
      description,
    } = puzzleData;

    const result = await query(
      `INSERT INTO puzzles (fen_position, solution_moves, difficulty, rating, themes, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fenPosition,
        JSON.stringify(solutionMoves),
        difficulty,
        rating || 1200,
        themes || "",
        description,
      ],
    );

    return result.insertId;
  }

  // Lấy danh sách puzzle theo theme
  static async getByTheme(theme, limit = 10) {
    const puzzles = await query(
      `SELECT * FROM puzzles 
       WHERE themes LIKE ?
       ORDER BY rating DESC
       LIMIT ?`,
      [`%${theme}%`, limit],
    );

    return puzzles.map((p) => ({
      ...p,
      solution_moves: p.solution_moves,
      themes: p.themes || "",
    }));
  }
}

module.exports = Puzzle;
