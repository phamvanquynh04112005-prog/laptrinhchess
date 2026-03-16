import { getApiBaseUrl } from "./runtimeConfig";

// src/utils/api.js - FIXED VERSION FOR LAN ACCESS

// ✅ FIX: Tự động phát hiện API URL - hỗ trợ cả localhost và IP LAN
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port || (protocol === "https:" ? "443" : "80");

  // Nếu đang chạy trên localhost và port 3000 (React dev server)
  if (hostname === "localhost" && port === "3000") {
    return `${protocol}//${hostname}:5000/api`;
  }

  // Nếu truy cập qua IP LAN (ví dụ: 192.168.1.106:3000)
  // Backend sẽ chạy trên cùng IP nhưng port 5000
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return `${protocol}//${hostname}:5000/api`;
  }

  // Mặc định (cho production)
  return "/api";
};

const API_URL = getApiBaseUrl();

console.log("🔗 API URL:", API_URL); // Debug log

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authAPI = {
  register: async (username, email, password) => {
    try {
      console.log("📝 Registering to:", `${API_URL}/auth/register`);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: "Network error" };
    }
  },

  login: async (email, password) => {
    try {
      console.log("🔐 Logging in to:", `${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getProfile: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get profile error:", error);
      return { success: false, message: "Network error" };
    }
  },

  updateProfile: async (updateData) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, message: "Network error" };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Change password error:", error);
      return { success: false, message: "Network error" };
    }
  },
};

export const gameAPI = {
  saveGame: async (gameData) => {
    try {
      const response = await fetch(`${API_URL}/games/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(gameData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Save game error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getHistory: async () => {
    try {
      const response = await fetch(`${API_URL}/games/history`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get history error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getCombinedHistory: async (limit = 50) => {
    try {
      const response = await fetch(
        `${API_URL}/games/history/combined?limit=${limit}`,
        {
          headers: getAuthHeader(),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get combined history error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getStats: async () => {
    try {
      const response = await fetch(`${API_URL}/games/stats`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get stats error:", error);
      return { success: false, message: "Network error" };
    }
  },
};

export const learnAPI = {
  getRandomPuzzle: async (difficulty = null) => {
    try {
      const url = difficulty
        ? `${API_URL}/learning/puzzles/random?difficulty=${difficulty}`
        : `${API_URL}/learning/puzzles/random`;

      const response = await fetch(url, {
        headers: getAuthHeader(),
      });
      const data = await response.json();

      if (data.success && data.puzzle) {
        // ✅ FIX: Parse solution_moves
        if (
          data.puzzle.solution_moves &&
          typeof data.puzzle.solution_moves === "string"
        ) {
          try {
            data.puzzle.solution_moves = JSON.parse(data.puzzle.solution_moves);
          } catch (e) {
            console.warn("Could not parse solution_moves:", e);
            data.puzzle.solution_moves = [];
          }
        }
      }

      return data;
    } catch (error) {
      console.error("Get random puzzle error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getDailyPuzzle: async () => {
    try {
      const response = await fetch(`${API_URL}/learning/puzzles/daily`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();

      if (data.success && data.puzzle) {
        // ✅ FIX: Parse solution_moves
        if (
          data.puzzle.solution_moves &&
          typeof data.puzzle.solution_moves === "string"
        ) {
          try {
            data.puzzle.solution_moves = JSON.parse(data.puzzle.solution_moves);
          } catch (e) {
            console.warn("Could not parse solution_moves:", e);
            data.puzzle.solution_moves = [];
          }
        }
      }

      return data;
    } catch (error) {
      console.error("Get daily puzzle error:", error);
      return { success: false, message: "Network error" };
    }
  },

  submitPuzzleAttempt: async (puzzleId, solved, timeSpent) => {
    try {
      const response = await fetch(`${API_URL}/learning/puzzles/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ puzzleId, solved, timeSpent }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Submit puzzle error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getPuzzleStats: async () => {
    try {
      const response = await fetch(`${API_URL}/learning/puzzles/stats`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get puzzle stats error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getAllOpenings: async () => {
    try {
      const response = await fetch(`${API_URL}/learning/openings`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get openings error:", error);
      return { success: false, message: "Network error" };
    }
  },

  searchOpenings: async (searchTerm) => {
    try {
      const response = await fetch(
        `${API_URL}/learning/openings/search?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: getAuthHeader(),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Search openings error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getPopularOpenings: async (limit = 10) => {
    try {
      const response = await fetch(
        `${API_URL}/learning/openings/popular?limit=${limit}`,
        {
          headers: getAuthHeader(),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get popular openings error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getUserOpeningStats: async () => {
    try {
      const response = await fetch(`${API_URL}/learning/openings/stats`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get opening stats error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getOpeningRecommendations: async () => {
    try {
      const response = await fetch(
        `${API_URL}/learning/openings/recommendations`,
        {
          headers: getAuthHeader(),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get recommendations error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getEndgameCategories: async () => {
    try {
      const response = await fetch(`${API_URL}/learning/endgames/categories`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get endgame categories error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getEndgamesByCategory: async (category) => {
    try {
      const response = await fetch(
        `${API_URL}/learning/endgames/category/${encodeURIComponent(category)}`,
        {
          headers: getAuthHeader(),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get endgames error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getEndgameProgress: async () => {
    try {
      const response = await fetch(`${API_URL}/learning/endgames/progress`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get endgame progress error:", error);
      return { success: false, message: "Network error" };
    }
  },

  submitEndgameAttempt: async (endgameId, success) => {
    try {
      const response = await fetch(`${API_URL}/learning/endgames/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ endgameId, success }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Submit endgame error:", error);
      return { success: false, message: "Network error" };
    }
  },
};

export const matchmakingAPI = {
  joinQueue: async (timeControl = "rapid") => {
    try {
      const response = await fetch(`${API_URL}/matchmaking/queue/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ timeControl }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Join queue error:", error);
      return { success: false, message: "Network error" };
    }
  },

  leaveQueue: async () => {
    try {
      const response = await fetch(`${API_URL}/matchmaking/queue/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Leave queue error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getQueueStatus: async (timeControl = "rapid") => {
    try {
      const response = await fetch(
        `${API_URL}/matchmaking/queue/status?timeControl=${timeControl}`,
        {
          headers: getAuthHeader(),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get queue status error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getActiveGames: async () => {
    try {
      const response = await fetch(`${API_URL}/matchmaking/games/active`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get active games error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getGame: async (gameId) => {
    try {
      const response = await fetch(`${API_URL}/matchmaking/games/${gameId}`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get game error:", error);
      return { success: false, message: "Network error" };
    }
  },

  makeMove: async (gameId, move, newFen, timeRemaining) => {
    try {
      const response = await fetch(
        `${API_URL}/matchmaking/games/${gameId}/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ move, newFen, timeRemaining }),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Make move error:", error);
      return { success: false, message: "Network error" };
    }
  },

  resignGame: async (gameId) => {
    try {
      const response = await fetch(
        `${API_URL}/matchmaking/games/${gameId}/resign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Resign game error:", error);
      return { success: false, message: "Network error" };
    }
  },

  offerDraw: async (gameId) => {
    try {
      const response = await fetch(
        `${API_URL}/matchmaking/games/${gameId}/offer-draw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Offer draw error:", error);
      return { success: false, message: "Network error" };
    }
  },

  acceptDraw: async (gameId) => {
    try {
      const response = await fetch(
        `${API_URL}/matchmaking/games/${gameId}/accept-draw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Accept draw error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getLeaderboard: async (timeControl = "rapid", limit = 100) => {
    try {
      const response = await fetch(
        `${API_URL}/matchmaking/leaderboard?timeControl=${timeControl}&limit=${limit}`,
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get leaderboard error:", error);
      return { success: false, message: "Network error" };
    }
  },

  getRatingHistory: async (limit = 20, timeControl = "rapid") => {
    try {
      const response = await fetch(
        `${API_URL}/matchmaking/rating/history?limit=${limit}&timeControl=${timeControl}`,
        {
          headers: getAuthHeader(),
        },
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get rating history error:", error);
      return { success: false, message: "Network error" };
    }
  },
};
