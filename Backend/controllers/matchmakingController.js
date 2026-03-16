// backend/controllers/matchmakingController.js - UPDATED
const Matchmaking = require("../models/Matchmaking");
const Rating = require("../models/Rating");

const matchmakingController = {
  // Join queue
  async joinQueue(req, res) {
    try {
      const { timeControl = "rapid" } = req.body;
      const userId = req.user.id;

      const result = await Matchmaking.joinQueue(userId, timeControl);
      res.json(result);
    } catch (error) {
      console.error("Join queue error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Leave queue
  async leaveQueue(req, res) {
    try {
      const userId = req.user.id;

      await Matchmaking.leaveQueue(userId);
      res.json({ success: true, message: "Đã rời hàng đợi" });
    } catch (error) {
      console.error("Leave queue error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get queue status
  async getQueueStatus(req, res) {
    try {
      const { timeControl = "rapid" } = req.query;

      const status = await Matchmaking.getQueueStatus(timeControl);
      res.json({ success: true, status });
    } catch (error) {
      console.error("Get queue status error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get active games
  async getActiveGames(req, res) {
    try {
      const userId = req.user.id;

      const games = await Matchmaking.getActiveGames(userId);
      res.json({ success: true, games });
    } catch (error) {
      console.error("Get active games error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get game details
  async getGame(req, res) {
    try {
      const { gameId } = req.params;

      const game = await Matchmaking.getGame(gameId);

      if (!game) {
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });
      }

      res.json({ success: true, game });
    } catch (error) {
      console.error("Get game error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Make move
  async makeMove(req, res) {
    try {
      const { gameId } = req.params;
      const { move, newFen, timeRemaining } = req.body;
      const userId = req.user.id;

      await Matchmaking.makeMove(gameId, userId, move, newFen, timeRemaining);

      res.json({ success: true, message: "Move made successfully" });
    } catch (error) {
      console.error("Make move error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // End game
  async endGame(req, res) {
    try {
      const { gameId } = req.params;
      const { result, winnerId } = req.body;

      const endResult = await Matchmaking.endGame(gameId, result, winnerId);

      res.json({ success: true, ...endResult });
    } catch (error) {
      console.error("End game error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🆕 Resign game
  async resignGame(req, res) {
    try {
      const { gameId } = req.params;
      const userId = req.user.id;

      const game = await Matchmaking.getGame(gameId);

      if (!game) {
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });
      }

      if (game.status !== "ongoing") {
        return res
          .status(400)
          .json({ success: false, message: "Game is not ongoing" });
      }

      // Determine winner (opponent of resigning player)
      const winnerId =
        game.white_player_id === userId
          ? game.black_player_id
          : game.white_player_id;

      const endResult = await Matchmaking.endGame(
        gameId,
        "resignation",
        winnerId,
      );

      res.json({
        success: true,
        message: "Đã đầu hàng",
        winnerId,
        ...endResult,
      });
    } catch (error) {
      console.error("Resign game error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🆕 Offer draw
  async offerDraw(req, res) {
    try {
      const { gameId } = req.params;
      const userId = req.user.id;

      const game = await Matchmaking.getGame(gameId);

      if (!game) {
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });
      }

      if (game.status !== "ongoing") {
        return res
          .status(400)
          .json({ success: false, message: "Game is not ongoing" });
      }

      // This is just a notification endpoint
      // The actual logic is handled via Socket.IO
      res.json({
        success: true,
        message: "Đã gửi đề nghị hòa",
      });
    } catch (error) {
      console.error("Offer draw error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🆕 Accept draw
  async acceptDraw(req, res) {
    try {
      const { gameId } = req.params;
      const userId = req.user.id;

      const game = await Matchmaking.getGame(gameId);

      if (!game) {
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });
      }

      if (game.status !== "ongoing") {
        return res
          .status(400)
          .json({ success: false, message: "Game is not ongoing" });
      }

      const endResult = await Matchmaking.endGame(gameId, "draw", null);

      res.json({
        success: true,
        message: "Đã chấp nhận hòa",
        result: "draw",
        ...endResult,
      });
    } catch (error) {
      console.error("Accept draw error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get leaderboard
  async getLeaderboard(req, res) {
    try {
      const { timeControl = "rapid", limit = 100 } = req.query;

      const leaderboard = await Rating.getLeaderboard(
        timeControl,
        parseInt(limit),
      );

      res.json({ success: true, leaderboard });
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get rating history
  async getRatingHistory(req, res) {
    try {
      const userId = req.user.id;
      const { timeControl = "rapid", limit = 20 } = req.query;

      const history = await Rating.getRatingHistory(
        userId,
        timeControl,
        parseInt(limit),
      );

      res.json({ success: true, history });
    } catch (error) {
      console.error("Get rating history error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = matchmakingController;
