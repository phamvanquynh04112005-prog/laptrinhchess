const { query } = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    return users[0] || null;
  }

  static async findByUsername(username) {
    const users = await query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return users[0] || null;
  }

  static async findById(id) {
    const users = await query(
      "SELECT id, username, email, rating, games_played, games_won, created_at FROM users WHERE id = ?",
      [id]
    );
    return users[0] || null;
  }

  static async updateStats(userId, won) {
    await query(
      "UPDATE users SET games_played = games_played + 1, games_won = games_won + ?, rating = rating + ? WHERE id = ?",
      [won ? 1 : 0, won ? 10 : -5, userId]
    );
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateProfile(userId, data) {
    const updates = [];
    const values = [];

    if (data.username) {
      updates.push("username = ?");
      values.push(data.username);
    }

    if (data.email) {
      updates.push("email = ?");
      values.push(data.email);
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push("updated_at = NOW()");
    values.push(userId);

    const queryStr = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await query(queryStr, values);
    return true;
  }

  // Lấy thông tin profile chi tiết
  static async getProfile(userId) {
    const users = await query(
      `SELECT 
        u.id, u.username, u.email, u.rating, u.games_played, u.games_won,
        u.created_at,
        ROUND((u.games_won / NULLIF(u.games_played, 0)) * 100, 2) as win_rate
      FROM users u 
      WHERE u.id = ?`,
      [userId]
    );
    return users[0] || null;
  }

  // Lấy leaderboard
  static async getLeaderboard(limit = 10) {
    const users = await query(
      `SELECT 
        id, username, rating, games_played, games_won,
        ROUND((games_won / NULLIF(games_played, 0)) * 100, 2) as win_rate
      FROM users 
      WHERE games_played > 0
      ORDER BY rating DESC 
      LIMIT ?`,
      [limit]
    );
    return users;
  }
}

module.exports = User;
