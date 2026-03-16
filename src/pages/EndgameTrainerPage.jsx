import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  LinearProgress,
  Chip,
} from "@mui/material";
import { Trophy, BookOpen, Play } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";
import { learnAPI } from "../utils/api";

const PIECE_SYMBOLS = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
};

const fenToBoard = (fen) => {
  const rows = fen.split(" ")[0].split("/");
  const board = [];

  for (const row of rows) {
    const boardRow = [];
    for (const char of row) {
      if (isNaN(char)) {
        boardRow.push(char);
      } else {
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push(null);
        }
      }
    }
    board.push(boardRow);
  }

  return board;
};

export default function EndgameTrainerPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [endgames, setEndgames] = useState([]);
  const [currentEndgame, setCurrentEndgame] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showingBoard, setShowingBoard] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProgress();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await learnAPI.getEndgameCategories();
      if (data.success) setCategories(data.categories);
    } catch (error) {
      console.error("Load categories error:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const data = await learnAPI.getEndgameProgress();
      if (data.success) setProgress(data.progress);
    } catch (error) {
      console.error("Load progress error:", error);
    }
  };

  const loadCategoryEndgames = async (category) => {
    try {
      const data = await learnAPI.getEndgamesByCategory(category);
      if (data.success) {
        setEndgames(data.endgames);
        setSelectedCategory(category);
      }
    } catch (error) {
      console.error("Load endgames error:", error);
    }
  };

  const startPractice = (endgame) => {
    setCurrentEndgame(endgame);
    setShowingBoard(true);
  };

  const submitAttempt = async (success) => {
    try {
      await learnAPI.submitEndgameAttempt(currentEndgame.id, success);
      loadProgress();
      setShowingBoard(false);
      setCurrentEndgame(null);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const getCategoryProgress = (category) => {
    if (!progress || !progress.by_category) return 0;
    const cat = progress.by_category.find((c) => c.category === category);
    if (!cat || cat.total === 0) return 0;
    return Math.round((cat.mastered / cat.total) * 100);
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

      <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box textAlign="center" mb={4}>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mb={2}
            >
              <Trophy size={48} color="#fbbf24" />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Endgame Trainer
              </Typography>
            </Box>
            <Typography variant="h6" color="#94a3b8">
              Làm chủ các tàn cuộc cơ bản và nâng cao
            </Typography>
          </Box>

          {/* Progress Overview */}
          {progress && (
            <Card
              sx={{
                mb: 4,
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(251, 191, 36, 0.3)",
              }}
            >
              <CardContent>
                <Typography variant="h5" color="white" fontWeight="bold" mb={3}>
                  📊 Tiến độ tổng quát
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="#94a3b8" variant="caption">
                      Đã luyện tập
                    </Typography>
                    <Typography variant="h4" color="#3b82f6" fontWeight="bold">
                      {progress.overall.total_practiced}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="#94a3b8" variant="caption">
                      Đã thành thạo
                    </Typography>
                    <Typography variant="h4" color="#10b981" fontWeight="bold">
                      {progress.overall.mastered_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="#94a3b8" variant="caption">
                      Tổng số
                    </Typography>
                    <Typography variant="h4" color="white" fontWeight="bold">
                      {progress.overall.total_endgames}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="#94a3b8" variant="caption">
                      Tỷ lệ thành công
                    </Typography>
                    <Typography variant="h4" color="#fbbf24" fontWeight="bold">
                      {progress.overall.avg_success_rate?.toFixed(0) || 0}%
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {!selectedCategory && !showingBoard && (
            <Box>
              <Typography variant="h5" color="white" fontWeight="bold" mb={3}>
                📚 Chọn danh mục
              </Typography>
              <Grid container spacing={3}>
                {categories.map((cat, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Card
                        onClick={() => loadCategoryEndgames(cat.category)}
                        sx={{
                          backgroundColor: "rgba(30, 41, 59, 0.8)",
                          backdropFilter: "blur(10px)",
                          border: "2px solid rgba(59, 130, 246, 0.3)",
                          cursor: "pointer",
                          transition: "all 0.3s",
                          "&:hover": {
                            border: "2px solid #3b82f6",
                            transform: "translateY(-4px)",
                          },
                        }}
                      >
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <Typography
                              variant="h6"
                              color="white"
                              fontWeight="bold"
                            >
                              {cat.category}
                            </Typography>
                            <Chip label={cat.count} color="primary" />
                          </Box>

                          {progress && (
                            <Box>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                mb={1}
                              >
                                <Typography variant="caption" color="#94a3b8">
                                  Tiến độ
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="#10b981"
                                  fontWeight="bold"
                                >
                                  {getCategoryProgress(cat.category)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={getCategoryProgress(cat.category)}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: "#374151",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: "#10b981",
                                  },
                                }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {selectedCategory && !showingBoard && (
            <Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={3}
              >
                <Typography variant="h5" color="white" fontWeight="bold">
                  📖 {selectedCategory}
                </Typography>
                <Button
                  onClick={() => setSelectedCategory(null)}
                  variant="outlined"
                  sx={{ borderColor: "#94a3b8", color: "#94a3b8" }}
                >
                  Quay lại
                </Button>
              </Box>

              <Grid container spacing={3}>
                {endgames.map((endgame, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card
                      sx={{
                        backgroundColor: "rgba(30, 41, 59, 0.8)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          mb={2}
                        >
                          <Typography
                            variant="h6"
                            color="white"
                            fontWeight="bold"
                          >
                            {endgame.name}
                          </Typography>
                          <Chip
                            label={endgame.difficulty}
                            color={
                              endgame.difficulty === "easy"
                                ? "success"
                                : endgame.difficulty === "medium"
                                  ? "warning"
                                  : "error"
                            }
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" color="#94a3b8" mb={2}>
                          {endgame.description}
                        </Typography>

                        <Button
                          onClick={() => startPractice(endgame)}
                          variant="contained"
                          fullWidth
                          startIcon={<Play />}
                          sx={{
                            background:
                              "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
                          }}
                        >
                          Luyện tập
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {showingBoard && currentEndgame && (
            <Box>
              <Card
                sx={{
                  mb: 3,
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  border: "2px solid #fbbf24",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h5"
                    color="white"
                    fontWeight="bold"
                    mb={1}
                  >
                    {currentEndgame.name}
                  </Typography>
                  <Typography variant="body1" color="#94a3b8">
                    {currentEndgame.description}
                  </Typography>
                </CardContent>
              </Card>

              <Box display="flex" justifyContent="center" mb={3}>
                <Box
                  sx={{
                    border: "4px solid #fbbf24",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {fenToBoard(currentEndgame.fen_position).map(
                    (row, rowIndex) => (
                      <Box key={rowIndex} display="flex">
                        {row.map((piece, colIndex) => {
                          const isLight = (rowIndex + colIndex) % 2 === 0;
                          const isBlack =
                            piece && piece === piece.toLowerCase();

                          return (
                            <Box
                              key={colIndex}
                              sx={{
                                width: 80,
                                height: 80,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "3.5rem",
                                backgroundColor: isLight
                                  ? "#f0d9b5"
                                  : "#b58863",
                              }}
                            >
                              {piece && (
                                <span
                                  style={{
                                    color: isBlack ? "#000000" : "#FFFFFF",
                                    textShadow: isBlack
                                      ? "0 0 3px rgba(255,255,255,0.5)"
                                      : "0 0 3px rgba(0,0,0,0.5)",
                                  }}
                                >
                                  {PIECE_SYMBOLS[piece]}
                                </span>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    ),
                  )}
                </Box>
              </Box>

              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  onClick={() => submitAttempt(true)}
                  variant="contained"
                  color="success"
                  size="large"
                >
                  ✓ Thành công
                </Button>
                <Button
                  onClick={() => submitAttempt(false)}
                  variant="contained"
                  color="error"
                  size="large"
                >
                  ✗ Chưa được
                </Button>
                <Button
                  onClick={() => setShowingBoard(false)}
                  variant="outlined"
                  size="large"
                >
                  Bỏ qua
                </Button>
              </Box>
            </Box>
          )}
        </motion.div>
      </Container>
    </Box>
  );
}
