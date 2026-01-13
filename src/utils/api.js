const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authAPI = {
  register: async (username, email, password) => {
    try {
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
