import { useState } from "react";
import {
  initializeBoard,
  getValidMoves,
  makeMove,
  isBlackPiece,
  isWhitePiece,
  isInCheck,
  isCheckmate,
  isStalemate,
  resetGameState,
} from "../utils/chessLogic";
import { Box, Button, Typography, Container } from "@mui/material";
import { Users, RotateCcw, Trophy, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";

// Mapping quân cờ sang Unicode symbols
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

export default function LocalMultiplayerPage() {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [gameStatus, setGameStatus] = useState("playing");
  const [moveHistory, setMoveHistory] = useState([]);

  const handleSquareClick = (row, col) => {
    if (gameStatus.includes("checkmate") || gameStatus.includes("stalemate"))
      return;

    const piece = board[row][col];
    const isWhiteTurn = currentPlayer === "white";

    if (!selectedSquare) {
      // Chọn quân cờ của người chơi hiện tại
      if (
        piece &&
        ((isWhiteTurn && isWhitePiece(piece)) ||
          (!isWhiteTurn && isBlackPiece(piece)))
      ) {
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

        // Ghi lại lịch sử
        const moveNotation = `${String.fromCharCode(97 + selectedSquare.col)}${
          8 - selectedSquare.row
        } → ${String.fromCharCode(97 + col)}${8 - row}`;
        setMoveHistory((prev) => [
          ...prev,
          {
            player: currentPlayer === "white" ? "White" : "Black",
            move: moveNotation,
            piece: board[selectedSquare.row][selectedSquare.col],
          },
        ]);

        // Kiểm tra checkmate hoặc hòa
        const nextPlayer = currentPlayer === "white" ? "black" : "white";
        const nextIsWhite = nextPlayer === "white";

        if (isCheckmate(newBoard, nextIsWhite)) {
          setGameStatus(`checkmate-${currentPlayer}`);
        } else if (isStalemate(newBoard, nextIsWhite)) {
          setGameStatus("stalemate");
        } else if (isInCheck(newBoard, nextIsWhite)) {
          setGameStatus(`check-${nextPlayer}`);
        } else {
          setGameStatus("playing");
        }

        setCurrentPlayer(nextPlayer);
        setSelectedSquare(null);
        setValidMoves([]);
      } else if (
        piece &&
        ((isWhiteTurn && isWhitePiece(piece)) ||
          (!isWhiteTurn && isBlackPiece(piece)))
      ) {
        // Chọn quân khác
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(board, row, col));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentPlayer("white");
    setGameStatus("playing");
    setMoveHistory([]);
    resetGameState();
  };

  const isHighlighted = (row, col) => {
    return validMoves.some(([r, c]) => r === row && c === col);
  };

  const isSelected = (row, col) => {
    return (
      selectedSquare && selectedSquare.row === row && selectedSquare.col === col
    );
  };

  const getStatusMessage = () => {
    switch (gameStatus) {
      case "playing":
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            {currentPlayer === "white" ? (
              <Shield color="#fff" />
            ) : (
              <Shield color="#000" />
            )}
            Lượt: {currentPlayer === "white" ? "Trắng ♔" : "Đen ♚"}
          </Box>
        );
      case "check-white":
        return "⚠️ Trắng đang bị chiếu!";
      case "check-black":
        return "⚠️ Đen đang bị chiếu!";
      case "checkmate-white":
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Trophy color="#fbbf24" />
            Trắng thắng! Chiếu hết!
          </Box>
        );
      case "checkmate-black":
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Trophy color="#fbbf24" />
            Đen thắng! Chiếu hết!
          </Box>
        );
      case "stalemate":
        return "🤝 Hòa! Hết nước đi!";
      default:
        return "";
    }
  };

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
              <Users size={48} color="#10b981" />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(90deg, #10b981 0%, #3b82f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Chế Độ 2 Người Chơi
              </Typography>
            </Box>
            <Typography variant="h6" color="#94a3b8">
              Chơi cùng bạn bè trên cùng một thiết bị
            </Typography>
          </Box>

          <Box display="flex" gap={4} justifyContent="center" flexWrap="wrap">
            {/* Game Board */}
            <Box>
              {/* Game Status */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  textAlign: "center",
                }}
              >
                <Typography variant="h5" color="white" fontWeight="bold">
                  {getStatusMessage()}
                </Typography>
              </Box>

              {/* Chess Board */}
              <Box
                sx={{
                  display: "inline-block",
                  border: "4px solid #10b981",
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
                                opacity: 0.5,
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
              <Box mt={3} display="flex" justifyContent="center">
                <Button
                  onClick={resetGame}
                  variant="contained"
                  size="large"
                  startIcon={<RotateCcw />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #059669 0%, #047857 100%)",
                    },
                  }}
                >
                  Ván mới
                </Button>
              </Box>
            </Box>

            {/* Move History */}
            <Box
              sx={{
                width: 320,
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 2,
                p: 3,
              }}
            >
              <Typography variant="h5" color="white" fontWeight="bold" mb={2}>
                📜 Lịch sử nước đi
              </Typography>

              <Box
                sx={{
                  height: 550,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    width: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: 4,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                    borderRadius: 4,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.5)",
                    },
                  },
                }}
              >
                {moveHistory.length === 0 ? (
                  <Typography
                    color="#94a3b8"
                    textAlign="center"
                    mt={4}
                    fontStyle="italic"
                  >
                    Chưa có nước đi nào
                  </Typography>
                ) : (
                  <Box>
                    {moveHistory.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          mb: 1.5,
                          borderRadius: 1,
                          backgroundColor:
                            item.player === "White"
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(16, 185, 129, 0.2)",
                          borderLeft:
                            item.player === "White"
                              ? "4px solid #3b82f6"
                              : "4px solid #10b981",
                        }}
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={0.5}
                        >
                          <Typography color="white" fontWeight="bold">
                            {item.player}
                          </Typography>
                          <Typography color="#94a3b8" fontSize="0.85rem">
                            #{index + 1}
                          </Typography>
                        </Box>
                        <Typography
                          color="white"
                          fontFamily="monospace"
                          fontSize="1.1rem"
                        >
                          {PIECE_SYMBOLS[item.piece]} {item.move}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Container>

      {/* Game Over Modal */}
      {(gameStatus.includes("checkmate") || gameStatus === "stalemate") && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                background:
                  gameStatus === "stalemate"
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                p: 6,
                borderRadius: 3,
                textAlign: "center",
                maxWidth: 500,
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <Trophy size={80} color="#fbbf24" style={{ marginBottom: 16 }} />
              <Typography variant="h3" color="white" fontWeight="bold" mb={2}>
                {gameStatus === "checkmate-white"
                  ? "🎉 Trắng Thắng!"
                  : gameStatus === "checkmate-black"
                  ? "🎉 Đen Thắng!"
                  : "🤝 Hòa!"}
              </Typography>
              <Typography variant="h6" color="white" mb={4}>
                {gameStatus === "checkmate-white"
                  ? "Chiếu hết! Trắng thắng!"
                  : gameStatus === "checkmate-black"
                  ? "Chiếu hết! Đen thắng!"
                  : "Hết nước đi! Ván cờ hòa!"}
              </Typography>
              <Button
                onClick={resetGame}
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "white",
                  color: gameStatus === "stalemate" ? "#f59e0b" : "#10b981",
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                  },
                }}
              >
                Chơi lại
              </Button>
            </Box>
          </motion.div>
        </Box>
      )}
    </Box>
  );
}
