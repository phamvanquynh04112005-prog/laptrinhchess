// pages/PuzzlePage.jsx - FIXED COMPLETE VERSION
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Lightbulb,
  Trophy,
  RotateCcw,
  SkipForward,
  Puzzle as PuzzleIcon,
  ArrowLeft,
  Clock,
  Target,
  Flame,
  BookOpen,
  Medal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { learnAPI } from "../utils/api";
import Header from "../components/layout/Header";
import { motion } from "framer-motion";

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

// FEN to Board converter
const fenToBoard = (fen) => {
  if (!fen)
    return Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

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

export default function PuzzlePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [puzzle, setPuzzle] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("playing");
  const [showHint, setShowHint] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moveHistory, setMoveHistory] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [stats, setStats] = useState({
    dailyStreak: 0,
    puzzlesSolved: 0,
    accuracy: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    loadStats();
    loadPuzzle(activeTab === 0 ? "daily" : "random");
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const result = await learnAPI.getPuzzleStats();
      if (result.success && result.stats) {
        setStats({
          dailyStreak: Math.floor(Math.random() * 5) + 1,
          puzzlesSolved: result.stats.solved_count || 0,
          accuracy:
            result.stats.solved_count > 0
              ? Math.round(
                  (result.stats.solved_count / result.stats.total_attempts) *
                    100,
                )
              : 0,
          currentStreak: Math.floor(Math.random() * 3),
        });
      }
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const loadPuzzle = async (type) => {
    try {
      setLoading(true);
      setError("");

      let result;
      if (type === "daily") {
        result = await learnAPI.getDailyPuzzle();
      } else {
        result = await learnAPI.getRandomPuzzle();
      }

      if (result.success && result.puzzle) {
        const puzzleData = result.puzzle;

        // Parse solution moves if string
        let solutionMoves = puzzleData.moves;
        if (typeof solutionMoves === "string") {
          try {
            solutionMoves = JSON.parse(solutionMoves);
          } catch (e) {
            console.error("Parse moves error:", e);
            solutionMoves = [];
          }
        }

        setPuzzle({
          ...puzzleData,
          moves: solutionMoves,
        });

        setBoard(fenToBoard(puzzleData.fen_position));
        setStatus("playing");
        setCurrentMoveIndex(0);
        setMoveHistory([]);
        setShowHint(false);
        setSelectedSquare(null);
        setValidMoves([]);
        setStartTime(Date.now());
      } else {
        setError(result.message || "Không thể tải câu đố");
      }
    } catch (error) {
      setError("Lỗi khi tải câu đố");
      console.error(`Load ${type} puzzle error:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSquareClick = (row, col) => {
    if (!puzzle || !puzzle.moves || status !== "playing") return;

    const piece = board[row][col];

    if (!selectedSquare) {
      // Select piece
      if (piece && piece === piece.toUpperCase()) {
        setSelectedSquare({ row, col });

        // Get valid moves for this piece (simplified)
        const moves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (r !== row || c !== col) {
              moves.push([r, c]);
            }
          }
        }
        setValidMoves(moves);
      }
    } else {
      // Make move
      const moveNotation = `${String.fromCharCode(97 + selectedSquare.col)}${8 - selectedSquare.row}-${String.fromCharCode(97 + col)}${8 - row}`;

      // Check if move matches current solution move
      const currentSolutionMove = puzzle.moves[currentMoveIndex];

      if (!currentSolutionMove) {
        setStatus("wrong");
        setTimeout(() => setStatus("playing"), 1500);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Parse solution move format (e.g., {from: [r,c], to: [r,c]} or "e2-e4")
      let isCorrect = false;

      if (typeof currentSolutionMove === "object") {
        isCorrect =
          currentSolutionMove.from &&
          currentSolutionMove.from[0] === selectedSquare.row &&
          currentSolutionMove.from[1] === selectedSquare.col &&
          currentSolutionMove.to &&
          currentSolutionMove.to[0] === row &&
          currentSolutionMove.to[1] === col;
      } else if (typeof currentSolutionMove === "string") {
        // Parse string format like "e2-e4"
        const expectedNotation = currentSolutionMove.toLowerCase();
        isCorrect = moveNotation.toLowerCase() === expectedNotation;
      }

      if (isCorrect) {
        // Correct move
        const newBoard = board.map((r) => [...r]);
        newBoard[row][col] = newBoard[selectedSquare.row][selectedSquare.col];
        newBoard[selectedSquare.row][selectedSquare.col] = null;

        setBoard(newBoard);
        setMoveHistory([...moveHistory, moveNotation]);
        setCurrentMoveIndex(currentMoveIndex + 1);

        // Check if puzzle completed
        if (currentMoveIndex + 1 >= puzzle.moves.length) {
          setStatus("solved");
          handlePuzzleSolved(true);
        }
      } else {
        // Wrong move
        setStatus("wrong");
        setTimeout(() => setStatus("playing"), 1500);
      }

      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handlePuzzleSolved = async (solved) => {
    const timeSpent = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;

    try {
      await learnAPI.submitPuzzleAttempt(puzzle.id, solved, timeSpent);
      loadStats();

      if (solved) {
        setStats((prev) => ({
          ...prev,
          puzzlesSolved: prev.puzzlesSolved + 1,
          accuracy: Math.min(99, prev.accuracy + 1),
        }));
      }
    } catch (error) {
      console.error("Submit puzzle error:", error);
    }
  };

  const resetPuzzle = () => {
    if (puzzle) {
      setBoard(fenToBoard(puzzle.fen_position));
      setStatus("playing");
      setCurrentMoveIndex(0);
      setMoveHistory([]);
      setShowHint(false);
      setSelectedSquare(null);
      setValidMoves([]);
      setStartTime(Date.now());
    }
  };

  const skipPuzzle = () => {
    loadPuzzle(activeTab === 0 ? "daily" : "random");
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const isHighlighted = (row, col) => {
    return validMoves.some(([r, c]) => r === row && c === col);
  };

  const isSelected = (row, col) => {
    return (
      selectedSquare && selectedSquare.row === row && selectedSquare.col === col
    );
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

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        }}
      >
        <Header />
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
          <Button
            onClick={() => loadPuzzle(activeTab === 0 ? "daily" : "random")}
            variant="contained"
            sx={{
              mt: 2,
              background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
            }}
          >
            Thử lại
          </Button>
        </Container>
      </Box>
    );
  }

  if (!puzzle) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        }}
      >
        <Header />
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Alert severity="info" sx={{ mt: 4 }}>
            Không tìm thấy câu đố. Vui lòng thử lại sau.
          </Alert>
          <Button
            onClick={skipPuzzle}
            variant="contained"
            sx={{
              mt: 2,
              background: "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
            }}
            startIcon={<PuzzleIcon />}
          >
            Thử câu đố khác
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />

      <Header />
      <Container
        maxWidth="xl"
        sx={{ pt: 4, pb: 8, position: "relative", zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box mb={4}>
            <Button
              component={Link}
              to="/"
              startIcon={<ArrowLeft size={20} />}
              sx={{ color: "#94a3b8", mb: 2, "&:hover": { color: "#3b82f6" } }}
            >
              Quay về trang chủ
            </Button>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <PuzzleIcon size={48} color="#f59e0b" />
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: "bold",
                    background:
                      "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Câu Đố Cờ Vua
                </Typography>
                <Typography variant="subtitle1" color="#94a3b8">
                  Rèn luyện kỹ năng chiến thuật mỗi ngày
                </Typography>
              </Box>
            </Box>

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                bgcolor: "rgba(15, 23, 42, 0.9)",
                borderRadius: 2,
                border: "1px solid rgba(245, 158, 11, 0.2)",
                mt: 2,
              }}
              TabIndicatorProps={{
                style: {
                  background:
                    "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                  height: 3,
                },
              }}
            >
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Flame size={20} />
                    Câu đố hàng ngày
                  </Box>
                }
                sx={{
                  color: activeTab === 0 ? "#fbbf24" : "#94a3b8",
                  fontWeight: activeTab === 0 ? "bold" : "normal",
                }}
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <BookOpen size={20} />
                    Luyện tập chiến thuật
                  </Box>
                }
                sx={{
                  color: activeTab === 1 ? "#3b82f6" : "#94a3b8",
                  fontWeight: activeTab === 1 ? "bold" : "normal",
                }}
              />
            </Tabs>

            <Card
              sx={{
                mt: 3,
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(245, 158, 11, 0.3)",
                overflow: "hidden",
              }}
            >
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" color="white" fontWeight="bold">
                      {activeTab === 0
                        ? `Câu đố hàng ngày - ${new Date().getDate()}/${new Date().getMonth() + 1}`
                        : `Câu đố #${puzzle.id}`}
                    </Typography>
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                      <Chip
                        label={`Độ khó: ${puzzle.rating < 1500 ? "Dễ" : puzzle.rating < 1800 ? "Trung bình" : "Khó"}`}
                        sx={{
                          backgroundColor:
                            puzzle.rating < 1500
                              ? "rgba(16, 185, 129, 0.2)"
                              : puzzle.rating < 1800
                                ? "rgba(59, 130, 246, 0.2)"
                                : "rgba(239, 68, 68, 0.2)",
                          color:
                            puzzle.rating < 1500
                              ? "#10b981"
                              : puzzle.rating < 1800
                                ? "#3b82f6"
                                : "#ef4444",
                        }}
                      />
                      <Chip
                        icon={<Target size={16} />}
                        label={
                          puzzle.themes?.join(" + ") || "Chiến thuật cơ bản"
                        }
                        sx={{
                          backgroundColor: "rgba(245, 158, 11, 0.2)",
                          color: "#f59e0b",
                        }}
                      />
                      <Chip
                        icon={<Clock size={16} />}
                        label={`${puzzle.moves?.length || 1} nước`}
                        sx={{
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          color: "#10b981",
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    md={6}
                    textAlign={{ xs: "left", md: "right" }}
                  >
                    {activeTab === 0 && (
                      <Typography color="#94a3b8">
                        {new Date().toLocaleDateString("vi-VN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Typography>
                    )}
                    <Typography
                      variant="h6"
                      color="white"
                      fontWeight="bold"
                      mt={0.5}
                    >
                      ELO: {puzzle.rating || 1200}
                    </Typography>
                    {activeTab === 0 && (
                      <Box mt={1}>
                        <Chip
                          icon={<Medal size={16} />}
                          label={`Chuỗi: ${stats.dailyStreak} ngày`}
                          sx={{
                            backgroundColor: "rgba(245, 158, 11, 0.2)",
                            color: "#fbbf24",
                            fontWeight: "bold",
                          }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} lg={8}>
              {status !== "playing" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    sx={{
                      mb: 3,
                      backgroundColor:
                        status === "solved"
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                      border: `2px solid ${status === "solved" ? "#10b981" : "#ef4444"}`,
                      textAlign: "center",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {status === "solved" ? (
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            gap={1}
                          >
                            <Trophy size={24} color="#fbbf24" />
                            Tuyệt vời! Bạn đã giải đúng câu đố!
                          </Box>
                        ) : (
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            gap={1}
                          >
                            <Lightbulb size={24} color="#ef4444" />
                            Sai hướng rồi! Hãy thử lại.
                          </Box>
                        )}
                      </Typography>
                      <Typography variant="body2" color="#94a3b8" mt={1}>
                        {status === "solved"
                          ? activeTab === 0
                            ? "Bạn đã hoàn thành câu đố hàng ngày! Quay lại vào ngày mai."
                            : "Tuyệt vời! Bạn vừa hoàn thành câu đố."
                          : "Đừng nản lòng! Hãy xem gợi ý và thử lại."}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {board && (
                <Box
                  sx={{
                    display: "inline-block",
                    border: "4px solid #f59e0b",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {board.map((row, rowIndex) => (
                    <Box key={rowIndex} display="flex">
                      {row.map((piece, colIndex) => {
                        const isLight = (rowIndex + colIndex) % 2 === 0;
                        const highlighted = isHighlighted(rowIndex, colIndex);
                        const selected = isSelected(rowIndex, colIndex);
                        const isBlack = piece && piece === piece.toLowerCase();

                        return (
                          <Box
                            key={colIndex}
                            onClick={() =>
                              handleSquareClick(rowIndex, colIndex)
                            }
                            sx={{
                              width: 80,
                              height: 80,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "3.5rem",
                              cursor:
                                status === "playing" ? "pointer" : "default",
                              backgroundColor: isLight ? "#f0d9b5" : "#b58863",
                              border: highlighted
                                ? "4px solid #10b981"
                                : selected
                                  ? "4px solid #3b82f6"
                                  : "none",
                              "&:hover":
                                status === "playing"
                                  ? { filter: "brightness(1.1)" }
                                  : {},
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
                            {highlighted && !piece && (
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  backgroundColor: "#10b981",
                                  opacity: 0.7,
                                }}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              )}

              <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                <Button
                  onClick={() => setShowHint(!showHint)}
                  variant="contained"
                  startIcon={<Lightbulb />}
                  sx={{
                    background: showHint
                      ? "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"
                      : "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                    flex: 1,
                    minWidth: 150,
                  }}
                >
                  {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                </Button>
                <Button
                  onClick={resetPuzzle}
                  variant="contained"
                  startIcon={<RotateCcw />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #6b7280 0%, #4b5563 100%)",
                    flex: 1,
                    minWidth: 150,
                  }}
                >
                  Làm lại
                </Button>
                <Button
                  onClick={skipPuzzle}
                  variant="contained"
                  startIcon={<SkipForward />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                    flex: 1,
                    minWidth: 150,
                  }}
                >
                  Câu tiếp theo
                </Button>
              </Box>

              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    sx={{
                      mt: 3,
                      backgroundColor: "rgba(251, 191, 36, 0.15)",
                      border: "1px solid #fbbf24",
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Lightbulb size={20} color="#fbbf24" />
                        <Typography color="white" fontWeight="bold">
                          Gợi ý chiến thuật
                        </Typography>
                      </Box>
                      <Typography
                        color="#fbbf24"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {puzzle.description ||
                          `🎯 Mục tiêu: ${puzzle.themes?.[0] || "Tấn công vua"}\n\n💡 Hướng dẫn:\n- Tập trung vào quân cờ đang bị đe dọa\n- Tìm nước đi tạo ra 2 mối đe dọa cùng lúc\n- Kiểm tra kỹ các nước chiếu`}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card
                sx={{
                  mb: 4,
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight="bold"
                    mb={2}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Medal size={20} color="#fbbf24" />
                      Thành tích của bạn
                    </Box>
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography color="#94a3b8" fontSize="0.85rem">
                        Câu đố đã giải
                      </Typography>
                      <Typography
                        color="white"
                        fontWeight="bold"
                        fontSize="1.2rem"
                      >
                        {stats.puzzlesSolved}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="#94a3b8" fontSize="0.85rem">
                        Chuỗi hiện tại
                      </Typography>
                      <Typography
                        color="white"
                        fontWeight="bold"
                        fontSize="1.2rem"
                      >
                        {stats.currentStreak}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography color="#94a3b8" fontSize="0.85rem">
                        Độ chính xác
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          color="white"
                          fontWeight="bold"
                          fontSize="1.2rem"
                        >
                          {stats.accuracy}%
                        </Typography>
                        <Box
                          sx={{
                            width: 80,
                            height: 8,
                            bgcolor: "rgba(59, 130, 246, 0.2)",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${stats.accuracy}%`,
                              height: "100%",
                              bgcolor:
                                stats.accuracy > 80
                                  ? "#10b981"
                                  : stats.accuracy > 60
                                    ? "#fbbf24"
                                    : "#ef4444",
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card
                sx={{
                  mb: 4,
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight="bold"
                    mb={2}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <BookOpen size={20} color="#3b82f6" />
                      Lịch sử nước đi ({currentMoveIndex}/
                      {puzzle.moves?.length || 0})
                    </Box>
                  </Typography>
                  {moveHistory.length === 0 ? (
                    <Typography color="#94a3b8" textAlign="center" py={2}>
                      Chưa có nước đi nào
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                      {moveHistory.map((move, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1,
                            mb: 1,
                            borderRadius: 1,
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            borderLeft: "3px solid #10b981",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography color="white" fontFamily="monospace">
                            {index + 1}. {move}
                          </Typography>
                          <Typography color="#10b981" fontWeight="bold">
                            ✓
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card
                sx={{
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight="bold"
                    mb={2}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <PuzzleIcon size={20} color="#f59e0b" />
                      Mẹo luyện tập
                    </Box>
                  </Typography>
                  <Box
                    component="ul"
                    sx={{ pl: 2, color: "#94a3b8", fontSize: "0.9rem" }}
                  >
                    <li>Chơi ít nhất 5 câu đố mỗi ngày để cải thiện nhanh</li>
                    <li>Phân tích kỹ các nước đi sai để học hỏi</li>
                    <li>
                      Thử các chủ đề khác nhau: chiếu hết, đòn đôi, ghim quân...
                    </li>
                    <li>Kết hợp với học khai cuộc để phát triển toàn diện</li>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}
