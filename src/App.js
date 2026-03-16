import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChessBoard from "./components/chess/ChessBoard";
import LocalMultiplayerPage from "./pages/LocalMultiplayerPage";
import ProfilePage from "./pages/ProfilePage";
import OpeningExplorerPage from "./pages/OpeningExplorerPage";
import EndgameTrainerPage from "./pages/EndgameTrainerPage";
import OnlineMatchmakingPage from "./pages/OnlineMatchmakingPage";
import OnlineGamePage from "./pages/OnlineGamePage";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#2563eb" },
    secondary: { main: "#1d4ed8" },
    background: {
      default: "#0c1929",
      paper: "#132f4c",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    button: { textTransform: "none" },
  },
  shape: { borderRadius: 8 },
  transitions: { duration: { short: 200, standard: 280 } },
});

function App() {
  const PrivateRoute = ({ children, allowGuest = false }) => {
    const token = localStorage.getItem("token");
    return token || allowGuest ? children : <Navigate to="/login" />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Chơi với AI - Cần đăng nhập */}
          <Route
            path="/play"
            element={
              <PrivateRoute>
                <ChessBoard />
              </PrivateRoute>
            }
          />

          {/* 2 người chơi - Không cần đăng nhập */}
          <Route
            path="/multiplayer"
            element={
              <PrivateRoute allowGuest={true}>
                <LocalMultiplayerPage />
              </PrivateRoute>
            }
          />

          {/* Profile - Cần đăng nhập */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          {/* Opening Explorer - Cần đăng nhập */}
          <Route
            path="/learning/openings"
            element={
              <PrivateRoute>
                <OpeningExplorerPage />
              </PrivateRoute>
            }
          />

          {/* Endgame Trainer - Cần đăng nhập */}
          <Route
            path="/learning/endgames"
            element={
              <PrivateRoute>
                <EndgameTrainerPage />
              </PrivateRoute>
            }
          />

          {/* ✅ FIX: Online Matchmaking */}
          <Route
            path="/online"
            element={
              <PrivateRoute>
                <OnlineMatchmakingPage />
              </PrivateRoute>
            }
          />

          {/* ✅ FIX: Online Game - Route đúng với navigate */}
          <Route
            path="/online/game/:gameId"
            element={
              <PrivateRoute>
                <OnlineGamePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
