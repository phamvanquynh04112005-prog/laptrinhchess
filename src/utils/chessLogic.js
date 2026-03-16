// src/utils/chessLogic.js - FIXED VERSION

const gameStates = new Map();

const getGameState = (gameId = "default") => {
  if (!gameStates.has(gameId)) {
    gameStates.set(gameId, {
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      kingMoved: { white: false, black: false },
      rookMoved: {
        white: { left: false, right: false },
        black: { left: false, right: false },
      },
      enPassantTarget: null,
      halfMoveClock: 0,
      fullMoveNumber: 1,
    });
  }
  return gameStates.get(gameId);
};

export const resetGameState = (gameId = "default") => {
  gameStates.delete(gameId);
};

export const initializeBoard = () => {
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

export const isWhitePiece = (piece) => piece && piece === piece.toUpperCase();
export const isBlackPiece = (piece) => piece && piece === piece.toLowerCase();

const isPathClear = (board, fromRow, fromCol, toRow, toCol) => {
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol] !== null) return false;
    currentRow += rowStep;
    currentCol += colStep;
  }
  return true;
};

// FIXED: Nhập thành - kiểm tra chi tiết hơn
const canCastle = (board, isWhite, kingSide, gameId = "default") => {
  const state = getGameState(gameId);
  const row = isWhite ? 7 : 0;
  const king = board[row][4];

  // Kiểm tra vua đúng vị trí
  if (!king || (isWhite && king !== "K") || (!isWhite && king !== "k")) {
    return false;
  }

  // Kiểm tra vua đã di chuyển chưa
  if (state.kingMoved[isWhite ? "white" : "black"]) {
    return false;
  }

  // Kiểm tra xe
  const rookCol = kingSide ? 7 : 0;
  const rook = board[row][rookCol];
  const expectedRook = isWhite ? "R" : "r";

  if (rook !== expectedRook) return false;

  // Kiểm tra xe đã di chuyển chưa
  const side = isWhite ? "white" : "black";
  const rookSide = kingSide ? "right" : "left";
  if (state.rookMoved[side][rookSide]) return false;

  // Kiểm tra đường đi
  const startCol = kingSide ? 5 : 1;
  const endCol = kingSide ? 6 : 3;

  for (let col = startCol; col <= endCol; col++) {
    if (board[row][col] !== null) return false;
  }

  // CRITICAL FIX: Kiểm tra vua không bị chiếu ở vị trí hiện tại
  if (isInCheck(board, isWhite)) return false;

  // Kiểm tra các ô vua đi qua không bị tấn công
  const kingPath = kingSide ? [5, 6] : [2, 3];
  for (const col of kingPath) {
    const testBoard = board.map((r) => [...r]);
    testBoard[row][col] = king;
    testBoard[row][4] = null;

    if (isSquareUnderAttack(testBoard, row, col, isWhite)) {
      return false;
    }
  }

  return true;
};

const getPawnMoves = (board, row, col, gameId = "default") => {
  const state = getGameState(gameId);
  const piece = board[row][col];
  const isWhite = isWhitePiece(piece);
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  const moves = [];

  if (
    row + direction >= 0 &&
    row + direction < 8 &&
    board[row + direction][col] === null
  ) {
    moves.push([row + direction, col]);
    if (row === startRow && board[row + 2 * direction][col] === null) {
      moves.push([row + 2 * direction, col]);
    }
  }

  for (const colOffset of [-1, 1]) {
    const newRow = row + direction;
    const newCol = col + colOffset;

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (target && isWhitePiece(target) !== isWhite) {
        moves.push([newRow, newCol]);
      }

      if (
        state.enPassantTarget &&
        state.enPassantTarget.row === newRow &&
        state.enPassantTarget.col === newCol
      ) {
        const adjacentPawn = board[row][newCol];
        if (
          adjacentPawn &&
          adjacentPawn.toLowerCase() === "p" &&
          isWhitePiece(adjacentPawn) !== isWhite
        ) {
          moves.push([newRow, newCol]);
        }
      }
    }
  }

  return moves;
};

const getKnightMoves = (board, row, col) => {
  const moves = [];
  const piece = board[row][col];
  const isWhite = isWhitePiece(piece);

  const knightMoves = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  for (const [dr, dc] of knightMoves) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || isWhitePiece(target) !== isWhite) {
        moves.push([newRow, newCol]);
      }
    }
  }

  return moves;
};

const getBishopMoves = (board, row, col) => {
  const moves = [];
  const piece = board[row][col];
  const isWhite = isWhitePiece(piece);
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    let newRow = row + dr;
    let newCol = col + dc;

    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target) {
        moves.push([newRow, newCol]);
      } else {
        if (isWhitePiece(target) !== isWhite) moves.push([newRow, newCol]);
        break;
      }
      newRow += dr;
      newCol += dc;
    }
  }

  return moves;
};

const getRookMoves = (board, row, col) => {
  const moves = [];
  const piece = board[row][col];
  const isWhite = isWhitePiece(piece);
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of directions) {
    let newRow = row + dr;
    let newCol = col + dc;

    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target) {
        moves.push([newRow, newCol]);
      } else {
        if (isWhitePiece(target) !== isWhite) moves.push([newRow, newCol]);
        break;
      }
      newRow += dr;
      newCol += dc;
    }
  }

  return moves;
};

const getQueenMoves = (board, row, col) => {
  return [...getBishopMoves(board, row, col), ...getRookMoves(board, row, col)];
};

const getKingMoves = (board, row, col, gameId = "default") => {
  const moves = [];
  const piece = board[row][col];
  const isWhite = isWhitePiece(piece);

  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || isWhitePiece(target) !== isWhite) {
        moves.push([newRow, newCol]);
      }
    }
  }

  // Nhập thành
  if (canCastle(board, isWhite, true, gameId)) {
    moves.push([row, 6]); // King-side
  }
  if (canCastle(board, isWhite, false, gameId)) {
    moves.push([row, 2]); // Queen-side
  }

  return moves;
};

export const getValidMoves = (board, row, col, gameId = "default") => {
  const piece = board[row][col];
  if (!piece) return [];

  const isWhite = isWhitePiece(piece);
  let moves = [];

  const pieceType = piece.toLowerCase();
  switch (pieceType) {
    case "p":
      moves = getPawnMoves(board, row, col, gameId);
      break;
    case "n":
      moves = getKnightMoves(board, row, col);
      break;
    case "b":
      moves = getBishopMoves(board, row, col);
      break;
    case "r":
      moves = getRookMoves(board, row, col);
      break;
    case "q":
      moves = getQueenMoves(board, row, col);
      break;
    case "k":
      moves = getKingMoves(board, row, col, gameId);
      break;
    default:
      return [];
  }

  return moves.filter(([toRow, toCol]) => {
    const testBoard = makeMove(board, row, col, toRow, toCol, gameId, true);
    return !isInCheck(testBoard, isWhite);
  });
};

export const makeMove = (
  board,
  fromRow,
  fromCol,
  toRow,
  toCol,
  gameId = "default",
  isTest = false
) => {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[fromRow][fromCol];
  const isWhite = isWhitePiece(piece);
  const state = getGameState(gameId);

  // FIXED: Xử lý nhập thành
  if (piece.toLowerCase() === "k" && Math.abs(toCol - fromCol) === 2) {
    const kingSide = toCol > fromCol;
    const rookFromCol = kingSide ? 7 : 0;
    const rookToCol = kingSide ? 5 : 3;
    const row = fromRow;

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    newBoard[row][rookToCol] = newBoard[row][rookFromCol];
    newBoard[row][rookFromCol] = null;

    if (!isTest) {
      state.kingMoved[isWhite ? "white" : "black"] = true;
      state.rookMoved[isWhite ? "white" : "black"][
        kingSide ? "right" : "left"
      ] = true;
    }

    return newBoard;
  }

  const capturedPiece = newBoard[toRow][toCol];
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;

  // Phong cấp
  if (piece.toLowerCase() === "p" && (toRow === 0 || toRow === 7)) {
    newBoard[toRow][toCol] = isWhite ? "Q" : "q";
  }

  // En passant
  if (
    piece.toLowerCase() === "p" &&
    state.enPassantTarget &&
    toRow === state.enPassantTarget.row &&
    toCol === state.enPassantTarget.col
  ) {
    newBoard[fromRow][toCol] = null;
  }

  if (!isTest) {
    if (piece.toLowerCase() === "k") {
      state.kingMoved[isWhite ? "white" : "black"] = true;
    }

    if (piece.toLowerCase() === "r") {
      const side = isWhite ? "white" : "black";
      if (fromCol === 0) state.rookMoved[side].left = true;
      if (fromCol === 7) state.rookMoved[side].right = true;
    }

    if (piece.toLowerCase() === "p" && Math.abs(toRow - fromRow) === 2) {
      state.enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
    } else {
      state.enPassantTarget = null;
    }

    if (capturedPiece) {
      state.capturedPieces[isWhite ? "white" : "black"].push(capturedPiece);
    }
  }

  return newBoard;
};

export const isSquareUnderAttack = (board, row, col, byWhite) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      if (isWhitePiece(piece) === byWhite) {
        const moves = getValidMovesWithoutCheckValidation(board, r, c);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) {
          return true;
        }
      }
    }
  }
  return false;
};

const getValidMovesWithoutCheckValidation = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];

  const pieceType = piece.toLowerCase();
  switch (pieceType) {
    case "p":
      return getPawnMoves(board, row, col);
    case "n":
      return getKnightMoves(board, row, col);
    case "b":
      return getBishopMoves(board, row, col);
    case "r":
      return getRookMoves(board, row, col);
    case "q":
      return getQueenMoves(board, row, col);
    case "k":
      return getKingMoves(board, row, col).filter(
        ([r, c]) => Math.abs(c - col) !== 2
      );
    default:
      return [];
  }
};

export const isInCheck = (board, isWhite) => {
  let kingRow, kingCol;
  const kingPiece = isWhite ? "K" : "k";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingPiece) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
  }

  if (kingRow === undefined) return false;
  return isSquareUnderAttack(board, kingRow, kingCol, !isWhite);
};

export const isCheckmate = (board, isWhite, gameId = "default") => {
  if (!isInCheck(board, isWhite)) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || isWhitePiece(piece) !== isWhite) continue;
      const moves = getValidMoves(board, r, c, gameId);
      if (moves.length > 0) return false;
    }
  }
  return true;
};

export const isStalemate = (board, isWhite, gameId = "default") => {
  if (isInCheck(board, isWhite)) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || isWhitePiece(piece) !== isWhite) continue;
      const moves = getValidMoves(board, r, c, gameId);
      if (moves.length > 0) return false;
    }
  }
  return true;
};

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export const evaluateBoard = (board) => {
  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      const value = PIECE_VALUES[piece.toLowerCase()] || 0;
      score += isWhitePiece(piece) ? value : -value;
    }
  }
  return score;
};

export const minimax = (
  board,
  depth,
  alpha,
  beta,
  isMaximizing,
  maxDepth = 3,
  gameId = "default"
) => {
  if (depth === maxDepth) {
    return { score: evaluateBoard(board), move: null };
  }

  if (isCheckmate(board, isMaximizing, gameId)) {
    return { score: isMaximizing ? -Infinity : Infinity, move: null };
  }

  if (isStalemate(board, isMaximizing, gameId)) {
    return { score: 0, move: null };
  }

  let bestMove = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (!piece || isWhitePiece(piece) !== isMaximizing) continue;

      const moves = getValidMoves(board, fromRow, fromCol, gameId);

      for (const [toRow, toCol] of moves) {
        const newBoard = makeMove(
          board,
          fromRow,
          fromCol,
          toRow,
          toCol,
          gameId,
          true
        );
        const result = minimax(
          newBoard,
          depth + 1,
          alpha,
          beta,
          !isMaximizing,
          maxDepth,
          gameId
        );

        if (isMaximizing) {
          if (result.score > bestScore) {
            bestScore = result.score;
            bestMove = { fromRow, fromCol, toRow, toCol };
          }
          alpha = Math.max(alpha, bestScore);
        } else {
          if (result.score < bestScore) {
            bestScore = result.score;
            bestMove = { fromRow, fromCol, toRow, toCol };
          }
          beta = Math.min(beta, bestScore);
        }

        if (beta <= alpha) break;
      }
    }
  }

  return { score: bestScore, move: bestMove };
};

export const getAIMove = (board, difficulty = "medium", gameId = "default") => {
  const depths = { easy: 1, medium: 2, hard: 3 };
  const depth = depths[difficulty] || 2;
  const result = minimax(board, 0, -Infinity, Infinity, false, depth, gameId);
  return result.move;
};
