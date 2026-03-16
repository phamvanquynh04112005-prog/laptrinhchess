import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Search, BookOpen, Play, ChevronRight, ChevronLeft, X } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";
import { learnAPI } from "../utils/api";
import {
  initializeBoard,
  makeMove,
  getValidMoves,
  resetGameState,
  isWhitePiece,
} from "../utils/chessLogic";

const PRACTICE_GAME_ID = "opening-practice";
const FILE_LETTERS = "abcdefgh";

// Chuyển ký hiệu đại số đơn giản (e4, Nf3, exd5, ...) thành ô đích [row, col]. Board: row 0 = đen, row 7 = trắng.
function sanToSquare(san, isWhite) {
  const s = san.replace(/x/g, "").replace(/[+#]/, "").trim();
  if (s === "O-O" || s === "0-0" || s === "O-O-O" || s === "0-0-0") return null;
  const file = (c) => (c ? FILE_LETTERS.indexOf(c) : -1);
  const rankToRow = (r) => (r ? 8 - parseInt(r, 10) : -1);
  const pieceMatch = s.match(/^([NBRQK])?([a-h])?([1-8])?([a-h])([1-8])$/);
  if (pieceMatch) {
    const col = file(pieceMatch[4]);
    const row = rankToRow(pieceMatch[5]);
    if (col >= 0 && row >= 0) return [row, col];
  }
  const pawnMatch = s.match(/^([a-h])([1-8])$/);
  if (pawnMatch) {
    const col = file(pawnMatch[1]);
    const row = rankToRow(pawnMatch[2]);
    if (col >= 0 && row >= 0) return [row, col];
  }
  const pawnCap = s.match(/^([a-h])([a-h])([1-8])$/);
  if (pawnCap) {
    const col = file(pawnCap[2]);
    const row = rankToRow(pawnCap[3]);
    if (col >= 0 && row >= 0) return [row, col];
  }
  return null;
}

// Tìm nước đi từ bàn cờ và ô đích (dùng getValidMoves).
function findMoveFromTo(board, toRow, toCol, isWhite, gameId) {
  const pieceType = (p) => p && p.toLowerCase();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || isWhitePiece(piece) !== isWhite) continue;
      const moves = getValidMoves(board, r, c, gameId);
      if (moves.some(([mr, mc]) => mr === toRow && mc === toCol))
        return { fromRow: r, fromCol: c, toRow, toCol };
    }
  }
  return null;
}

const PIECE_SYMBOLS = {
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
};

export default function OpeningExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openings, setOpenings] = useState([]);
  const [popularOpenings, setPopularOpenings] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [practiceOpening, setPracticeOpening] = useState(null);
  const [practiceBoard, setPracticeBoard] = useState(null);
  const [practiceStep, setPracticeStep] = useState(0);

  useEffect(() => {
    loadPopularOpenings();
    loadUserStats();
    loadRecommendations();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchOpenings();
    }
  }, [searchTerm]);

  const loadPopularOpenings = async () => {
    try {
      const data = await learnAPI.getPopularOpenings();
      if (data.success) setPopularOpenings(data.openings);
    } catch (error) {
      console.error("Load popular error:", error);
    }
  };

  const loadUserStats = async () => {
    try {
      const data = await learnAPI.getUserOpeningStats();
      if (data.success) setUserStats(data.stats);
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const data = await learnAPI.getOpeningRecommendations();
      if (data.success) setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Load recommendations error:", error);
    }
  };

  const searchOpenings = async () => {
    try {
      const data = await learnAPI.searchOpenings(searchTerm);
      if (data.success) setOpenings(data.openings);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const startPractice = useCallback((opening) => {
    resetGameState(PRACTICE_GAME_ID);
    setPracticeOpening(opening);
    setPracticeBoard(initializeBoard());
    setPracticeStep(0);
  }, []);

  const practiceMoves = practiceOpening?.moves
    ? Array.isArray(practiceOpening.moves)
      ? practiceOpening.moves
      : String(practiceOpening.moves).split(/[\s,]+/).filter(Boolean)
    : [];

  const applyNextMove = useCallback(() => {
    if (!practiceBoard || !practiceOpening || practiceStep >= practiceMoves.length) return;
    const isWhite = practiceStep % 2 === 0;
    const san = practiceMoves[practiceStep];
    const toSquare = sanToSquare(san, isWhite);
    if (!toSquare) {
      setPracticeStep((s) => s + 1);
      return;
    }
    const [toRow, toCol] = toSquare;
    const move = findMoveFromTo(
      practiceBoard,
      toRow,
      toCol,
      isWhite,
      PRACTICE_GAME_ID
    );
    if (move) {
      const newBoard = makeMove(
        practiceBoard,
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol,
        PRACTICE_GAME_ID
      );
      setPracticeBoard(newBoard);
      setPracticeStep((s) => s + 1);
    }
  }, [practiceBoard, practiceStep, practiceOpening, practiceMoves]);

  const applyPrevMove = useCallback(() => {
    if (practiceStep <= 0) return;
    resetGameState(PRACTICE_GAME_ID);
    let b = initializeBoard();
    for (let i = 0; i < practiceStep - 1; i++) {
      const isWhite = i % 2 === 0;
      const san = practiceMoves[i];
      const toSquare = sanToSquare(san, isWhite);
      if (!toSquare) continue;
      const [toRow, toCol] = toSquare;
      const move = findMoveFromTo(b, toRow, toCol, isWhite, PRACTICE_GAME_ID);
      if (move)
        b = makeMove(
          b,
          move.fromRow,
          move.fromCol,
          move.toRow,
          move.toCol,
          PRACTICE_GAME_ID
        );
    }
    setPracticeBoard(b);
    setPracticeStep((s) => s - 1);
  }, [practiceStep, practiceMoves]);

  const closePractice = useCallback(() => {
    setPracticeOpening(null);
    setPracticeBoard(null);
    setPracticeStep(0);
    resetGameState(PRACTICE_GAME_ID);
  }, []);

  const OpeningCard = ({ opening, showStats = false, onPractice }) => (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card
        sx={{
          backgroundColor: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          height: "100%",
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="start"
            mb={2}
          >
            <Box>
              <Typography variant="h6" color="white" fontWeight="bold">
                {opening.name}
              </Typography>
              {opening.eco_code && (
                <Chip
                  label={opening.eco_code}
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
            {opening.reason && (
              <Chip label="Gợi ý" color="success" size="small" />
            )}
          </Box>

          {opening.description && (
            <Typography variant="body2" color="#94a3b8" mb={2}>
              {opening.description}
            </Typography>
          )}

          <Box>
            <Typography variant="caption" color="#94a3b8">
              Các nước đi:
            </Typography>
            <Typography
              variant="body2"
              color="white"
              fontFamily="monospace"
              sx={{
                backgroundColor: "rgba(0,0,0,0.3)",
                p: 1,
                borderRadius: 1,
                mt: 0.5,
              }}
            >
              {opening.moves && opening.moves.slice(0, 10).join(" ")}
              {opening.moves && opening.moves.length > 10 && "..."}
            </Typography>
          </Box>

          {showStats && (
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="#94a3b8">
                  Trắng thắng:
                </Typography>
                <Typography variant="caption" color="#10b981" fontWeight="bold">
                  {opening.win_rate_white}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={opening.win_rate_white}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#374151",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#10b981",
                  },
                }}
              />
            </Box>
          )}

          {opening.times_played && (
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="#94a3b8" display="block">
                    Đã chơi
                  </Typography>
                  <Typography color="white" fontWeight="bold">
                    {opening.times_played}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="#94a3b8" display="block">
                    Thắng
                  </Typography>
                  <Typography color="#10b981" fontWeight="bold">
                    {opening.win_count}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="#94a3b8" display="block">
                    Tỷ lệ
                  </Typography>
                  <Typography color="#3b82f6" fontWeight="bold">
                    {opening.win_rate}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {opening.reason && (
            <Box
              mt={2}
              p={1.5}
              borderRadius={1}
              sx={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
            >
              <Typography variant="caption" color="#10b981">
                💡 {opening.reason}
              </Typography>
            </Box>
          )}

          {onPractice && opening.moves && opening.moves.length > 0 && (
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<Play size={16} />}
              onClick={() => onPractice(opening)}
              sx={{
                mt: 2,
                backgroundColor: "#2563eb",
                "&:hover": { backgroundColor: "#1d4ed8" },
              }}
            >
              Luyện tập
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

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
              <BookOpen size={48} color="#3b82f6" />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Opening Explorer
              </Typography>
            </Box>
            <Typography variant="h6" color="#94a3b8">
              Khám phá và học các khai cuộc cờ vua
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box mb={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm khai cuộc... (Sicilian, French, Ruy Lopez...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="#3b82f6" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(59, 130, 246, 0.3)",
                  },
                },
              }}
            />
          </Box>

          {/* Tabs */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "rgba(255,255,255,0.1)",
              mb: 4,
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              sx={{
                "& .MuiTab-root": {
                  color: "#94a3b8",
                  fontWeight: "bold",
                },
                "& .Mui-selected": {
                  color: "#3b82f6",
                },
              }}
            >
              <Tab label="Phổ biến" />
              <Tab label="Của bạn" />
              <Tab label="Gợi ý" />
            </Tabs>
          </Box>

          {/* Search Results */}
          {searchTerm.length > 2 && openings.length > 0 && (
            <Box mb={4}>
              <Typography variant="h5" color="white" fontWeight="bold" mb={3}>
                🔍 Kết quả tìm kiếm
              </Typography>
              <Grid container spacing={3}>
                {openings.map((opening, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <OpeningCard opening={opening} showStats onPractice={startPractice} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Tab Content */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h5" color="white" fontWeight="bold" mb={3}>
                📈 Khai cuộc phổ biến nhất
              </Typography>
              <Grid container spacing={3}>
                {popularOpenings.map((opening, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <OpeningCard opening={opening} showStats />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h5" color="white" fontWeight="bold" mb={3}>
                🎯 Khai cuộc của bạn
              </Typography>
              {userStats.length === 0 ? (
                <Card
                  sx={{
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <Typography color="#94a3b8">
                    Chưa có dữ liệu. Hãy chơi thêm để xem thống kê!
                  </Typography>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {userStats.map((opening, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <OpeningCard opening={opening} onPractice={startPractice} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h5" color="white" fontWeight="bold" mb={3}>
                💡 Gợi ý cho bạn
              </Typography>
              <Grid container spacing={3}>
                {recommendations.map((opening, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <OpeningCard opening={opening} showStats onPractice={startPractice} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

        {/* Dialog luyện tập khai cuộc */}
        <Dialog
          open={!!practiceOpening}
          onClose={closePractice}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "#132f4c",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle sx={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            Luyện tập: {practiceOpening?.name}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} pt={1}>
              {practiceBoard && (
                <Box
                  sx={{
                    display: "inline-block",
                    border: "2px solid #2563eb",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  {practiceBoard.map((row, rowIndex) => (
                    <Box key={rowIndex} display="flex">
                      {row.map((piece, colIndex) => {
                        const isLight = (rowIndex + colIndex) % 2 === 0;
                        const isBlack = piece && piece === piece.toLowerCase();
                        return (
                          <Box
                            key={colIndex}
                            sx={{
                              width: 48,
                              height: 48,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "2rem",
                              backgroundColor: isLight ? "#f0d9b5" : "#b58863",
                            }}
                          >
                            {piece && (
                              <span style={{ color: isBlack ? "#000" : "#fff" }}>
                                {PIECE_SYMBOLS[piece]}
                              </span>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              )}
              <Typography variant="body2" color="#94a3b8">
                Nước đi: {practiceMoves.slice(0, practiceStep).join(" ")}
                {practiceStep < practiceMoves.length && (
                  <Typography component="span" color="#2563eb" fontWeight="bold">
                    {" "}→ {practiceMoves[practiceStep]}
                  </Typography>
                )}
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ChevronLeft size={16} />}
                  onClick={applyPrevMove}
                  disabled={practiceStep <= 0}
                  sx={{ color: "#94a3b8", borderColor: "rgba(255,255,255,0.3)" }}
                >
                  Lùi
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ChevronRight size={16} />}
                  onClick={applyNextMove}
                  disabled={practiceStep >= practiceMoves.length}
                  sx={{ backgroundColor: "#2563eb", "&:hover": { backgroundColor: "#1d4ed8" } }}
                >
                  Nước tiếp
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", p: 2 }}>
            <Button onClick={closePractice} startIcon={<X size={16} />} sx={{ color: "#94a3b8" }}>
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
        </motion.div>
      </Container>
    </Box>
  );
}
