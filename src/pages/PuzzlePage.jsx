import { useState } from "react";
import { getValidMoves, makeMove, isCheckmate } from "../utils/chessLogic";
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import {
  Lightbulb,
  RotateCcw,
  SkipForward,
  Puzzle as PuzzleIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";

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

const PUZZLES = [
  {
    id: 1,
    name: "Chiếu hết trong 2 nước",
    difficulty: "Dễ",
    board: [
      ["r", null, null, null, "k", null, null, "r"],
      [null, null, null, null, null, "p", "p", "p"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["P", "P", "P", null, null, "P", "P", "P"],
      ["R", null, null, null, "K", null, null, "R"],
    ],
    solution: [{ from: [7, 0], to: [0, 0] }],
    hint: "Tìm cách chiếu hết bằng xe!",
  },
  {
    id: 2,
    name: "Đòn phối hợp Mã",
    difficulty: "Trung bình",
    board: [
      ["r", null, "b", "q", "k", "b", null, "r"],
      ["p", "p", "p", null, null, "p", "p", "p"],
      [null, null, "n", null, null, "n", null, null],
      [null, null, null, "p", "p", null, null, null],
      [null, null, null, "P", "P", null, null, null],
      [null, null, "N", null, null, "N", null, null],
      ["P", "P", "P", null, null, "P", "P", "P"],
      ["R", null, "B", "Q", "K", "B", null, "R"],
    ],
    solution: [{ from: [5, 2], to: [3, 3] }],
    hint: "Mã rất giỏi tấn công kép!",
  },
  {
    id: 3,
    name: "Hy sinh Hậu",
    difficulty: "Khó",
    board: [
      ["r", null, null, null, "k", null, null, "r"],
      ["p", "p", "p", "q", null, "p", "b", "p"],
      [null, null, null, null, "p", "n", "p", null],
      [null, null, null, "p", null, null, null, null],
      [null, null, "P", "P", null, null, null, null],
      [null, null, "N", null, null, "N", null, null],
      ["P", "P", null, null, "Q", "P", "P", "P"],
      ["R", null, "B", null, "K", "B", null, "R"],
    ],
    solution: [{ from: [6, 4], to: [1, 4] }],
    hint: "Đôi khi hy sinh hậu dẫn đến chiếu hết!",
  },
];

export default function PuzzlePage() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [board, setBoard] = useState(PUZZLES[0].board.map((row) => [...row]));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [movesMade, setMovesMade] = useState([]);
  const [status, setStatus] = useState("playing");
  const [showHint, setShowHint] = useState(false);

  const currentPuzzle = PUZZLES[currentPuzzleIndex];

  const handleSquareClick = (row, col) => {
    if (status !== "playing") return;

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
          col
        );
        setBoard(newBoard);

        const newMove = {
          from: [selectedSquare.row, selectedSquare.col],
          to: [row, col],
        };
        const newMovesMade = [...movesMade, newMove];
        setMovesMade(newMovesMade);

        const solutionMove = currentPuzzle.solution[newMovesMade.length - 1];
        if (
          solutionMove &&
          solutionMove.from[0] === selectedSquare.row &&
          solutionMove.from[1] === selectedSquare.col &&
          solutionMove.to[0] === row &&
          solutionMove.to[1] === col
        ) {
          if (newMovesMade.length >= currentPuzzle.solution.length) {
            setStatus("solved");
          }
        } else {
          setStatus("wrong");
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

  const resetPuzzle = () => {
    setBoard(currentPuzzle.board.map((row) => [...row]));
    setSelectedSquare(null);
    setValidMoves([]);
    setMovesMade([]);
    setStatus("playing");
    setShowHint(false);
  };

  const nextPuzzle = () => {
    const nextIndex = (currentPuzzleIndex + 1) % PUZZLES.length;
    setCurrentPuzzleIndex(nextIndex);
    setBoard(PUZZLES[nextIndex].board.map((row) => [...row]));
    setSelectedSquare(null);
    setValidMoves([]);
    setMovesMade([]);
    setStatus("playing");
    setShowHint(false);
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Header />

      <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <Box textAlign="center" mb={4}>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mb={2}
            >
              <PuzzleIcon size={48} color="#f59e0b" />
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
                Câu Đố Cờ Vua
              </Typography>
            </Box>
            <Typography variant="h6" color="#94a3b8">
              Rèn luyện kỹ năng với các thế cờ thách thức
            </Typography>
          </Box>

          <Box display="flex" gap={4} justifyContent="center" flexWrap="wrap">
            {/* Game Board */}
            <Box>
              {/* Puzzle Info */}
              <Card
                sx={{
                  mb: 3,
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(245, 158, 11, 0.3)",
                  boxShadow: "0 8px 32px rgba(245, 158, 11, 0.2)",
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
                        variant="h5"
                        color="white"
                        fontWeight="bold"
                        gutterBottom
                      >
                        {currentPuzzle.name}
                      </Typography>
                      <Typography variant="body1" color="#f59e0b">
                        Độ khó: {currentPuzzle.difficulty}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography color="white" fontWeight="bold" variant="h6">
                        Câu đố {currentPuzzleIndex + 1} / {PUZZLES.length}
                      </Typography>
                      <Typography color="#94a3b8">
                        Nước đi: {movesMade.length} /{" "}
                        {currentPuzzle.solution.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Status Message */}
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
                      border: `2px solid ${
                        status === "solved" ? "#10b981" : "#ef4444"
                      }`,
                      boxShadow: `0 8px 32px ${
                        status === "solved"
                          ? "rgba(16, 185, 129, 0.3)"
                          : "rgba(239, 68, 68, 0.3)"
                      }`,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        color="white"
                        textAlign="center"
                        fontWeight="bold"
                      >
                        {status === "solved"
                          ? "✅ Chính xác! Bạn đã giải đúng!"
                          : "❌ Sai rồi! Hãy thử lại nhé!"}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Chess Board */}
              <Box
                sx={{
                  display: "inline-block",
                  border: "4px solid #f59e0b",
                  borderRadius: 2,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
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
                          onClick={() => handleSquareClick(rowIndex, colIndex)}
                          sx={{
                            width: 80,
                            height: 80,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "3.5rem",
                            cursor: "pointer",
                            backgroundColor: isLight ? "#f0d9b5" : "#b58863",
                            position: "relative",
                            transition: "all 0.2s",
                            border: highlighted
                              ? "4px solid #fbbf24"
                              : selected
                              ? "4px solid #3b82f6"
                              : "none",
                            boxShadow: selected
                              ? "inset 0 0 20px rgba(59,130,246,0.5)"
                              : highlighted
                              ? "inset 0 0 20px rgba(251,191,36,0.3)"
                              : "none",
                            "&:hover": {
                              filter: "brightness(1.1)",
                            },
                          }}
                        >
                          {piece && (
                            <span
                              style={{
                                color: isBlack ? "#000000" : "#FFFFFF",
                                textShadow: isBlack
                                  ? "0 0 3px rgba(255,255,255,0.5)"
                                  : "0 0 3px rgba(0,0,0,0.5)",
                                filter: isBlack
                                  ? "drop-shadow(1px 1px 1px rgba(0,0,0,0.5))"
                                  : "drop-shadow(1px 1px 1px rgba(255,255,255,0.5))",
                              }}
                            >
                              {PIECE_SYMBOLS[piece]}
                            </span>
                          )}
                          {highlighted && !piece && (
                            <Box
                              sx={{
                                position: "absolute",
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                backgroundColor: "#fbbf24",
                                opacity: 0.7,
                                boxShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>

              {/* Controls */}
              <Box mt={3} display="flex" gap={2} justifyContent="center">
                <Button
                  onClick={() => setShowHint(!showHint)}
                  variant="contained"
                  size="large"
                  startIcon={<Lightbulb />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: "bold",
                    boxShadow: "0 4px 15px rgba(251, 191, 36, 0.4)",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(251, 191, 36, 0.6)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                </Button>

                <Button
                  onClick={resetPuzzle}
                  variant="contained"
                  size="large"
                  startIcon={<RotateCcw />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #6b7280 0%, #4b5563 100%)",
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: "bold",
                    boxShadow: "0 4px 15px rgba(107, 114, 128, 0.4)",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #4b5563 0%, #374151 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(107, 114, 128, 0.6)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Làm lại
                </Button>

                <Button
                  onClick={nextPuzzle}
                  variant="contained"
                  size="large"
                  startIcon={<SkipForward />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: "bold",
                    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(239, 68, 68, 0.6)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Câu tiếp theo
                </Button>
              </Box>

              {/* Hint Display */}
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    sx={{
                      mt: 3,
                      backgroundColor: "rgba(251, 191, 36, 0.2)",
                      border: "2px solid #fbbf24",
                      boxShadow: "0 8px 32px rgba(251, 191, 36, 0.3)",
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Lightbulb size={20} color="#fbbf24" />
                        <Typography
                          color="white"
                          fontWeight="bold"
                          variant="h6"
                        >
                          Gợi ý
                        </Typography>
                      </Box>
                      <Typography color="#fbbf24" variant="body1">
                        {currentPuzzle.hint}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
