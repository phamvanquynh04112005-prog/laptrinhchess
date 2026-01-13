import { useState, useEffect, useRef, useCallback } from "react";
import {
  initializeBoard,
  getValidMoves,
  makeMove,
  getAIMove,
  isCheckmate,
  isInCheck,
  isStalemate,
  resetGameState,
} from "../../utils/chessLogic";
import {
  Box,
  Button,
  Typography,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Cpu,
  RotateCcw,
  Trophy,
  Zap,
  Target,
  Brain,
  Clock,
  Move,
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "../layout/Header";

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

const TIME_CONTROLS = [
  { label: "30 phút", value: 30 * 60 },
  { label: "10 phút", value: 10 * 60 },
  { label: "5 phút", value: 5 * 60 },
  { label: "3 phút", value: 3 * 60 },
];

export default function ChessBoard() {
  // Tạo gameId duy nhất cho mỗi phiên bản của ChessBoard
  const [gameId] = useState(
    `chess-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [difficulty, setDifficulty] = useState("medium");
  const [gameStatus, setGameStatus] = useState("playing");
  const [moveHistory, setMoveHistory] = useState([]);
  const [timeControl, setTimeControl] = useState(TIME_CONTROLS[1].value);
  const [whiteTime, setWhiteTime] = useState(TIME_CONTROLS[1].value);
  const [blackTime, setBlackTime] = useState(TIME_CONTROLS[1].value);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);

  const timerRef = useRef(null);

  // Khởi tạo game state với gameId cụ thể
  useEffect(() => {
    resetGameState(gameId);
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      !gameStarted ||
      gameStatus.includes("checkmate") ||
      gameStatus.includes("stalemate") ||
      gameStatus.includes("timeout")
    ) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (currentPlayer === "white") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            setGameStatus("timeout-black");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setGameStatus("timeout-white");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPlayer, gameStarted, gameStatus]);

  const checkGameStatus = useCallback(
    (boardState) => {
      if (isCheckmate(boardState, true, gameId)) {
        setGameStatus("checkmate-black");
        return true;
      }
      if (isCheckmate(boardState, false, gameId)) {
        setGameStatus("checkmate-white");
        return true;
      }
      if (
        isStalemate(boardState, true, gameId) ||
        isStalemate(boardState, false, gameId)
      ) {
        setGameStatus("stalemate");
        return true;
      }
      if (isInCheck(boardState, true)) {
        setGameStatus("check-white");
      } else if (isInCheck(boardState, false)) {
        setGameStatus("check-black");
      } else {
        setGameStatus("playing");
      }
      return false;
    },
    [gameId]
  );

  useEffect(() => {
    if (currentPlayer === "black" && gameStatus === "playing" && gameStarted) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board, difficulty, gameId);
        if (aiMove) {
          const newBoard = makeMove(
            board,
            aiMove.fromRow,
            aiMove.fromCol,
            aiMove.toRow,
            aiMove.toCol,
            gameId
          );
          setBoard(newBoard);
          setLastMove({
            from: { row: aiMove.fromRow, col: aiMove.fromCol },
            to: { row: aiMove.toRow, col: aiMove.toCol },
          });

          const isGameOver = checkGameStatus(newBoard);
          if (!isGameOver) {
            setCurrentPlayer("white");
          }

          const moveNotation = `${String.fromCharCode(97 + aiMove.fromCol)}${
            8 - aiMove.fromRow
          } → ${String.fromCharCode(97 + aiMove.toCol)}${8 - aiMove.toRow}`;
          setMoveHistory((prev) => [
            ...prev,
            {
              player: "AI",
              move: moveNotation,
              piece: board[aiMove.fromRow][aiMove.fromCol],
            },
          ]);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    currentPlayer,
    board,
    difficulty,
    gameStatus,
    gameStarted,
    gameId,
    checkGameStatus,
  ]);

  const handleSquareClick = (row, col) => {
    if (
      !gameStarted ||
      currentPlayer !== "white" ||
      gameStatus.includes("checkmate") ||
      gameStatus.includes("stalemate") ||
      gameStatus.includes("timeout")
    ) {
      return;
    }

    const piece = board[row][col];
    const isWhitePiece = piece && piece === piece.toUpperCase();

    if (!selectedSquare) {
      if (piece && isWhitePiece) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(board, row, col, gameId));
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
          gameId
        );
        setBoard(newBoard);
        setLastMove({
          from: { row: selectedSquare.row, col: selectedSquare.col },
          to: { row, col },
        });

        const isGameOver = checkGameStatus(newBoard);
        if (!isGameOver) {
          setCurrentPlayer("black");
        }

        const moveNotation = `${String.fromCharCode(97 + selectedSquare.col)}${
          8 - selectedSquare.row
        } → ${String.fromCharCode(97 + col)}${8 - row}`;
        setMoveHistory((prev) => [
          ...prev,
          {
            player: "You",
            move: moveNotation,
            piece: board[selectedSquare.row][selectedSquare.col],
          },
        ]);

        setSelectedSquare(null);
        setValidMoves([]);
      } else if (piece && isWhitePiece) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(board, row, col, gameId));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e, row, col) => {
    if (
      !gameStarted ||
      currentPlayer !== "white" ||
      gameStatus.includes("checkmate") ||
      gameStatus.includes("stalemate") ||
      gameStatus.includes("timeout")
    ) {
      e.preventDefault();
      return;
    }

    const piece = board[row][col];
    const isWhitePiece = piece && piece === piece.toUpperCase();

    if (!piece || !isWhitePiece) {
      e.preventDefault();
      return;
    }

    setDraggedPiece({ row, col });
    setSelectedSquare({ row, col });
    setValidMoves(getValidMoves(board, row, col, gameId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, row, col) => {
    e.preventDefault();
    if (!draggedPiece) return;

    const isValidMove = validMoves.some(([r, c]) => r === row && c === col);

    if (isValidMove) {
      const newBoard = makeMove(
        board,
        draggedPiece.row,
        draggedPiece.col,
        row,
        col,
        gameId
      );
      setBoard(newBoard);
      setLastMove({
        from: { row: draggedPiece.row, col: draggedPiece.col },
        to: { row, col },
      });

      const isGameOver = checkGameStatus(newBoard);
      if (!isGameOver) {
        setCurrentPlayer("black");
      }

      const moveNotation = `${String.fromCharCode(97 + draggedPiece.col)}${
        8 - draggedPiece.row
      } → ${String.fromCharCode(97 + col)}${8 - row}`;
      setMoveHistory((prev) => [
        ...prev,
        {
          player: "You",
          move: moveNotation,
          piece: board[draggedPiece.row][draggedPiece.col],
        },
      ]);
    }

    setDraggedPiece(null);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentPlayer("white");
    setGameStatus("playing");
    setMoveHistory([]);
    setWhiteTime(timeControl);
    setBlackTime(timeControl);
    setGameStarted(false);
    setLastMove(null);
    setDraggedPiece(null);
    resetGameState(gameId);
  };

  const startGame = () => {
    setWhiteTime(timeControl);
    setBlackTime(timeControl);
    setGameStarted(true);
    setGameStatus("playing");
  };

  const handleTimeControlChange = (value) => {
    setTimeControl(value);
    setWhiteTime(value);
    setBlackTime(value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isHighlighted = (row, col) =>
    validMoves.some(([r, c]) => r === row && c === col);
  const isSelected = (row, col) =>
    selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  const isLastMove = (row, col) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  const getDifficultyIcon = () => {
    switch (difficulty) {
      case "easy":
        return <Zap color="#10b981" />;
      case "medium":
        return <Target color="#f59e0b" />;
      case "hard":
        return <Brain color="#ef4444" />;
      default:
        return <Cpu />;
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return "#10b981";
      case "medium":
        return "#f59e0b";
      case "hard":
        return "#ef4444";
      default:
        return "#3b82f6";
    }
  };

  const getStatusMessage = () => {
    switch (gameStatus) {
      case "playing":
        return currentPlayer === "white"
          ? "Lượt của bạn ♔"
          : "AI đang suy nghĩ... 🤖";
      case "check-white":
        return "⚠️ Bạn đang bị chiếu!";
      case "check-black":
        return "⚠️ AI đang bị chiếu!";
      case "checkmate-white":
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Trophy color="#fbbf24" />
            Bạn thắng! Chiếu hết!
          </Box>
        );
      case "checkmate-black":
        return "💀 AI thắng! Chiếu hết!";
      case "stalemate":
        return "🤝 Hòa! Hết nước đi!";
      case "timeout-white":
        return "⏰ Hết giờ! AI thắng!";
      case "timeout-black":
        return "⏰ Hết giờ! Bạn thắng!";
      default:
        return "Chơi cờ với AI";
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
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
          <Box textAlign="center" mb={4}>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mb={2}
            >
              <Cpu size={48} color="#60a5fa" />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Chơi với AI
              </Typography>
            </Box>
            <Typography variant="h6" color="#cbd5e1">
              Thử thách trí tuệ với AI cờ vua thông minh
            </Typography>
          </Box>

          <Box display="flex" gap={4} justifyContent="center" flexWrap="wrap">
            {/* Left Panel */}
            <Box
              sx={{
                width: 320,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* Time Control */}
              <Box
                sx={{
                  backgroundColor: "rgba(30, 58, 138, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 3,
                  border: "2px solid rgba(96, 165, 250, 0.3)",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Clock size={20} color="#60a5fa" />
                  <Typography variant="h6" color="white" fontWeight="bold">
                    Thời Gian
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    background:
                      currentPlayer === "white"
                        ? "linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(59, 130, 246, 0.2))"
                        : "rgba(30, 41, 59, 0.5)",
                    border:
                      currentPlayer === "white"
                        ? "2px solid #60a5fa"
                        : "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Typography color="#cbd5e1" fontSize="0.9rem">
                    Bạn (Trắng)
                  </Typography>
                  <Typography
                    variant="h4"
                    color="white"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {formatTime(whiteTime)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background:
                      currentPlayer === "black"
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2))"
                        : "rgba(30, 41, 59, 0.5)",
                    border:
                      currentPlayer === "black"
                        ? "2px solid #ef4444"
                        : "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Typography color="#cbd5e1" fontSize="0.9rem">
                    AI (Đen)
                  </Typography>
                  <Typography
                    variant="h4"
                    color="white"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {formatTime(blackTime)}
                  </Typography>
                </Box>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel sx={{ color: "white" }}>Thời gian</InputLabel>
                  <Select
                    value={timeControl}
                    onChange={(e) => handleTimeControlChange(e.target.value)}
                    disabled={gameStarted}
                    sx={{
                      color: "white",
                      backgroundColor: "rgba(30, 58, 138, 0.5)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#60a5fa",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#3b82f6",
                      },
                    }}
                  >
                    {TIME_CONTROLS.map((control) => (
                      <MenuItem key={control.value} value={control.value}>
                        {control.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Difficulty */}
              <Box
                sx={{
                  backgroundColor: "rgba(30, 58, 138, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 3,
                  border: "2px solid rgba(96, 165, 250, 0.3)",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  {getDifficultyIcon()}
                  <Typography variant="h6" color="white" fontWeight="bold">
                    Độ Khó
                  </Typography>
                </Box>
                <FormControl fullWidth>
                  <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    disabled={gameStarted}
                    sx={{
                      color: "white",
                      backgroundColor: "rgba(30, 58, 138, 0.5)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: getDifficultyColor(),
                      },
                    }}
                  >
                    <MenuItem value="easy">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Zap size={16} color="#10b981" />
                        <Typography color="white">Dễ</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="medium">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Target size={16} color="#f59e0b" />
                        <Typography color="white">Trung bình</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="hard">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Brain size={16} color="#ef4444" />
                        <Typography color="white">Khó</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Controls */}
              <Box
                sx={{
                  backgroundColor: "rgba(30, 58, 138, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 3,
                  border: "2px solid rgba(96, 165, 250, 0.3)",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
                }}
              >
                <Typography variant="h6" color="white" fontWeight="bold" mb={2}>
                  Điều Khiển
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {!gameStarted && (
                    <Button
                      onClick={startGame}
                      variant="contained"
                      fullWidth
                      sx={{
                        background:
                          "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                        py: 1.5,
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                        "&:hover": {
                          background:
                            "linear-gradient(90deg, #059669 0%, #047857 100%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 20px rgba(16, 185, 129, 0.6)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Bắt đầu ván cờ
                    </Button>
                  )}
                  <Button
                    onClick={resetGame}
                    variant="contained"
                    fullWidth
                    startIcon={<RotateCcw />}
                    sx={{
                      background:
                        "linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)",
                      py: 1.5,
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
                      "&:hover": {
                        background:
                          "linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(139, 92, 246, 0.6)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Ván mới
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Game Board */}
            <Box>
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "rgba(30, 58, 138, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(96, 165, 250, 0.3)",
                  textAlign: "center",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
                }}
              >
                <Typography variant="h5" color="white" fontWeight="bold">
                  {getStatusMessage()}
                </Typography>
                {gameStatus.includes("check") &&
                  !gameStatus.includes("checkmate") && (
                    <Typography variant="body2" color="#fbbf24" mt={1}>
                      ⚠️ Chỉ chiếu! Phải chiếu hết mới thắng!
                    </Typography>
                  )}
              </Box>

              <Box
                sx={{
                  display: "inline-block",
                  border: `4px solid ${getDifficultyColor()}`,
                  borderRadius: 3,
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
                      const isLastMoveSquare = isLastMove(rowIndex, colIndex);

                      return (
                        <Box
                          key={colIndex}
                          onClick={() => handleSquareClick(rowIndex, colIndex)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                          sx={{
                            width: 80,
                            height: 80,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "3.5rem",
                            cursor:
                              gameStarted && currentPlayer === "white"
                                ? "pointer"
                                : "default",
                            backgroundColor: isLight ? "#f0d9b5" : "#b58863",
                            position: "relative",
                            transition: "all 0.3s ease",
                            border: highlighted
                              ? "4px solid #10b981"
                              : selected
                              ? "4px solid #60a5fa"
                              : isLastMoveSquare
                              ? "4px solid #f59e0b"
                              : "none",
                            boxShadow: selected
                              ? "inset 0 0 20px rgba(96, 165, 250, 0.6)"
                              : isLastMoveSquare
                              ? "inset 0 0 20px rgba(245, 158, 11, 0.4)"
                              : "none",
                            "&:hover": {
                              filter:
                                gameStarted && currentPlayer === "white"
                                  ? "brightness(1.15)"
                                  : "none",
                              transform:
                                gameStarted && currentPlayer === "white"
                                  ? "scale(1.02)"
                                  : "none",
                            },
                          }}
                        >
                          {piece && (
                            <span
                              draggable={
                                gameStarted &&
                                currentPlayer === "white" &&
                                piece === piece.toUpperCase()
                              }
                              onDragStart={(e) =>
                                handleDragStart(e, rowIndex, colIndex)
                              }
                              onDragEnd={handleDragEnd}
                              style={{
                                color: isBlack ? "#000000" : "#FFFFFF",
                                textShadow: isBlack
                                  ? "0 0 4px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.5)"
                                  : "0 0 4px rgba(0,0,0,0.7), 0 2px 4px rgba(255,255,255,0.3)",
                                filter: isBlack
                                  ? "drop-shadow(2px 2px 2px rgba(0,0,0,0.6))"
                                  : "drop-shadow(2px 2px 2px rgba(255,255,255,0.4))",
                                cursor:
                                  gameStarted &&
                                  currentPlayer === "white" &&
                                  piece === piece.toUpperCase()
                                    ? "grab"
                                    : "default",
                              }}
                            >
                              {PIECE_SYMBOLS[piece]}
                            </span>
                          )}
                          {highlighted && !piece && (
                            <Box
                              sx={{
                                position: "absolute",
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                backgroundColor: "#10b981",
                                opacity: 0.7,
                                boxShadow: "0 0 10px rgba(16, 185, 129, 0.8)",
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "rgba(30, 58, 138, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "2px solid rgba(96, 165, 250, 0.3)",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
                }}
              >
                <Typography color="#cbd5e1" textAlign="center">
                  {!gameStarted
                    ? "Nhấn 'Bắt đầu ván cờ' để bắt đầu"
                    : currentPlayer === "white"
                    ? "Lượt của bạn. Click hoặc kéo thả quân cờ để di chuyển"
                    : "Đang chờ AI đi..."}
                </Typography>
                {gameStarted && currentPlayer === "white" && (
                  <Typography
                    variant="body2"
                    color="#10b981"
                    textAlign="center"
                    mt={1}
                  >
                    💡 Bạn có thể click chọn rồi click đích, hoặc kéo thả trực
                    tiếp
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Move History */}
            <Box
              sx={{
                width: 320,
                backgroundColor: "rgba(30, 58, 138, 0.6)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(96, 165, 250, 0.3)",
                borderRadius: 3,
                p: 3,
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Move size={20} color="#60a5fa" />
                <Typography variant="h5" color="white" fontWeight="bold">
                  Lịch sử nước đi
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 550,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: 8 },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: 4,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(96, 165, 250, 0.5)",
                    borderRadius: 4,
                    "&:hover": { backgroundColor: "rgba(96, 165, 250, 0.7)" },
                  },
                }}
              >
                {moveHistory.length === 0 ? (
                  <Typography
                    color="#cbd5e1"
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
                          borderRadius: 2,
                          backgroundColor:
                            item.player === "You"
                              ? "rgba(96, 165, 250, 0.25)"
                              : "rgba(239, 68, 68, 0.25)",
                          borderLeft:
                            item.player === "You"
                              ? "4px solid #60a5fa"
                              : "4px solid #ef4444",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translateX(4px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                          },
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
                          <Typography color="#cbd5e1" fontSize="0.85rem">
                            #{index + 1}
                          </Typography>
                        </Box>
                        <Typography
                          color="white"
                          fontFamily="monospace"
                          fontSize="1.1rem"
                        >
                          {item.piece && PIECE_SYMBOLS[item.piece]} {item.move}
                          {item.move.includes("→ c1") ||
                          item.move.includes("→ g1") ||
                          item.move.includes("→ c8") ||
                          item.move.includes("→ g8")
                            ? " 🏰"
                            : ""}
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
      {(gameStatus.includes("checkmate") ||
        gameStatus.includes("stalemate") ||
        gameStatus.includes("timeout")) && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <Box
              sx={{
                background:
                  gameStatus === "checkmate-white" ||
                  gameStatus === "timeout-black"
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : gameStatus === "checkmate-black" ||
                      gameStatus === "timeout-white"
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                p: 6,
                borderRadius: 4,
                textAlign: "center",
                maxWidth: 500,
                boxShadow: "0 25px 70px rgba(0,0,0,0.6)",
                border: "3px solid rgba(255,255,255,0.2)",
              }}
            >
              <Trophy
                size={90}
                color="#fbbf24"
                style={{
                  marginBottom: 20,
                  filter: "drop-shadow(0 4px 8px rgba(251, 191, 36, 0.5))",
                }}
              />
              <Typography
                variant="h3"
                color="white"
                fontWeight="bold"
                mb={2}
                sx={{ textShadow: "0 4px 10px rgba(0,0,0,0.3)" }}
              >
                {gameStatus === "checkmate-white" ||
                gameStatus === "timeout-black"
                  ? "🎉 Bạn thắng!"
                  : gameStatus === "checkmate-black" ||
                    gameStatus === "timeout-white"
                  ? "💀 AI thắng!"
                  : "🤝 Hòa!"}
              </Typography>
              <Typography
                variant="h6"
                color="white"
                mb={4}
                sx={{ opacity: 0.95 }}
              >
                {gameStatus === "checkmate-white"
                  ? "Tuyệt vời! Bạn đã chiếu hết AI!"
                  : gameStatus === "checkmate-black"
                  ? "AI đã chiếu hết. Hãy thử lại!"
                  : gameStatus === "timeout-white"
                  ? "AI hết thời gian! Bạn thắng!"
                  : gameStatus === "timeout-black"
                  ? "Bạn hết thời gian! AI thắng!"
                  : "Hết nước đi! Ván cờ hòa!"}
              </Typography>
              <Button
                onClick={resetGame}
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "white",
                  color:
                    gameStatus === "checkmate-white" ||
                    gameStatus === "timeout-black"
                      ? "#10b981"
                      : gameStatus === "checkmate-black" ||
                        gameStatus === "timeout-white"
                      ? "#ef4444"
                      : "#f59e0b",
                  px: 5,
                  py: 2,
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                    transform: "scale(1.05)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
                  },
                  transition: "all 0.3s ease",
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
