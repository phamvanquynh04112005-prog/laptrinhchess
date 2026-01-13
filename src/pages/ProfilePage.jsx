import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Award,
} from "lucide-react";
import Header from "../components/layout/Header";
import { gameAPI } from "../utils/api";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        gameAPI.getStats(),
        gameAPI.getHistory(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (historyRes.success) setHistory(historyRes.games);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        }}
      >
        <Header />
        <CircularProgress size={60} sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  const winRate =
    stats && stats.total_games > 0
      ? ((stats.wins / stats.total_games) * 100).toFixed(1)
      : 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
      }}
    >
      <Header />
      <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <User size={48} color="#3b82f6" style={{ marginBottom: 16 }} />
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Hồ Sơ Người Chơi
            </Typography>
          </Box>

          {/* User Info Card */}
          <Card
            sx={{
              mb: 4,
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: "#3b82f6",
                    fontSize: "3rem",
                    border: "4px solid rgba(59, 130, 246, 0.3)",
                  }}
                >
                  {user?.username[0].toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h3" color="white" fontWeight="bold">
                    {user?.username}
                  </Typography>
                  <Typography variant="h6" color="#94a3b8" gutterBottom>
                    {user?.email}
                  </Typography>
                  <Box display="flex" gap={2} mt={2}>
                    <Chip
                      icon={<Trophy size={16} />}
                      label={`ELO: ${user?.rating || 1200}`}
                      sx={{
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                        color: "#3b82f6",
                        fontWeight: "bold",
                      }}
                    />
                    <Chip
                      icon={<Target size={16} />}
                      label={`${stats?.total_games || 0} ván đã chơi`}
                      sx={{
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                        color: "#10b981",
                        fontWeight: "bold",
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Trophy size={32} color="#10b981" />
                    <Typography variant="h6" color="white">
                      Thắng
                    </Typography>
                  </Box>
                  <Typography variant="h3" color="#10b981" fontWeight="bold">
                    {stats?.wins || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Target size={32} color="#ef4444" />
                    <Typography variant="h6" color="white">
                      Thua
                    </Typography>
                  </Box>
                  <Typography variant="h3" color="#ef4444" fontWeight="bold">
                    {stats?.losses || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <TrendingUp size={32} color="#f59e0b" />
                    <Typography variant="h6" color="white">
                      Hòa
                    </Typography>
                  </Box>
                  <Typography variant="h3" color="#f59e0b" fontWeight="bold">
                    {stats?.draws || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Award size={32} color="#3b82f6" />
                    <Typography variant="h6" color="white">
                      Tỷ lệ thắng
                    </Typography>
                  </Box>
                  <Typography variant="h3" color="#3b82f6" fontWeight="bold">
                    {winRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Win Rate Progress */}
          <Card
            sx={{
              mb: 4,
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                Phân tích kết quả
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="#10b981">
                    Thắng: {stats?.wins || 0}
                  </Typography>
                  <Typography color="#ef4444">
                    Thua: {stats?.losses || 0}
                  </Typography>
                  <Typography color="#f59e0b">
                    Hòa: {stats?.draws || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(winRate)}
                  sx={{
                    height: 20,
                    borderRadius: 2,
                    backgroundColor: "#374151",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#10b981",
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Game History */}
          <Card
            sx={{
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Clock size={24} color="#3b82f6" />
                <Typography variant="h5" color="white" fontWeight="bold">
                  Lịch sử trận đấu
                </Typography>
              </Box>

              {history.length === 0 ? (
                <Typography color="#94a3b8" textAlign="center" py={4}>
                  Chưa có trận đấu nào
                </Typography>
              ) : (
                <TableContainer
                  component={Paper}
                  sx={{ backgroundColor: "transparent" }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ color: "#94a3b8", fontWeight: "bold" }}
                        >
                          Ngày
                        </TableCell>
                        <TableCell
                          sx={{ color: "#94a3b8", fontWeight: "bold" }}
                        >
                          Đối thủ
                        </TableCell>
                        <TableCell
                          sx={{ color: "#94a3b8", fontWeight: "bold" }}
                        >
                          Độ khó
                        </TableCell>
                        <TableCell
                          sx={{ color: "#94a3b8", fontWeight: "bold" }}
                        >
                          Kết quả
                        </TableCell>
                        <TableCell
                          sx={{ color: "#94a3b8", fontWeight: "bold" }}
                        >
                          Nước đi
                        </TableCell>
                        <TableCell
                          sx={{ color: "#94a3b8", fontWeight: "bold" }}
                        >
                          Thời gian
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((game, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ color: "white" }}>
                            {formatDate(game.created_at)}
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {game.opponent_type === "AI"
                              ? "🤖 AI"
                              : "👥 Người chơi"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={game.difficulty}
                              size="small"
                              sx={{
                                backgroundColor:
                                  game.difficulty === "easy"
                                    ? "rgba(16, 185, 129, 0.2)"
                                    : game.difficulty === "medium"
                                    ? "rgba(59, 130, 246, 0.2)"
                                    : "rgba(239, 68, 68, 0.2)",
                                color:
                                  game.difficulty === "easy"
                                    ? "#10b981"
                                    : game.difficulty === "medium"
                                    ? "#3b82f6"
                                    : "#ef4444",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                game.result === "win"
                                  ? "Thắng"
                                  : game.result === "loss"
                                  ? "Thua"
                                  : "Hòa"
                              }
                              size="small"
                              sx={{
                                backgroundColor:
                                  game.result === "win"
                                    ? "rgba(16, 185, 129, 0.2)"
                                    : game.result === "loss"
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : "rgba(245, 158, 11, 0.2)",
                                color:
                                  game.result === "win"
                                    ? "#10b981"
                                    : game.result === "loss"
                                    ? "#ef4444"
                                    : "#f59e0b",
                                fontWeight: "bold",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {game.moves_count}
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {formatTime(game.time_spent || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ProfilePage;
