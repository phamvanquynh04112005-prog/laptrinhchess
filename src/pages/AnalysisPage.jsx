import { useState } from "react";
import {
  initializeBoard,
  evaluateBoard,
  getValidMoves,
  makeMove,
  minimax,
  resetGameState,
} from "../utils/chessLogic";
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
  LinearProgress,
} from "@mui/material";
import { BarChart as BarChartIcon, RotateCcw, Search } from "lucide-react";
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

export default function AnalysisPage() {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [evaluation, setEvaluation] = useState(0);
  const [bestMove, setBestMove] = useState(null);
  const [analysisDepth, setAnalysisDepth] = useState(3);

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];

    if (!selectedSquare) {
      if (piece) {
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
        analyzePosition(newBoard);
      }

      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const analyzePosition = (currentBoard) => {
    const eval_score = evaluateBoard(currentBoard);
    setEvaluation(eval_score);

    const result = minimax(
      currentBoard,
      0,
      -Infinity,
      Infinity,
      eval_score > 0,
      analysisDepth
    );
    setBestMove(result.move);
  };

  const resetBoard = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setEvaluation(0);
    setBestMove(null);
    resetGameState();
  };

  const isHighlighted = (row, col) =>
    validMoves.some(([r, c]) => r === row && c === col);
  const isSelected = (row, col) =>
    selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  const isBestMove = (row, col) =>
    bestMove && bestMove.toRow === row && bestMove.toCol === col;

  const evaluationPercent = Math.min(Math.abs(evaluation) / 50, 100);

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
              <BarChartIcon size={48} color="#8b5cf6" />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Phân Tích Thế Cờ
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={4} justifyContent="center" flexWrap="wrap">
            <Box>
              <Box
                sx={{
                  display: "inline-block",
                  border: "4px solid #8b5cf6",
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
                      const bestMoveSquare = isBestMove(rowIndex, colIndex);
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
                            backgroundColor: isLight ? "#e0e7ff" : "#4c1d95",
                            border: highlighted
                              ? "4px solid #10b981"
                              : selected
                              ? "4px solid #fbbf24"
                              : bestMoveSquare
                              ? "4px solid #ef4444"
                              : "none",
                            animation: bestMoveSquare
                              ? "pulse 1.5s infinite"
                              : "none",
                            "&:hover": { filter: "brightness(1.1)" },
                          }}
                        >
                          {piece && (
                            <span
                              style={{
                                color: isBlack ? "#000" : "#FFF",
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
                                position: "absolute",
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

              <Box mt={3} display="flex" gap={2} justifyContent="center">
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel sx={{ color: "white" }}>Độ sâu</InputLabel>
                  <Select
                    value={analysisDepth}
                    onChange={(e) => setAnalysisDepth(e.target.value)}
                    sx={{
                      color: "white",
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#8b5cf6",
                      },
                    }}
                  >
                    <MenuItem value={1}>Độ sâu 1</MenuItem>
                    <MenuItem value={2}>Độ sâu 2</MenuItem>
                    <MenuItem value={3}>Độ sâu 3</MenuItem>
                    <MenuItem value={4}>Độ sâu 4</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ width: 350 }}>
              <Card
                sx={{
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid #8b5cf6",
                  mb: 3,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h5"
                    color="white"
                    fontWeight="bold"
                    mb={2}
                  >
                    📊 Đánh giá thế cờ
                  </Typography>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography color="#94a3b8">Điểm:</Typography>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={
                        evaluation > 0
                          ? "#10b981"
                          : evaluation < 0
                          ? "#ef4444"
                          : "#94a3b8"
                      }
                    >
                      {evaluation > 0 ? "+" : ""}
                      {(evaluation / 100).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      position: "relative",
                      height: 24,
                      backgroundColor: "#374151",
                      borderRadius: 2,
                      overflow: "hidden",
                      mb: 3,
                    }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={evaluationPercent}
                      sx={{
                        height: "100%",
                        backgroundColor: "transparent",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor:
                            evaluation > 0 ? "#10b981" : "#ef4444",
                        },
                      }}
                    />
                  </Box>

                  {bestMove && (
                    <Card
                      sx={{
                        backgroundColor: "rgba(239, 68, 68, 0.2)",
                        border: "2px solid #ef4444",
                      }}
                    >
                      <CardContent>
                        <Typography color="white" fontWeight="bold">
                          🎯 Nước đi tốt nhất:
                        </Typography>
                        <Typography
                          color="white"
                          fontFamily="monospace"
                          fontSize="1.1rem"
                        >
                          {String.fromCharCode(97 + bestMove.fromCol)}
                          {8 - bestMove.fromRow} →{" "}
                          {String.fromCharCode(97 + bestMove.toCol)}
                          {8 - bestMove.toRow}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  onClick={() => analyzePosition(board)}
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<Search />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)",
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                  }}
                >
                  Phân tích
                </Button>

                <Button
                  onClick={resetBoard}
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<RotateCcw />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #6b7280 0%, #4b5563 100%)",
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                  }}
                >
                  Bàn cờ mới
                </Button>
              </Box>

              <Card
                sx={{
                  mt: 3,
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight="bold"
                    mb={1}
                  >
                    ℹ️ Hướng dẫn
                  </Typography>
                  <Box component="ul" sx={{ color: "#94a3b8", pl: 2 }}>
                    <li>Click chọn quân cờ</li>
                    <li>Click ô highlight để di chuyển</li>
                    <li>Click "Phân tích" để xem nước đi tốt nhất</li>
                    <li>Highlight đỏ = nước đi tốt nhất của AI</li>
                    <li>Chọn độ sâu phân tích từ dropdown</li>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
