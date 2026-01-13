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
import AnalysisPage from "./pages/AnalysisPage";
import PuzzlePage from "./pages/PuzzlePage";
import ProfilePage from "./pages/ProfilePage";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6",
    },
    secondary: {
      main: "#8b5cf6",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  // Private route không cần đăng nhập cho multiplayer
  const PrivateRoute = ({ children, allowGuest = false }) => {
    const token = localStorage.getItem("token");
    // Cho phép guest access nếu allowGuest = true
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

          {/* Analysis - Cần đăng nhập */}
          <Route
            path="/analysis"
            element={
              <PrivateRoute>
                <AnalysisPage />
              </PrivateRoute>
            }
          />

          {/* Puzzles - Cần đăng nhập */}
          <Route
            path="/puzzles"
            element={
              <PrivateRoute>
                <PuzzlePage />
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
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
