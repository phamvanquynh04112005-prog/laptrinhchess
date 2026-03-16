// frontend/src/pages/OnlineMatchmakingPage.jsx - IMPROVED WITH DEBUGGING
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import Header from "../components/layout/Header";
import { getSocketBaseUrl } from "../utils/runtimeConfig";

// CHỈ GIỮ LẠI 10 PHÚT (Rapid)
const TIME_CONTROLS = {
  rapid: {
    name: "10 Phút",
    time: 600,
    icon: Target,
    color: "#10b981",
    description: "10 phút + 5 giây mỗi nước",
  },
};

const getSocketUrl = () => getSocketBaseUrl();

const OnlineMatchmakingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState("rapid");
  const [userStats, setUserStats] = useState({
    rapid_rating: 1500,
    total_games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  });
  const [queueSize, setQueueSize] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [searchStatus, setSearchStatus] = useState("");
  const [matchDialog, setMatchDialog] = useState({
    open: false,
    gameId: null,
    opponent: null,
    color: null,
    timeControl: null,
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    console.log("👤 User loaded:", parsedUser);
    setUser(parsedUser);
    loadUserStats(parsedUser.id);

    const socketInstance = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 15000,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setConnectionStatus("connected");
      socketInstance.emit("authenticate", parsedUser.id);
    });

    socketInstance.on("authenticated", ({ success, userId }) => {
      console.log("🔐 Authenticated:", { success, userId });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error);
      setConnectionStatus("error");
      setIsSearching(false);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setConnectionStatus("disconnected");
      setIsSearching(false);
    });

    socketInstance.on("queue-joined", (data) => {
      console.log("📥 Queue joined response:", data);
      console.log("   queueSize:", data?.queueSize);
      console.log("   message:", data?.message);

      const safeQueueSize = data?.queueSize ?? 0;
      console.log("   Using queueSize:", safeQueueSize);

      setIsSearching(true);
      setQueueSize(safeQueueSize);
      setSearchStatus(
        `Đang tìm đối thủ... (${safeQueueSize} người trong hàng đợi)`,
      );
    });

    socketInstance.on(
      "match-found",
      ({ gameId, opponent, color, timeControl }) => {
        console.log("✨ Match found!", {
          gameId,
          opponent,
          color,
          timeControl,
        });
        setIsSearching(false);
        setSearchStatus("");

        setMatchDialog({
          open: true,
          gameId,
          opponent,
          color,
          timeControl,
        });
      },
    );

    socketInstance.on("queue-error", ({ message }) => {
      console.error("❌ Queue error:", message);
      setIsSearching(false);
      setSearchStatus("");
      alert(`Lỗi: ${message || "Không thể vào hàng đợi"}`);
    });

    socketInstance.on("queue-left", ({ success }) => {
      console.log("👋 Left queue:", success);
      setIsSearching(false);
      setSearchStatus("");
      setQueueSize(0);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [navigate]);

  const loadUserStats = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      console.log("📊 Loading user stats for user:", userId);

      const response = await fetch(`${getSocketUrl()}/api/games/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📊 Stats response status:", response.status);

      if (!response.ok) {
        console.warn("⚠️ Stats API returned non-OK status:", response.status);
        // Use default stats if API fails
        return;
      }

      const data = await response.json();
      console.log("📊 Stats data:", data);

      if (data.success && data.stats) {
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error("❌ Load stats error:", error);
      // Continue with default stats
    }
  };

  const handleJoinQueue = (timeControl = "rapid") => {
    if (!socket || !user || connectionStatus !== "connected") {
      alert("Đang kết nối đến server... Vui lòng thử lại!");
      return;
    }

    setSelectedTimeControl(timeControl);
    setIsSearching(true);

    const rating = userStats.rapid_rating || 1500;

    console.log("🎮 Joining queue with params:", {
      userId: user.id,
      timeControl,
      rating,
    });

    socket.emit("join-queue", { userId: user.id, timeControl, rating });
  };

  const handleLeaveQueue = () => {
    if (socket && user) {
      console.log("👋 Leaving queue for user:", user.id);
      socket.emit("leave-queue", { userId: user.id });
      setIsSearching(false);
      setSelectedTimeControl("rapid");
      setQueueSize(0);
      setSearchStatus("");
    }
  };

  const handleMatchContinue = () => {
    if (matchDialog.gameId) {
      navigate(`/online/game/${matchDialog.gameId}`);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
      }}
    >
      <Header />
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              color="white"
              fontWeight="bold"
              gutterBottom
            >
              🎮 Đấu Online
            </Typography>
            <Typography variant="h6" color="#94a3b8">
              Tìm đối thủ và thi đấu xếp hạng ELO (10 phút)
            </Typography>
          </Box>
        </motion.div>

        {/* Connection Status */}
        <Box display="flex" justifyContent="center" mb={3}>
          {connectionStatus === "connected" && (
            <Alert severity="success" sx={{ width: "fit-content" }}>
              🟢 Đã kết nối server
            </Alert>
          )}
          {connectionStatus === "error" && (
            <Alert severity="error" sx={{ width: "fit-content" }}>
              🔴 Lỗi kết nối - Đang thử lại...
            </Alert>
          )}
          {connectionStatus === "disconnected" && (
            <Alert severity="warning" sx={{ width: "fit-content" }}>
              🟡 Đang kết nối...
            </Alert>
          )}
        </Box>

        {/* User Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            sx={{
              mb: 4,
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "2px solid #3b82f6",
              backdropFilter: "blur(10px)",
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                color="white"
                fontWeight="bold"
                gutterBottom
              >
                {user?.username}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography color="#94a3b8" variant="caption">
                      Rapid Rating (10 phút)
                    </Typography>
                    <Typography variant="h4" color="#10b981" fontWeight="bold">
                      {userStats.rapid_rating || 1500}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography color="#94a3b8" variant="caption">
                      Tổng trận
                    </Typography>
                    <Typography variant="h4" color="#3b82f6" fontWeight="bold">
                      {userStats.total_games || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography color="#94a3b8" variant="caption">
                      Thắng / Hòa / Thua
                    </Typography>
                    <Typography variant="h6" color="white">
                      {userStats.wins || 0} / {userStats.draws || 0} /{" "}
                      {userStats.losses || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Searching Status */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              sx={{
                mb: 4,
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                border: "2px solid #3b82f6",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={40} sx={{ color: "#3b82f6" }} />
                    <Box>
                      <Typography variant="h6" color="white" fontWeight="bold">
                        🔍 Đang tìm đối thủ...
                      </Typography>
                      <Typography color="#94a3b8">{searchStatus}</Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleLeaveQueue}
                    sx={{
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                    }}
                  >
                    Hủy tìm kiếm
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Time Control - CHỈ 1 LỰA CHỌN 10 PHÚT */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={10} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card
                sx={{
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  border: `2px solid #10b981`,
                  backdropFilter: "blur(10px)",
                  cursor: isSearching ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": !isSearching
                    ? {
                        transform: "translateY(-8px)",
                        boxShadow: `0 8px 24px #10b98140`,
                      }
                    : {},
                }}
                onClick={() => !isSearching && handleJoinQueue("rapid")}
              >
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Target size={32} color="white" />
                      </Box>
                      <Box>
                        <Typography
                          variant="h4"
                          color="white"
                          fontWeight="bold"
                        >
                          10 Phút
                        </Typography>
                        <Typography variant="h6" color="#94a3b8">
                          10 phút + 5 giây mỗi nước
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={userStats.rapid_rating || 1500}
                      sx={{
                        backgroundColor: "#10b981",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "1.5rem",
                        padding: "24px 16px",
                      }}
                    />
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={isSearching}
                    size="large"
                    sx={{
                      background: `linear-gradient(90deg, #10b981 0%, #059669 100%)`,
                      fontSize: "1.2rem",
                      py: 2,
                      "&:hover": {
                        background: `linear-gradient(90deg, #059669 0%, #047857 100%)`,
                      },
                    }}
                  >
                    {isSearching ? "Đang tìm đối thủ..." : "🎯 Tìm trận đấu"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card
            sx={{
              mt: 4,
              backgroundColor: "rgba(30, 41, 59, 0.6)",
              border: "1px solid #475569",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                color="white"
                fontWeight="bold"
                gutterBottom
              >
                💡 Hướng dẫn
              </Typography>
              <Box component="ul" color="#94a3b8" sx={{ m: 0, pl: 3 }}>
                <li>
                  <Typography color="#94a3b8">
                    1. Nhấn "Tìm trận đấu" để bắt đầu tìm đối thủ
                  </Typography>
                </li>
                <li>
                  <Typography color="#94a3b8">
                    2. Hệ thống sẽ tự động ghép với đối thủ có rating tương đồng
                    (±300 điểm)
                  </Typography>
                </li>
                <li>
                  <Typography color="#94a3b8">
                    3. Màu quân (Trắng/Đen) được phân ngẫu nhiên
                  </Typography>
                </li>
                <li>
                  <Typography color="#94a3b8">
                    4. Mỗi người có 10 phút + 5 giây thêm sau mỗi nước đi
                  </Typography>
                </li>
                <li>
                  <Typography color="#94a3b8">
                    5. Rating sẽ thay đổi dựa trên kết quả trận đấu
                  </Typography>
                </li>
                <li>
                  <Typography color="#94a3b8">
                    6. Đảm bảo 2 trình duyệt/thiết bị khác nhau để test ghép
                    trận
                  </Typography>
                </li>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Debug Info (Remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <Card sx={{ mt: 2, backgroundColor: "rgba(0,0,0,0.5)" }}>
            <CardContent>
              <Typography color="white" variant="caption">
                Debug Info:
              </Typography>
              <Typography color="#94a3b8" variant="caption" component="div">
                • Socket Status: {connectionStatus}
                <br />• Is Searching: {isSearching ? "Yes" : "No"}
                <br />• Queue Size: {queueSize}
                <br />• User ID: {user?.id}
                <br />• Rating: {userStats.rapid_rating || 1500}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Match Found Dialog */}
        <Dialog open={matchDialog.open} onClose={handleMatchContinue}>
          <DialogTitle>🎯 Tìm trận thành công!</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Đối thủ: {matchDialog.opponent?.username || "Ẩn"}
            </Typography>
            <Typography gutterBottom>
              ELO: {matchDialog.opponent?.rating ?? "—"}
            </Typography>
            <Typography>
              Màu quân: {matchDialog.color === "white" ? "Trắng" : "Đen"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleMatchContinue} variant="contained">
              Vào trận
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OnlineMatchmakingPage;
