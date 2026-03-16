// frontend/src/pages/OnlineGamePage.jsx - FIXED
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { Flag, X } from "lucide-react";
import Header from "../components/layout/Header";
import {
  getValidMoves,
  makeMove,
  isCheckmate,
  isStalemate,
} from "../utils/chessLogic";
import { getSocketBaseUrl } from "../utils/runtimeConfig";

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

const getSocketUrl = () => getSocketBaseUrl();

const OnlineGamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);
  const [board, setBoard] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const timerRef = useRef(null);
  const loadRetryRef = useRef(0);
  const loadTimeoutRef = useRef(null);

  // New states
  const [showResignDialog, setShowResignDialog] = useState(false);
  const [showDrawOfferDialog, setShowDrawOfferDialog] = useState(false);
  const [drawOfferedByMe, setDrawOfferedByMe] = useState(false);
  const [drawOfferedByOpponent, setDrawOfferedByOpponent] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [loadingError, setLoadingError] = useState(null);
  const [endDialog, setEndDialog] = useState({
    open: false,
    title: "",
    message: "",
  });
  const endHandledRef = useRef(false);

  const LOAD_RETRY_MS = 1000;
  const MAX_LOAD_RETRIES = 10;

  const clearLoadRetry = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const buildEndMessage = useCallback(
    ({ result, winnerId, resignedBy }) => {
      if (result === "resignation") {
        const iResigned =
          resignedBy !== undefined
            ? resignedBy === user?.id
            : winnerId !== user?.id;
        return iResigned ? "Bạn đã đầu hàng." : "Đối thủ đã đầu hàng.";
      }
      if (result === "draw") {
        return "Trận đấu hòa.";
      }
      if (result === "timeout") {
        return winnerId === user?.id
          ? "Bạn thắng do đối thủ hết thời gian."
          : "Bạn thua do hết thời gian.";
      }
      if (result === "checkmate") {
        return winnerId === user?.id
          ? "Bạn thắng do chiếu bí!"
          : "Bạn thua do bị chiếu bí.";
      }
      return winnerId === user?.id ? "Bạn thắng!" : "Bạn thua!";
    },
    [user?.id],
  );

  const openEndDialog = useCallback(
    ({ result, winnerId, resignedBy, force = false }) => {
      if (endHandledRef.current && !force) return;
      endHandledRef.current = true;

      const title =
        result === "draw"
          ? "Kết quả: Hòa"
          : winnerId === user?.id
            ? "Kết quả: Thắng"
            : "Kết quả: Thua";

      setEndDialog({
        open: true,
        title,
        message: buildEndMessage({ result, winnerId, resignedBy }),
      });

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
    [buildEndMessage, user?.id],
  );

  const loadGame = useCallback(async () => {
    try {
      clearLoadRetry();
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getSocketUrl()}/api/matchmaking/games/${gameId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const message =
          response.status === 404
            ? "Game chưa sẵn sàng, đang thử lại..."
            : `Lỗi tải game (HTTP ${response.status})`;
        setLoadingError(message);
        throw new Error(message);
      }

      const data = await response.json();

      if (data.success && data.game) {
        setGame(data.game);
        setBoard(fenToBoard(data.game.fen_position));
        setWhiteTime(data.game.white_time);
        setBlackTime(data.game.black_time);
        setLoadingError(null);
        loadRetryRef.current = 0;
        clearLoadRetry();
        if (data.game.status === "finished") {
          openEndDialog({
            result: data.game.result,
            winnerId: data.game.winner_id,
            force: true,
          });
        }
        return;
      }

      setLoadingError("Không nhận được thông tin game, đang thử lại...");
      throw new Error("Game data missing");
    } catch (error) {
      console.error("Load game error:", error);

      if (loadRetryRef.current < MAX_LOAD_RETRIES) {
        loadRetryRef.current += 1;
        clearLoadRetry();
        loadTimeoutRef.current = setTimeout(() => {
          loadGame();
        }, LOAD_RETRY_MS);
      }
    }
  }, [gameId, clearLoadRetry, openEndDialog]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const socketInstance = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        socketInstance.emit("authenticate", parsedUser.id);
        console.log("Authenticated as user:", parsedUser.id);
      }
      loadGame();
    });

    socketInstance.on("opponent-move", ({ move, newFen }) => {
      console.log("Opponent move received:", move);
      const updatedBoard = fenToBoard(newFen);
      setBoard(updatedBoard);
      setGame((prev) => {
        const nextTurn = prev.current_turn === "white" ? "black" : "white";
        const isWhiteToMove = nextTurn === "white";
        let nextStatus = prev.status;
        let nextResult = prev.result;
        let nextWinnerId = prev.winner_id;

        if (prev.status === "ongoing") {
          if (isCheckmate(updatedBoard, isWhiteToMove, prev.id)) {
            const winnerId =
              prev.white_player_id === user?.id
                ? prev.black_player_id
                : prev.white_player_id;
            socketInstance.emit("end-game", {
              gameId: prev.id,
              result: "checkmate",
              winnerId,
            });
            openEndDialog({ result: "checkmate", winnerId });
            nextStatus = "finished";
            nextResult = "checkmate";
            nextWinnerId = winnerId;
          } else if (isStalemate(updatedBoard, isWhiteToMove, prev.id)) {
            socketInstance.emit("end-game", {
              gameId: prev.id,
              result: "draw",
              winnerId: null,
            });
            openEndDialog({ result: "draw", winnerId: null });
            nextStatus = "finished";
            nextResult = "draw";
            nextWinnerId = null;
          }
        }

        return {
          ...prev,
          current_turn: nextTurn,
          fen_position: newFen,
          status: nextStatus,
          result: nextResult,
          winner_id: nextWinnerId,
        };
      });
      loadGame();
    });

    socketInstance.on("draw-offered", ({ offeredBy }) => {
      console.log("Draw offered by opponent:", offeredBy);
      setDrawOfferedByOpponent(true);
      setSnackbar({
        open: true,
        message: "Đối thủ đề nghị hòa!",
        severity: "info",
      });
    });

    socketInstance.on("draw-declined", () => {
      console.log("Draw offer declined");
      setDrawOfferedByMe(false);
      setSnackbar({
        open: true,
        message: "Đối thủ từ chối hòa",
        severity: "warning",
      });
    });

    socketInstance.on("draw-offer-sent", () => {
      setDrawOfferedByMe(true);
      setSnackbar({
        open: true,
        message: "Đã gửi đề nghị hòa",
        severity: "success",
      });
    });

    socketInstance.on("game-ended", ({ result, winnerId, resignedBy }) => {
      console.log("Game ended:", result);
      endHandledRef.current = false;
      setGame((prev) =>
        prev
          ? { ...prev, status: "finished", result, winner_id: winnerId }
          : prev,
      );
      openEndDialog({ result, winnerId, resignedBy, force: true });
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameId, navigate, loadGame, openEndDialog, user?.id]);

  useEffect(() => {
    if (!gameId) return;
    endHandledRef.current = false;
    setEndDialog({ open: false, title: "", message: "" });
    loadRetryRef.current = 0;
    loadGame();

    return () => {
      clearLoadRetry();
    };
  }, [gameId, loadGame, clearLoadRetry]);

  // Timer effect
  useEffect(() => {
    if (!game || game.status !== "ongoing") return;

    const isMyTurn =
      (game.current_turn === "white" && game.white_player_id === user?.id) ||
      (game.current_turn === "black" && game.black_player_id === user?.id);

    if (isMyTurn) {
      timerRef.current = setInterval(() => {
        if (game.current_turn === "white") {
          setWhiteTime((prev) => {
            if (prev <= 1) {
              if (socket) {
                socket.emit("end-game", {
                  gameId: game.id,
                  result: "timeout",
                  winnerId: game.black_player_id,
                });
              }
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              if (socket) {
                socket.emit("end-game", {
                  gameId: game.id,
                  result: "timeout",
                  winnerId: game.white_player_id,
                });
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [game?.current_turn, game?.status, user?.id, socket, game]);

  // Fallback sync: ensure both sides see game end even if socket event is missed
  useEffect(() => {
    if (!game || game.status !== "ongoing") return;

    const intervalId = setInterval(() => {
      loadGame();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [game?.status, loadGame, game]);

  const fenToBoard = (fen) => {
    if (!fen) return initializeBoard();
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

  const initializeBoard = () => {
    return [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];
  };

  const handleSquareClick = (row, col) => {
    if (!game || !user || game.status !== "ongoing") return;

    const isMyTurn =
      (game.current_turn === "white" && game.white_player_id === user.id) ||
      (game.current_turn === "black" && game.black_player_id === user.id);

    if (!isMyTurn) return;

    const piece = board[row][col];

    if (!selectedSquare) {
      if (piece) {
        const isWhitePiece = piece === piece.toUpperCase();
        const isMyPiece =
          (isWhitePiece && game.white_player_id === user.id) ||
          (!isWhitePiece && game.black_player_id === user.id);

        if (isMyPiece) {
          setSelectedSquare({ row, col });
          const validMoves = getValidMoves(board, row, col, game.id);
          setValidMoves(validMoves);
        }
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
          game.id,
        );
        const fromSquare = `${String.fromCharCode(97 + selectedSquare.col)}${
          8 - selectedSquare.row
        }`;
        const toSquare = `${String.fromCharCode(97 + col)}${8 - row}`;
        const moveNotation = `${fromSquare}-${toSquare}`;
        const newFen = boardToFen(newBoard);
        const currentTime =
          game.current_turn === "white" ? whiteTime : blackTime;

        if (socket) {
          socket.emit("make-move", {
            gameId: game.id,
            userId: user.id,
            move: moveNotation,
            newFen,
            timeRemaining: currentTime,
          });
        }

        setBoard(newBoard);
        setSelectedSquare(null);
        setValidMoves([]);
        const newTurn = game.current_turn === "white" ? "black" : "white";
        setGame((prev) => ({ ...prev, current_turn: newTurn }));

        const isWhiteToMove = newTurn === "white";
        if (game.status === "ongoing") {
          if (isCheckmate(newBoard, isWhiteToMove, game.id)) {
            socket?.emit("end-game", {
              gameId: game.id,
              result: "checkmate",
              winnerId: user.id,
            });
            openEndDialog({ result: "checkmate", winnerId: user.id });
            setGame((prev) =>
              prev
                ? {
                    ...prev,
                    status: "finished",
                    result: "checkmate",
                    winner_id: user.id,
                  }
                : prev,
            );
          } else if (isStalemate(newBoard, isWhiteToMove, game.id)) {
            socket?.emit("end-game", {
              gameId: game.id,
              result: "draw",
              winnerId: null,
            });
            openEndDialog({ result: "draw", winnerId: null });
            setGame((prev) =>
              prev ? { ...prev, status: "finished", result: "draw" } : prev,
            );
          }
        }
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };

  const boardToFen = (board) => {
    let fen = "";
    for (let row of board) {
      let emptyCount = 0;
      for (let piece of row) {
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += piece;
        }
      }
      if (emptyCount > 0) fen += emptyCount;
      fen += "/";
    }
    return fen.slice(0, -1) + " w KQkq - 0 1";
  };

  const handleResign = () => {
    if (socket && user && game) {
      socket.emit("resign", { gameId: game.id, userId: user.id });
      setShowResignDialog(false);
      setSnackbar({
        open: true,
        message: "Đang xử lý đầu hàng...",
        severity: "info",
      });
    }
  };

  const handleOfferDraw = () => {
    if (socket && user && game) {
      socket.emit("offer-draw", { gameId: game.id, userId: user.id });
      setShowDrawOfferDialog(false);
    }
  };

  const handleAcceptDraw = () => {
    if (socket && user && game) {
      socket.emit("accept-draw", { gameId: game.id, userId: user.id });
      setDrawOfferedByOpponent(false);
      setSnackbar({
        open: true,
        message: "Đang xử lý kết quả hòa...",
        severity: "info",
      });
    }
  };

  const handleDeclineDraw = () => {
    if (socket && user && game) {
      socket.emit("decline-draw", { gameId: game.id, userId: user.id });
      setDrawOfferedByOpponent(false);
    }
  };

  const handlePlayAgain = () => {
    setEndDialog((prev) => ({ ...prev, open: false }));
    navigate("/online");
  };

  const handleExit = () => {
    setEndDialog((prev) => ({ ...prev, open: false }));
    navigate("/");
  };

  if (!game || !board) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        }}
      >
        <Header />
        <Box textAlign="center">
          <Typography color="white" mb={2}>
            Đang tải game...
          </Typography>
          {loadingError && (
            <Typography color="#fbbf24" mb={2}>
              {loadingError}
            </Typography>
          )}
          <Button
            variant="outlined"
            onClick={() => {
              loadRetryRef.current = 0;
              loadGame();
            }}
            sx={{ color: "white", borderColor: "white" }}
          >
            Thử lại
          </Button>
        </Box>
      </Box>
    );
  }

  const isMyTurn =
    (game.current_turn === "white" && game.white_player_id === user?.id) ||
    (game.current_turn === "black" && game.black_player_id === user?.id);

  const isPlayerWhite = game.white_player_id === user?.id;
  const displayedBoard = isPlayerWhite
    ? board
    : [...board].map((row) => [...row].reverse()).reverse();

  const toBoardCoords = (displayRow, displayCol) => {
    if (isPlayerWhite) return { row: displayRow, col: displayCol };
    return { row: 7 - displayRow, col: 7 - displayCol };
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
        {/* Top Info Card */}
        <Card
          sx={{
            mb: 3,
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            border: "2px solid #3b82f6",
          }}
        >
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="h5" color="white" fontWeight="bold">
                  {game.black_username} (Đen)
                </Typography>
                <Typography color="#94a3b8">
                  ELO: {game.black_rating}
                </Typography>
                <Chip label={formatTime(blackTime)} />
              </Box>
              <Typography
                variant="h6"
                color={isMyTurn ? "#10b981" : "#ef4444"}
                fontWeight="bold"
              >
                {isMyTurn ? "🎯 Lượt của bạn!" : "⏳ Đợi đối thủ..."}
              </Typography>
              <Box textAlign="right">
                <Typography variant="h5" color="white" fontWeight="bold">
                  {game.white_username} (Trắng)
                </Typography>
                <Typography color="#94a3b8">
                  ELO: {game.white_rating}
                </Typography>
                <Chip label={formatTime(whiteTime)} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Draw Offer Alert */}
        {drawOfferedByOpponent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              severity="info"
              sx={{ mb: 3 }}
              action={
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    onClick={handleAcceptDraw}
                  >
                    Chấp nhận
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={handleDeclineDraw}
                  >
                    Từ chối
                  </Button>
                </Box>
              }
            >
              Đối thủ đề nghị hòa
            </Alert>
          </motion.div>
        )}

        {/* Action Buttons */}
        <Box display="flex" justifyContent="center" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<Flag />}
            onClick={() => setShowResignDialog(true)}
            disabled={game.status !== "ongoing"}
            sx={{
              background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
            }}
          >
            Đầu hàng
          </Button>
          <Button
            variant="contained"
            startIcon={<span>🤝</span>}
            onClick={() => setShowDrawOfferDialog(true)}
            disabled={game.status !== "ongoing" || drawOfferedByMe}
            sx={{
              background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
            }}
          >
            {drawOfferedByMe ? "Đã gửi đề nghị hòa" : "Xin hòa"}
          </Button>
        </Box>

        {/* Chess Board */}
        <Box display="flex" justifyContent="center">
          <Box
            sx={{
              display: "inline-block",
              border: "4px solid #3b82f6",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {displayedBoard.map((row, rowIndex) => (
              <Box key={rowIndex} display="flex">
                {row.map((piece, colIndex) => {
                  const { row: boardRow, col: boardCol } = toBoardCoords(
                    rowIndex,
                    colIndex,
                  );
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isBlack = piece && piece === piece.toLowerCase();
                  const isSelected =
                    selectedSquare?.row === boardRow &&
                    selectedSquare?.col === boardCol;
                  const isValidMove = validMoves.some(
                    ([r, c]) => r === boardRow && c === boardCol,
                  );

                  return (
                    <Box
                      key={colIndex}
                      onClick={() => handleSquareClick(boardRow, boardCol)}
                      sx={{
                        width: 80,
                        height: 80,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "3.5rem",
                        cursor: isMyTurn ? "pointer" : "default",
                        backgroundColor: isSelected
                          ? "#ffeb3b"
                          : isValidMove
                            ? "#4caf50"
                            : isLight
                              ? "#f0d9b5"
                              : "#b58863",
                        "&:hover": isMyTurn
                          ? { filter: "brightness(1.1)" }
                          : {},
                        position: "relative",
                      }}
                    >
                      {isValidMove && !piece && (
                        <Box
                          sx={{
                            position: "absolute",
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            backgroundColor: "rgba(76, 175, 80, 0.8)",
                          }}
                        />
                      )}
                      {piece && (
                        <span
                          style={{ color: isBlack ? "#000000" : "#FFFFFF" }}
                        >
                          {PIECE_SYMBOLS[piece]}
                        </span>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Game Info */}
        <Box mt={3} textAlign="center">
          <Typography color="#94a3b8">
            {game.status === "ongoing"
              ? isMyTurn
                ? "Lượt của bạn. Chọn quân và di chuyển."
                : "Đang chờ đối thủ..."
              : `Trận đấu đã kết thúc: ${game.result}`}
          </Typography>
        </Box>

        {/* Resign Dialog */}
        <Dialog
          open={showResignDialog}
          onClose={() => setShowResignDialog(false)}
        >
          <DialogTitle>Xác nhận đầu hàng</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn đầu hàng? Bạn sẽ thua trận này và mất ELO.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResignDialog(false)}>Hủy</Button>
            <Button onClick={handleResign} color="error" variant="contained">
              Đầu hàng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Offer Draw Dialog */}
        <Dialog
          open={showDrawOfferDialog}
          onClose={() => setShowDrawOfferDialog(false)}
        >
          <DialogTitle>Đề nghị hòa</DialogTitle>
          <DialogContent>
            <Typography>Bạn muốn gửi đề nghị hòa cho đối thủ?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDrawOfferDialog(false)}>Hủy</Button>
            <Button
              onClick={handleOfferDraw}
              color="primary"
              variant="contained"
            >
              Gửi đề nghị
            </Button>
          </DialogActions>
        </Dialog>

        {/* End Game Dialog */}
        <Dialog open={endDialog.open} onClose={() => {}}>
          <DialogTitle>{endDialog.title}</DialogTitle>
          <DialogContent>
            <Typography>{endDialog.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePlayAgain} variant="contained">
              Ghép trận tiếp
            </Button>
            <Button onClick={handleExit} variant="outlined">
              Thoát
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default OnlineGamePage;
