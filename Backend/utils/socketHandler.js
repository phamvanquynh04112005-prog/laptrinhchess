// backend/utils/socketHandler.js - FIXED DB QUERY ISSUE
const Matchmaking = require("../models/Matchmaking");
const db = require("../config/database");

const setupSocketHandlers = (io) => {
  console.log("🔧 Setting up Socket.IO handlers...");

  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`🔗 New connection: ${socket.id}`);

    socket.on("authenticate", (userId) => {
      if (!userId) {
        socket.emit("authentication-error", { message: "Invalid user ID" });
        return;
      }

      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`🔐 User ${userId} authenticated with socket ${socket.id}`);

      socket.emit("authenticated", { success: true, userId });
    });

    socket.on("join-queue", async ({ userId, timeControl, rating }) => {
      try {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`📥 JOIN-QUEUE REQUEST`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Time Control: ${timeControl}`);
        console.log(`   Rating: ${rating}`);
        console.log(`${"=".repeat(60)}`);

        // Step 1: Remove user from all queues first
        try {
          await db.query("DELETE FROM matchmaking_queue WHERE user_id = ?", [
            userId,
          ]);
          console.log(`   ✅ Removed user from queues`);
        } catch (err) {
          console.log(`   ⚠️  Delete query warning:`, err.message);
        }

        // Step 2: Check if already in active game
        let activeGames;
        try {
          activeGames = await db.query(
            `SELECT * FROM online_games 
             WHERE (white_player_id = ? OR black_player_id = ?) 
             AND status = 'ongoing'`,
            [userId, userId],
          );
        } catch (err) {
          console.error(`   ❌ Active games check error:`, err);
          activeGames = [];
        }

        if (activeGames && activeGames.length > 0) {
          console.log(`   ❌ User already in active game`);
          socket.emit("queue-error", {
            success: false,
            message: "Bạn đang trong một trận đấu",
          });
          return;
        }

        // Step 3: Try to find opponent BEFORE adding to queue
        console.log(`\n   🔍 SEARCHING FOR OPPONENT...`);
        let existingOpponents;
        try {
          existingOpponents = await db.query(
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
        } catch (err) {
          console.error(`   ❌ Opponent search error:`, err);
          existingOpponents = [];
        }

        if (existingOpponents && existingOpponents.length > 0) {
          // Found an opponent! Create match immediately
          const opponent = existingOpponents[0];
          const ratingDiff = Math.abs(rating - opponent.rating);

          console.log(`   ✨ FOUND OPPONENT IN QUEUE!`);
          console.log(
            `      Opponent: ${opponent.username} (ID: ${opponent.user_id})`,
          );
          console.log(`      Opponent Rating: ${opponent.rating}`);
          console.log(`      Rating Diff: ${ratingDiff}`);

          if (ratingDiff <= 300) {
            console.log(
              `   ✅ Rating difference acceptable (${ratingDiff} <= 300)`,
            );
            console.log(`   🎮 CREATING MATCH...`);

            // Remove opponent from queue
            try {
              await db.query(
                "DELETE FROM matchmaking_queue WHERE user_id = ?",
                [opponent.user_id],
              );
              console.log(`   ✅ Removed opponent from queue`);
            } catch (err) {
              console.log(`   ⚠️  Opponent removal warning:`, err.message);
            }

            // Create game with random color assignment
            const randomColor = Math.random() < 0.5;
            const whitePlayerId = randomColor ? userId : opponent.user_id;
            const blackPlayerId = randomColor ? opponent.user_id : userId;
            const whiteRating = randomColor ? rating : opponent.rating;
            const blackRating = randomColor ? opponent.rating : rating;

            console.log(`   🎲 COLOR ASSIGNMENT (Random: ${randomColor}):`);
            console.log(
              `      White: User ${whitePlayerId} (Rating: ${whiteRating})`,
            );
            console.log(
              `      Black: User ${blackPlayerId} (Rating: ${blackRating})`,
            );

            // Time config - Only rapid (10 min)
            const timeConfig = { initial: 600, increment: 5 };

            let gameId;
            try {
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
                  timeConfig.initial,
                  timeConfig.initial,
                  whiteRating,
                  blackRating,
                ],
              );

              // Handle different return formats
              if (result && result.insertId) {
                gameId = result.insertId;
              } else if (
                Array.isArray(result) &&
                result[0] &&
                result[0].insertId
              ) {
                gameId = result[0].insertId;
              } else {
                throw new Error("Could not get game ID from insert");
              }

              console.log(`   ✅ Game created with ID: ${gameId}`);
            } catch (err) {
              console.error(`   ❌ Game creation error:`, err);
              socket.emit("queue-error", {
                success: false,
                message: "Lỗi tạo game",
              });
              return;
            }

            // Get usernames
            const playerUsername = await getUserUsername(userId);
            const opponentUsername = opponent.username;

            console.log(`\n   📤 NOTIFYING PLAYERS...`);

            // Notify opponent
            const opponentSocketId = connectedUsers.get(opponent.user_id);
            if (opponentSocketId) {
              io.to(opponentSocketId).emit("match-found", {
                gameId: gameId,
                opponent: {
                  id: userId,
                  username: playerUsername,
                  rating: rating,
                },
                color: whitePlayerId === opponent.user_id ? "white" : "black",
                timeControl: timeControl,
              });
              console.log(`      ✅ Notified opponent (${opponent.user_id})`);
            } else {
              console.log(`      ⚠️  Opponent socket not found`);
            }

            // Notify current player
            const playerSocketId = connectedUsers.get(userId);
            if (playerSocketId) {
              io.to(playerSocketId).emit("match-found", {
                gameId: gameId,
                opponent: {
                  id: opponent.user_id,
                  username: opponentUsername,
                  rating: opponent.rating,
                },
                color: whitePlayerId === userId ? "white" : "black",
                timeControl: timeControl,
              });
              console.log(`      ✅ Notified player (${userId})`);
            } else {
              console.log(`      ⚠️  Player socket not found`);
            }

            console.log(`\n   🎉 MATCH COMPLETED SUCCESSFULLY!`);
            console.log(`${"=".repeat(60)}\n`);
            return; // Don't add to queue, match is complete
          } else {
            console.log(
              `   ❌ Rating difference too large (${ratingDiff} > 300)`,
            );
            console.log(`   ℹ️  Will add to queue and wait for better match`);
          }
        } else {
          console.log(`   ℹ️  No opponents found in queue yet`);
        }

        // Step 4: No match found, add to queue
        console.log(`\n   ➕ ADDING USER TO QUEUE...`);
        try {
          await db.query(
            "INSERT INTO matchmaking_queue (user_id, time_control, rating, joined_at) VALUES (?, ?, ?, NOW())",
            [userId, timeControl, rating],
          );
          console.log(`   ✅ User added to queue`);
        } catch (err) {
          console.error(`   ❌ Add to queue error:`, err);
          socket.emit("queue-error", {
            success: false,
            message: "Lỗi khi vào hàng đợi",
          });
          return;
        }

        // Step 5: Get current queue size
        let queueSize = 1; // Default
        try {
          const queueResult = await db.query(
            "SELECT COUNT(*) as count FROM matchmaking_queue WHERE time_control = ?",
            [timeControl],
          );

          if (queueResult && queueResult.length > 0) {
            queueSize = queueResult[0].count || 1;
          } else if (
            Array.isArray(queueResult) &&
            queueResult[0] &&
            queueResult[0][0]
          ) {
            queueSize = queueResult[0][0].count || 1;
          }

          console.log(`   📊 Current queue size: ${queueSize}`);
        } catch (err) {
          console.log(`   ⚠️  Queue size check warning:`, err.message);
        }

        // Step 6: Send response to client
        socket.emit("queue-joined", {
          success: true,
          message: "Đã vào hàng đợi",
          queueSize: queueSize,
        });
        console.log(`   ✅ Sent queue-joined event (queueSize: ${queueSize})`);
        console.log(`${"=".repeat(60)}\n`);
      } catch (error) {
        console.error("\n❌ JOIN-QUEUE ERROR:", error);
        console.error("Stack:", error.stack);
        socket.emit("queue-error", {
          success: false,
          message: error.message || "Lỗi khi vào hàng đợi",
        });
      }
    });

    socket.on("leave-queue", async ({ userId }) => {
      try {
        console.log(`\n👋 LEAVE-QUEUE: User ${userId}`);
        await db.query("DELETE FROM matchmaking_queue WHERE user_id = ?", [
          userId,
        ]);
        console.log(`   ✅ Removed from queue`);
        socket.emit("queue-left", { success: true });
      } catch (error) {
        console.error("❌ Leave queue error:", error);
      }
    });

    socket.on(
      "make-move",
      async ({ gameId, userId, move, newFen, timeRemaining }) => {
        try {
          console.log(`\n🎮 MAKE-MOVE: Game ${gameId}, User ${userId}`);

          const game = await Matchmaking.getGame(gameId);

          if (!game) {
            socket.emit("move-error", { message: "Game not found" });
            return;
          }

          const opponentId =
            game.white_player_id === userId
              ? game.black_player_id
              : game.white_player_id;

          await Matchmaking.makeMove(
            gameId,
            userId,
            move,
            newFen,
            timeRemaining,
          );

          const opponentSocketId = connectedUsers.get(opponentId);
          if (opponentSocketId) {
            io.to(opponentSocketId).emit("opponent-move", {
              gameId,
              move,
              newFen,
              timeRemaining,
            });
          }

          socket.emit("move-success", { success: true });
        } catch (error) {
          console.error("❌ Make move error:", error);
          socket.emit("move-error", { message: error.message });
        }
      },
    );

    socket.on("offer-draw", async ({ gameId, userId }) => {
      try {
        const game = await Matchmaking.getGame(gameId);
        if (!game) return;

        const opponentId =
          game.white_player_id === userId
            ? game.black_player_id
            : game.white_player_id;

        const opponentSocketId = connectedUsers.get(opponentId);
        if (opponentSocketId) {
          io.to(opponentSocketId).emit("draw-offered", { offeredBy: userId });
        }

        socket.emit("draw-offer-sent");
      } catch (error) {
        console.error("❌ Offer draw error:", error);
      }
    });

    socket.on("accept-draw", async ({ gameId, userId }) => {
      try {
        const result = await Matchmaking.endGame(gameId, "draw", null);

        const game = await Matchmaking.getGame(gameId);
        if (game) {
          const whiteSocketId = connectedUsers.get(game.white_player_id);
          const blackSocketId = connectedUsers.get(game.black_player_id);

          if (whiteSocketId) {
            io.to(whiteSocketId).emit("game-ended", {
              result: "draw",
              ratingChanges: result.ratingChanges,
            });
          }

          if (blackSocketId) {
            io.to(blackSocketId).emit("game-ended", {
              result: "draw",
              ratingChanges: result.ratingChanges,
            });
          }
        }
      } catch (error) {
        console.error("❌ Accept draw error:", error);
      }
    });

    socket.on("decline-draw", async ({ gameId, userId }) => {
      try {
        const game = await Matchmaking.getGame(gameId);
        if (!game) return;

        const opponentId =
          game.white_player_id === userId
            ? game.black_player_id
            : game.white_player_id;

        const opponentSocketId = connectedUsers.get(opponentId);
        if (opponentSocketId) {
          io.to(opponentSocketId).emit("draw-declined");
        }
      } catch (error) {
        console.error("❌ Decline draw error:", error);
      }
    });

    socket.on("resign", async ({ gameId, userId }) => {
      try {
        const game = await Matchmaking.getGame(gameId);
        if (!game) return;

        const winnerId =
          game.white_player_id === userId
            ? game.black_player_id
            : game.white_player_id;

        const result = await Matchmaking.endGame(
          gameId,
          "resignation",
          winnerId,
        );

        const whiteSocketId = connectedUsers.get(game.white_player_id);
        const blackSocketId = connectedUsers.get(game.black_player_id);

        if (whiteSocketId) {
          io.to(whiteSocketId).emit("game-ended", {
            result: "resignation",
            resignedBy: userId,
            winnerId,
            ratingChanges: result.ratingChanges,
          });
        }

        if (blackSocketId) {
          io.to(blackSocketId).emit("game-ended", {
            result: "resignation",
            resignedBy: userId,
            winnerId,
            ratingChanges: result.ratingChanges,
          });
        }
      } catch (error) {
        console.error("❌ Resign error:", error);
      }
    });

    socket.on("end-game", async ({ gameId, result, winnerId }) => {
      try {
        const gameResult = await Matchmaking.endGame(gameId, result, winnerId);

        const game = await Matchmaking.getGame(gameId);
        if (game) {
          const whiteSocketId = connectedUsers.get(game.white_player_id);
          const blackSocketId = connectedUsers.get(game.black_player_id);

          if (whiteSocketId) {
            io.to(whiteSocketId).emit("game-ended", {
              result,
              winnerId,
              ratingChanges: gameResult.ratingChanges,
            });
          }

          if (blackSocketId) {
            io.to(blackSocketId).emit("game-ended", {
              result,
              winnerId,
              ratingChanges: gameResult.ratingChanges,
            });
          }
        }
      } catch (error) {
        console.error("❌ End game error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`\n❌ DISCONNECT: ${socket.id}`);

      if (socket.userId) {
        console.log(`   User ID: ${socket.userId}`);
        const currentSocketId = connectedUsers.get(socket.userId);
        if (currentSocketId === socket.id) {
          connectedUsers.delete(socket.userId);
          db.query("DELETE FROM matchmaking_queue WHERE user_id = ?", [
            socket.userId,
          ])
            .then(() => console.log(`   ✅ Removed from queue`))
            .catch((err) => console.error(`   ❌ Queue cleanup error:`, err));
        } else {
          console.log(
            `   Skipping cleanup because user has a newer socket: ${currentSocketId}`,
          );
        }
      }
    });
  });

  console.log("✅ Socket.IO handlers ready\n");
};

async function getUserUsername(userId) {
  try {
    const users = await db.query("SELECT username FROM users WHERE id = ?", [
      userId,
    ]);

    if (users && users.length > 0) {
      return users[0].username || "Unknown";
    } else if (Array.isArray(users) && users[0] && users[0].length > 0) {
      return users[0][0].username || "Unknown";
    }

    return "Unknown";
  } catch (error) {
    console.error("❌ Get username error:", error);
    return "Unknown";
  }
}

module.exports = setupSocketHandlers;
