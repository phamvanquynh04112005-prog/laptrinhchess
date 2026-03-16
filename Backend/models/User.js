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
      "SELECT id, username, email, rating, games_played, games_won, avatar, country, last_seen, created_at FROM users WHERE id = ?",
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

    if (data.username !== undefined) {
      updates.push("username = ?");
      values.push(data.username);
    }
    if (data.email !== undefined) {
      updates.push("email = ?");
      values.push(data.email);
    }
    if (data.password !== undefined) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }
    if (data.avatar !== undefined) {
      updates.push("avatar = ?");
      values.push(data.avatar);
    }
    if (data.country !== undefined) {
      updates.push("country = ?");
      values.push(data.country);
    }

    if (updates.length === 0) return false;

    values.push(userId);
    await query(`UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, values);
    return true;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await query("SELECT password FROM users WHERE id = ?", [userId]);
    if (!user[0]) return { success: false, message: "User not found" };
    const valid = await bcrypt.compare(currentPassword, user[0].password);
    if (!valid) return { success: false, message: "Mật khẩu hiện tại không đúng" };
    const hashed = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [hashed, userId]);
    return { success: true };
  }

  static async updateLastSeen(userId) {
    await query("UPDATE users SET last_seen = NOW() WHERE id = ?", [userId]);
  }

  // Lấy thông tin profile chi tiết (kèm user_stats, status)
  static async getProfile(userId) {
    const users = await query(
      `SELECT 
        u.id, u.username, u.email, u.rating, u.games_played, u.games_won,
        u.avatar, u.country, u.last_seen, u.created_at,
        ROUND((u.games_won / NULLIF(u.games_played, 0)) * 100, 2) as win_rate,
        us.bullet_rating, us.blitz_rating, us.rapid_rating, us.classical_rating,
        us.bullet_games, us.blitz_games, us.rapid_games, us.classical_games,
        us.peak_rating, us.current_streak, us.best_streak
      FROM users u 
      LEFT JOIN user_stats us ON u.id = us.user_id
      WHERE u.id = ?`,
      [userId]
    );
    const u = users[0];
    if (!u) return null;
    const [playing] = await query(
      "SELECT 1 FROM online_games WHERE (white_player_id = ? OR black_player_id = ?) AND status = 'ongoing' LIMIT 1",
      [userId, userId]
    );
    if (playing) {
      u.status = "playing";
    } else {
      const lastSeen = u.last_seen ? new Date(u.last_seen).getTime() : 0;
      const now = Date.now();
      const fiveMin = 5 * 60 * 1000;
      u.status = lastSeen && now - lastSeen < fiveMin ? "online" : "offline";
    }
    return u;
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
