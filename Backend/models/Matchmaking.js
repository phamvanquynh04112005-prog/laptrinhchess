// backend/models/Matchmaking.js - FIXED COMPLETE VERSION
const db = require("../config/database");
const Rating = require("./Rating");

const TIME_CONTROLS = {
  bullet: { initial: 60, increment: 0 },
  blitz: { initial: 180, increment: 2 },
  rapid: { initial: 600, increment: 5 },
  classical: { initial: 1800, increment: 10 },
};

const Matchmaking = {
  // Join queue
  async joinQueue(userId, timeControl = "rapid") {
    try {
      console.log(
        `\n📥 JOIN QUEUE - User: ${userId}, Time Control: ${timeControl}`,
      );

      // Remove user from all queues first
      await db.query("DELETE FROM matchmaking_queue WHERE user_id = ?", [
        userId,
      ]);

      // Check if already in an active game
      const activeGames = await db.query(
        `SELECT * FROM online_games 
         WHERE (white_player_id = ? OR black_player_id = ?) 
         AND status = 'ongoing'`,
        [userId, userId],
      );

      if (activeGames.length > 0) {
        return {
          success: false,
          message: "Bạn đang trong một trận đấu",
        };
      }

      // Get user rating for this time control
      const users = await db.query(
        `SELECT 
          CASE 
            WHEN ? = 'bullet' THEN bullet_rating
            WHEN ? = 'blitz' THEN blitz_rating
            WHEN ? = 'rapid' THEN rapid_rating
            WHEN ? = 'classical' THEN classical_rating
            ELSE 1500
          END as rating
         FROM users WHERE id = ?`,
        [timeControl, timeControl, timeControl, timeControl, userId],
      );

      const userRating = users[0]?.rating || 1500;

      // Add to queue
      await db.query(
        "INSERT INTO matchmaking_queue (user_id, time_control, rating, joined_at) VALUES (?, ?, ?, NOW())",
        [userId, timeControl, userRating],
      );

      // Try to find match immediately
      const match = await this.findMatch(userId, timeControl, userRating);

      if (match) {
        return {
          success: true,
          match,
        };
      }

      return {
        success: true,
        message: "Đã vào hàng đợi",
      };
    } catch (error) {
      console.error("Join queue error:", error);
      throw error;
    }
  },

  // Leave queue
  async leaveQueue(userId) {
    try {
      await db.query("DELETE FROM matchmaking_queue WHERE user_id = ?", [
        userId,
      ]);
      return { success: true };
    } catch (error) {
      console.error("Leave queue error:", error);
      throw error;
    }
  },

  // Find match - ✅ FIXED SQL SYNTAX
  async findMatch(userId, timeControl, userRating) {
    try {
      console.log(
        `\n🔍 FINDING MATCH for User: ${userId}, Time Control: ${timeControl}, Rating: ${userRating}`,
      );

      // ✅ FIX: Sử dụng CASE statement thay vì template string trong SQL
      const opponents = await db.query(
        `SELECT mq.user_id, u.username, 
         CASE 
           WHEN ? = 'bullet' THEN u.bullet_rating
           WHEN ? = 'blitz' THEN u.blitz_rating
           WHEN ? = 'rapid' THEN u.rapid_rating
           WHEN ? = 'classical' THEN u.classical_rating
           ELSE 1500
         END as rating
         FROM matchmaking_queue mq
         JOIN users u ON mq.user_id = u.id
         WHERE mq.user_id != ? 
         AND mq.time_control = ?
         ORDER BY mq.joined_at ASC
         LIMIT 1`,
        [
          timeControl,
          timeControl,
          timeControl,
          timeControl,
          userId,
          timeControl,
        ],
      );

      if (opponents.length === 0) {
        console.log(`❌ No opponents found`);
        return null;
      }

      const opponent = opponents[0];
      console.log(
        `✅ Found opponent: ${opponent.username} (ID: ${opponent.user_id}, Rating: ${opponent.rating})`,
      );

      // Check rating difference (max ±300)
      const ratingDiff = Math.abs(userRating - opponent.rating);
      if (ratingDiff > 300) {
        console.log(`❌ Rating difference too large: ${ratingDiff}`);
        return null;
      }

      // Remove both users from queue
      await db.query("DELETE FROM matchmaking_queue WHERE user_id IN (?, ?)", [
        userId,
        opponent.user_id,
      ]);

      // Create game
      const gameId = await this.createGame(
        userId,
        opponent.user_id,
        timeControl,
        userRating,
        opponent.rating,
      );

      return {
        gameId,
        opponentId: opponent.user_id,
        opponentUsername: opponent.username,
        opponentRating: opponent.rating,
        timeControl,
      };
    } catch (error) {
      console.error("Find match error:", error);
      throw error;
    }
  },

  // Try find match (for polling)
  async tryFindMatch(userId, timeControl) {
    try {
      const userInQueue = await db.query(
        "SELECT * FROM matchmaking_queue WHERE user_id = ? AND time_control = ?",
        [userId, timeControl],
      );

      if (userInQueue.length === 0) {
        return null;
      }

      const userData = await db.query(
        `SELECT 
          CASE 
            WHEN ? = 'bullet' THEN bullet_rating
            WHEN ? = 'blitz' THEN blitz_rating
            WHEN ? = 'rapid' THEN rapid_rating
            WHEN ? = 'classical' THEN classical_rating
            ELSE 1500
          END as rating
         FROM users WHERE id = ?`,
        [timeControl, timeControl, timeControl, timeControl, userId],
      );

      const userRating = userData[0]?.rating || 1500;

      return await this.findMatch(userId, timeControl, userRating);
    } catch (error) {
      console.error("Try find match error:", error);
      return null;
    }
  },

  // Get user in queue
  async getUserInQueue(userId) {
    try {
      const result = await db.query(
        "SELECT * FROM matchmaking_queue WHERE user_id = ?",
        [userId],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Get user in queue error:", error);
      return null;
    }
  },

  // Create game with RANDOM COLOR ASSIGNMENT - ✅ FIXED SQL
  async createGame(userId1, userId2, timeControl, rating1, rating2) {
    try {
      console.log(`\n🎮 CREATING GAME: ${userId1} vs ${userId2}`);

      // Random color assignment
      const randomColor = Math.random() < 0.5;
      const whitePlayerId = randomColor ? userId1 : userId2;
      const blackPlayerId = randomColor ? userId2 : userId1;
      const whiteRating = randomColor ? rating1 : rating2;
      const blackRating = randomColor ? rating2 : rating1;

      console.log(
        `🎲 Random assignment: White=${whitePlayerId} (${whiteRating}), Black=${blackPlayerId} (${blackRating})`,
      );

      const timeConfig = TIME_CONTROLS[timeControl];
      const initialTime = timeConfig.initial;

      const result = await db.query(
        `INSERT INTO online_games 
         (white_player_id, black_player_id, time_control, white_time, black_time, 
          current_turn, status, fen_position, move_history, 
          white_rating_before, black_rating_before, started_at)
         VALUES (?, ?, ?, ?, ?, 'white', 'ongoing', 
                 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 
                 '[]', ?, ?, NOW())`,
        [
          whitePlayerId,
          blackPlayerId,
          timeControl,
          initialTime,
          initialTime,
          whiteRating,
          blackRating,
        ],
      );

      console.log(`✅ Game created with ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      console.error("Create game error:", error);
      throw error;
    }
  },

  // Get game - ✅ FIXED SQL
  async getGame(gameId) {
    try {
      const games = await db.query(
        `SELECT 
          g.*,
          w.username as white_username,
          b.username as black_username,
          CASE 
            WHEN g.time_control = 'bullet' THEN w.bullet_rating
            WHEN g.time_control = 'blitz' THEN w.blitz_rating
            WHEN g.time_control = 'rapid' THEN w.rapid_rating
            WHEN g.time_control = 'classical' THEN w.classical_rating
            ELSE 1500
          END as white_rating,
          CASE 
            WHEN g.time_control = 'bullet' THEN b.bullet_rating
            WHEN g.time_control = 'blitz' THEN b.blitz_rating
            WHEN g.time_control = 'rapid' THEN b.rapid_rating
            WHEN g.time_control = 'classical' THEN b.classical_rating
            ELSE 1500
          END as black_rating
         FROM online_games g
         JOIN users w ON g.white_player_id = w.id
         JOIN users b ON g.black_player_id = b.id
         WHERE g.id = ?`,
        [gameId],
      );

      return games.length > 0 ? games[0] : null;
    } catch (error) {
      console.error("Get game error:", error);
      throw error;
    }
  },

  // Thêm method getGameById để tương thích với socketHandler
  async getGameById(gameId) {
    return await this.getGame(gameId);
  },

  // Make move
  async makeMove(gameId, userId, move, newFen, timeRemaining) {
    try {
      const game = await this.getGame(gameId);

      if (!game || game.status !== "ongoing") {
        throw new Error("Game not found or not ongoing");
      }

      const isWhitePlayer = game.white_player_id === userId;
      const currentTurn = game.current_turn;

      if (
        (currentTurn === "white" && !isWhitePlayer) ||
        (currentTurn === "black" && isWhitePlayer)
      ) {
        throw new Error("Not your turn");
      }

      const moveHistory = JSON.parse(game.move_history || "[]");
      moveHistory.push({
        move,
        fen: newFen,
        timestamp: new Date().toISOString(),
        player: isWhitePlayer ? "white" : "black",
        playerId: userId,
      });

      const newTurn = currentTurn === "white" ? "black" : "white";

      if (isWhitePlayer) {
        await db.query(
          "UPDATE online_games SET white_time = ?, current_turn = ?, fen_position = ?, move_history = ? WHERE id = ?",
          [timeRemaining, newTurn, newFen, JSON.stringify(moveHistory), gameId],
        );
      } else {
        await db.query(
          "UPDATE online_games SET black_time = ?, current_turn = ?, fen_position = ?, move_history = ? WHERE id = ?",
          [timeRemaining, newTurn, newFen, JSON.stringify(moveHistory), gameId],
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Make move error:", error);
      throw error;
    }
  },

  // End game
  async endGame(gameId, result, winnerId) {
    try {
      console.log(
        `\n🏁 ENDING GAME: ${gameId}, Result: ${result}, Winner: ${winnerId}`,
      );

      const game = await this.getGame(gameId);

      if (!game) {
        throw new Error("Game not found");
      }

      await db.query(
        `INSERT IGNORE INTO user_stats
         (user_id, bullet_rating, blitz_rating, rapid_rating, classical_rating)
         VALUES (?, 1500, 1500, 1500, 1500)`,
        [game.white_player_id],
      );
      await db.query(
        `INSERT IGNORE INTO user_stats
         (user_id, bullet_rating, blitz_rating, rapid_rating, classical_rating)
         VALUES (?, 1500, 1500, 1500, 1500)`,
        [game.black_player_id],
      );

      // Update game status
      await db.query(
        "UPDATE online_games SET status = 'finished', result = ?, winner_id = ?, finished_at = NOW() WHERE id = ?",
        [result, winnerId, gameId],
      );

      // Calculate rating changes
      let ratingChanges = null;

      if (result !== "draw") {
        const whiteWon = winnerId === game.white_player_id;
        const loserId = whiteWon ? game.black_player_id : game.white_player_id;

        ratingChanges = await Rating.updateRating(
          winnerId,
          loserId,
          game.time_control,
          "win",
          gameId,
        );
      } else {
        const whiteRatingChange = await Rating.updateRating(
          game.white_player_id,
          game.black_player_id,
          game.time_control,
          "draw",
          gameId,
        );
        const blackRatingChange = await Rating.updateRating(
          game.black_player_id,
          game.white_player_id,
          game.time_control,
          "draw",
          gameId,
        );

        ratingChanges = {
          white: whiteRatingChange,
          black: blackRatingChange,
        };
      }

      // Update game with rating changes
      if (result !== "draw") {
        const newWhiteRating = ratingChanges.winner.newRating;
        const newBlackRating = ratingChanges.loser.newRating;

        await db.query(
          "UPDATE online_games SET white_rating_after = ?, black_rating_after = ? WHERE id = ?",
          [
            game.white_player_id === winnerId ? newWhiteRating : newBlackRating,
            game.black_player_id === winnerId ? newWhiteRating : newBlackRating,
            gameId,
          ],
        );
      } else {
        await db.query(
          "UPDATE online_games SET white_rating_after = ?, black_rating_after = ? WHERE id = ?",
          [
            ratingChanges.white.newRating,
            ratingChanges.black.newRating,
            gameId,
          ],
        );
      }

      // Update user stats
      await this.updateUserStats(
        game.white_player_id,
        game.black_player_id,
        result,
        winnerId,
      );

      console.log(`✅ Game ${gameId} ended successfully`);

      return {
        success: true,
        ratingChanges:
          result === "draw"
            ? {
                user:
                  ratingChanges.white.playerId === game.white_player_id
                    ? ratingChanges.white
                    : ratingChanges.black,
                opponent:
                  ratingChanges.white.playerId === game.white_player_id
                    ? ratingChanges.black
                    : ratingChanges.white,
              }
            : ratingChanges,
      };
    } catch (error) {
      console.error("End game error:", error);
      throw error;
    }
  },

  // Update user stats
  async updateUserStats(whitePlayerId, blackPlayerId, result, winnerId) {
    try {
      // Get or create user_stats rows
      const whiteStats = await db.query(
        "SELECT * FROM user_stats WHERE user_id = ?",
        [whitePlayerId],
      );

      const blackStats = await db.query(
        "SELECT * FROM user_stats WHERE user_id = ?",
        [blackPlayerId],
      );

      if (whiteStats.length === 0) {
        await db.query(
          "INSERT INTO user_stats (user_id, bullet_rating, blitz_rating, rapid_rating, classical_rating) VALUES (?, 1500, 1500, 1500, 1500)",
          [whitePlayerId],
        );
      }

      if (blackStats.length === 0) {
        await db.query(
          "INSERT INTO user_stats (user_id, bullet_rating, blitz_rating, rapid_rating, classical_rating) VALUES (?, 1500, 1500, 1500, 1500)",
          [blackPlayerId],
        );
      }

      if (result === "draw") {
        await db.query(
          "UPDATE user_stats SET total_games = total_games + 1, draws = draws + 1 WHERE user_id = ?",
          [whitePlayerId],
        );
        await db.query(
          "UPDATE user_stats SET total_games = total_games + 1, draws = draws + 1 WHERE user_id = ?",
          [blackPlayerId],
        );
      } else {
        const loserId =
          winnerId === whitePlayerId ? blackPlayerId : whitePlayerId;

        await db.query(
          "UPDATE user_stats SET total_games = total_games + 1, wins = wins + 1 WHERE user_id = ?",
          [winnerId],
        );

        await db.query(
          "UPDATE user_stats SET total_games = total_games + 1, losses = losses + 1 WHERE user_id = ?",
          [loserId],
        );
      }
    } catch (error) {
      console.error("Update user stats error:", error);
    }
  },

  // Get active games for a user
  async getActiveGames(userId) {
    try {
      const games = await db.query(
        `SELECT 
          g.*,
          w.username as white_username,
          b.username as black_username
         FROM online_games g
         JOIN users w ON g.white_player_id = w.id
         JOIN users b ON g.black_player_id = b.id
         WHERE (g.white_player_id = ? OR g.black_player_id = ?) 
         AND g.status = 'ongoing'
         ORDER BY g.started_at DESC`,
        [userId, userId],
      );

      return games;
    } catch (error) {
      console.error("Get active games error:", error);
      throw error;
    }
  },

  // Get queue status
  async getQueueStatus(timeControl) {
    try {
      const result = await db.query(
        "SELECT COUNT(*) as count FROM matchmaking_queue WHERE time_control = ?",
        [timeControl],
      );

      return {
        count: result[0].count,
        timeControl,
      };
    } catch (error) {
      console.error("Get queue status error:", error);
      throw error;
    }
  },
};

module.exports = Matchmaking;
