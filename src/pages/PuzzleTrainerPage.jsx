import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Lightbulb,
  RotateCcw,
  SkipForward,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";
import { makeMove, getValidMoves } from "../utils/chessLogic";
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

// FEN to Board converter
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

export default function PuzzleTrainerPage() {
  const [puzzle, setPuzzle] = useState(null);
  const [board, setBoard] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [movesMade, setMovesMade] = useState([]);
  const [status, setStatus] = useState("playing");
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("");
  const [stats, setStats] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await learnAPI.getPuzzleStats();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const loadPuzzle = async () => {
    setLoading(true);
    try {
      const data = await learnAPI.getRandomPuzzle(difficulty || null);

      if (data.success) {
        setPuzzle(data.puzzle);
        setBoard(fenToBoard(data.puzzle.fen_position));
        setMovesMade([]);
        setStatus("playing");
        setShowHint(false);
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error("Load puzzle error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSquareClick = (row, col) => {
    if (status !== "playing" || !board) return;

    const piece = board[row][col];

    if (!selectedSquare) {
      if (piece && piece === piece.toUpperCase()) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(board, row, col));
      }
    } else {
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col);

      if (isValidMove) {
        const newBoard = makeMove(
          board,
          selectedSquare.row,
          selectedSquare.col,
          row,
          col,
        );
        setBoard(newBoard);

        const newMove = {
          from: [selectedSquare.row, selectedSquare.col],
          to: [row, col],
        };
        const newMovesMade = [...movesMade, newMove];
        setMovesMade(newMovesMade);

        // Kiểm tra với solution
        const solutionMove = puzzle.solution_moves[newMovesMade.length - 1];
        if (
          solutionMove &&
          solutionMove.from[0] === selectedSquare.row &&
          solutionMove.from[1] === selectedSquare.col &&
          solutionMove.to[0] === row &&
          solutionMove.to[1] === col
        ) {
          if (newMovesMade.length >= puzzle.solution_moves.length) {
            handlePuzzleSolved(true);
          }
        } else {
          handlePuzzleSolved(false);
        }

        setSelectedSquare(null);
        setValidMoves([]);
      } else if (piece && piece === piece.toUpperCase()) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(board, row, col));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };

  const handlePuzzleSolved = async (solved) => {
    setStatus(solved ? "solved" : "wrong");

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await learnAPI.submitPuzzleAttempt(puzzle.id, solved, timeSpent);
      loadStats();
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const isHighlighted = (row, col) =>
    validMoves.some(([r, c]) => r === row && c === col);
  const isSelected = (row, col) =>
    selectedSquare && selectedSquare.row === row && selectedSquare.col === col;

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
              <Target size={48} color="#f59e0b" />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Puzzle Trainer
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={4} justifyContent="center" flexWrap="wrap">
            {/* Left Panel - Stats */}
            <Box sx={{ width: 320 }}>
              <Card
                sx={{
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(245, 158, 11, 0.3)",
                  mb: 3,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight="bold"
                    mb={2}
                  >
                    📊 Thống kê
                  </Typography>
                  {stats && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography color="#94a3b8">Đã giải:</Typography>
                        <Typography color="#10b981" fontWeight="bold">
                          {stats.solved_count}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography color="#94a3b8">Tổng thử:</Typography>
                        <Typography color="white" fontWeight="bold">
                          {stats.total_attempts}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography color="#94a3b8">Rating:</Typography>
                        <Typography color="#3b82f6" fontWeight="bold">
                          {stats.current_rating}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card
                sx={{
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight="bold"
                    mb={2}
                  >
                    ⚙️ Cài đặt
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: "white" }}>Độ khó</InputLabel>
                    <Select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      sx={{
                        color: "white",
                        backgroundColor: "rgba(30, 41, 59, 0.5)",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#f59e0b",
                        },
                      }}
                    >
                      <MenuItem value="">Tự động</MenuItem>
                      <MenuItem value="easy">Dễ</MenuItem>
                      <MenuItem value="medium">Trung bình</MenuItem>
                      <MenuItem value="hard">Khó</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    onClick={loadPuzzle}
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{
                      background:
                        "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                      py: 1.5,
                      fontWeight: "bold",
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Puzzle mới"}
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* Center - Chess Board */}
            {!puzzle ? (
              <Box textAlign="center" py={10}>
                <Typography variant="h5" color="white" mb={3}>
                  Nhấn "Puzzle mới" để bắt đầu!
                </Typography>
              </Box>
            ) : (
              <Box>
                {puzzle && (
                  <Card
                    sx={{
                      mb: 3,
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      border: "2px solid #f59e0b",
                    }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            color="white"
                            fontWeight="bold"
                          >
                            {puzzle.description || "Tìm nước đi tốt nhất"}
                          </Typography>
                          <Box display="flex" gap={1} mt={1}>
                            <Chip
                              label={puzzle.difficulty}
                              color="warning"
                              size="small"
                            />
                            {puzzle.themes &&
                              puzzle.themes.map((theme, i) => (
                                <Chip key={i} label={theme} size="small" />
                              ))}
                          </Box>
                        </Box>
                        <Typography color="#94a3b8">
                          Nước đi: {movesMade.length} /{" "}
                          {puzzle.solution_moves.length}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {status !== "playing" && (
                  <Card
                    sx={{
                      mb: 3,
                      backgroundColor:
                        status === "solved"
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                      border: `2px solid ${status === "solved" ? "#10b981" : "#ef4444"}`,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        color="white"
                        textAlign="center"
                        fontWeight="bold"
                      >
                        {status === "solved" ? "✅ Chính xác!" : "❌ Sai rồi!"}
                      </Typography>
                    </CardContent>
                  </Card>
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
                          const isBlack =
                            piece && piece === piece.toLowerCase();

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
                                cursor: "pointer",
                                backgroundColor: isLight
                                  ? "#f0d9b5"
                                  : "#b58863",
                                border: highlighted
                                  ? "4px solid #fbbf24"
                                  : selected
                                    ? "4px solid #3b82f6"
                                    : "none",
                                "&:hover": { filter: "brightness(1.1)" },
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
                                    backgroundColor: "#fbbf24",
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

                <Box mt={3} display="flex" gap={2} justifyContent="center">
                  <Button
                    onClick={() => setShowHint(!showHint)}
                    variant="contained"
                    startIcon={<Lightbulb />}
                    sx={{
                      background:
                        "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                    }}
                  >
                    {showHint ? "Ẩn" : "Gợi ý"}
                  </Button>
                  <Button
                    onClick={loadPuzzle}
                    variant="contained"
                    startIcon={<SkipForward />}
                    sx={{
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                    }}
                  >
                    Bỏ qua
                  </Button>
                </Box>

                {showHint && puzzle && (
                  <Card
                    sx={{
                      mt: 3,
                      backgroundColor: "rgba(251, 191, 36, 0.2)",
                      border: "2px solid #fbbf24",
                    }}
                  >
                    <CardContent>
                      <Typography color="white">
                        💡 Hãy tập trung vào {puzzle.themes && puzzle.themes[0]}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
