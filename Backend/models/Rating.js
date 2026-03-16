// backend/models/Rating.js - UPDATED WITH DRAW SUPPORT
const db = require("../config/database");

const Rating = {
  // Calculate K-factor based on rating and games played
  getKFactor(rating, gamesPlayed) {
    if (gamesPlayed < 30) return 40; // New players
    if (rating < 2100) return 32; // Average players
    if (rating < 2400) return 24; // Strong players
    return 16; // Masters
  },

  // Calculate expected score
  calculateExpectedScore(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  },

  // Update rating after a game (supports win, loss, and draw)
  async updateRating(playerId, opponentId, timeControl, result, gameId = null) {
    try {
      console.log(`\n📊 UPDATING RATING:`);
      console.log(`   Player: ${playerId}, Opponent: ${opponentId}`);
      console.log(`   Time Control: ${timeControl}, Result: ${result}`);

      // Get current ratings
      const players = await db.query(
        `SELECT id, ${timeControl}_rating as rating
         FROM users WHERE id IN (?, ?)`,
        [playerId, opponentId],
      );

      const player = players.find((p) => p.id === playerId);
      const opponent = players.find((p) => p.id === opponentId);

      if (!player || !opponent) {
        throw new Error("Player not found");
      }

      const playerRating = player.rating || 1500;
      const opponentRating = opponent.rating || 1500;

      // Get games played for K-factor
      const playerStats = await db.query(
        "SELECT total_games FROM user_stats WHERE user_id = ?",
        [playerId],
      );
      const gamesPlayed = playerStats[0]?.total_games || 0;

      // Calculate K-factor
      const kFactor = this.getKFactor(playerRating, gamesPlayed);

      // Calculate expected score
      const expectedScore = this.calculateExpectedScore(
        playerRating,
        opponentRating,
      );

      // Determine actual score based on result
      let actualScore;
      if (result === "win") {
        actualScore = 1.0;
      } else if (result === "loss") {
        actualScore = 0.0;
      } else if (result === "draw") {
        actualScore = 0.5; // 🆕 Draw gives 0.5 points
      }

      // Calculate rating change
      const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
      const newRating = Math.max(100, playerRating + ratingChange); // Minimum rating 100

      console.log(`   Old Rating: ${playerRating}`);
      console.log(`   Expected Score: ${expectedScore.toFixed(3)}`);
      console.log(`   Actual Score: ${actualScore}`);
      console.log(`   K-Factor: ${kFactor}`);
      console.log(
        `   Rating Change: ${ratingChange > 0 ? "+" : ""}${ratingChange}`,
      );
      console.log(`   New Rating: ${newRating}`);

      // Update user rating
      await db.query(
        `UPDATE users SET ${timeControl}_rating = ? WHERE id = ?`,
        [newRating, playerId],
      );
      await db.query(
        `UPDATE user_stats SET ${timeControl}_rating = ? WHERE user_id = ?`,
        [newRating, playerId],
      );

      // Save to rating history
      await db.query(
        `INSERT INTO rating_history 
         (user_id, game_id, time_control, rating_before, rating_after, rating_change, opponent_id, opponent_rating, game_result, game_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', NOW())`,
        [
          playerId,
          gameId,
          timeControl,
          playerRating,
          newRating,
          ratingChange,
          opponentId,
          opponentRating,
          result,
        ],
      );

      console.log(`✅ Rating updated successfully for player ${playerId}`);

      // 🆕 For draws, return both player's rating info
      if (result === "draw") {
        return {
          playerId,
          oldRating: playerRating,
          newRating,
          change: ratingChange,
        };
      }

      // For wins/losses, return winner/loser info
      if (result === "win") {
        // Also update loser's rating
        const opponentStats = await db.query(
          "SELECT total_games FROM user_stats WHERE user_id = ?",
          [opponentId],
        );
        const opponentGamesPlayed = opponentStats[0]?.total_games || 0;
        const opponentKFactor = this.getKFactor(
          opponentRating,
          opponentGamesPlayed,
        );
        const opponentExpectedScore = this.calculateExpectedScore(
          opponentRating,
          playerRating,
        );
        const opponentRatingChange = Math.round(
          opponentKFactor * (0.0 - opponentExpectedScore),
        );
        const opponentNewRating = Math.max(
          100,
          opponentRating + opponentRatingChange,
        );

        await db.query(
          `UPDATE users SET ${timeControl}_rating = ? WHERE id = ?`,
          [opponentNewRating, opponentId],
        );
        await db.query(
          `UPDATE user_stats SET ${timeControl}_rating = ? WHERE user_id = ?`,
          [opponentNewRating, opponentId],
        );
        await db.query(
          `INSERT INTO rating_history 
           (user_id, game_id, time_control, rating_before, rating_after, rating_change, opponent_id, opponent_rating, game_result, game_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'loss', 'online', NOW())`,
          [
            opponentId,
            gameId,
            timeControl,
            opponentRating,
            opponentNewRating,
            opponentRatingChange,
            playerId,
            playerRating,
          ],
        );

        return {
          winner: {
            playerId,
            oldRating: playerRating,
            newRating,
            change: ratingChange,
          },
          loser: {
            playerId: opponentId,
            oldRating: opponentRating,
            newRating: opponentNewRating,
            change: opponentRatingChange,
          },
        };
      }
    } catch (error) {
      console.error("Update rating error:", error);
      throw error;
    }
  },

  // Get user stats row (user_stats)
  async getUserStats(userId) {
    try {
      const rows = await db.query(
        "SELECT * FROM user_stats WHERE user_id = ?",
        [userId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Get user stats error:", error);
      throw error;
    }
  },

  // Get rating history for a user
  async getRatingHistory(userId, timeControl, limit = 20) {
    try {
      const history = await db.query(
        `SELECT 
          rh.*,
          u.username as opponent_username
         FROM rating_history rh
         LEFT JOIN users u ON rh.opponent_id = u.id
         WHERE rh.user_id = ? AND rh.time_control = ?
         ORDER BY rh.created_at DESC
         LIMIT ?`,
        [userId, timeControl, limit],
      );

      return history;
    } catch (error) {
      console.error("Get rating history error:", error);
      throw error;
    }
  },

  // Get leaderboard
  async getLeaderboard(timeControl = "rapid", limit = 100) {
    try {
      const leaderboard = await db.query(
        `SELECT 
          u.id,
          u.username,
          u.${timeControl}_rating as rating,
          us.total_games,
          us.wins,
          us.losses,
          us.draws
         FROM users u
         LEFT JOIN user_stats us ON u.id = us.user_id
         WHERE u.${timeControl}_rating IS NOT NULL
         ORDER BY u.${timeControl}_rating DESC
         LIMIT ?`,
        [limit],
      );

      return leaderboard;
    } catch (error) {
      console.error("Get leaderboard error:", error);
      throw error;
    }
  },
};

module.exports = Rating;
