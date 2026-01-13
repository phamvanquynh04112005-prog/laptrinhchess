// chessLogic.js - Fixed Complete Version with Proper Castling

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

const PIECE_VALUES = {
  p: -100,
  n: -320,
  b: -330,
  r: -500,
  q: -900,
  k: -20000,
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 20000,
};

// Global game states với hỗ trợ nhiều game
const gameStates = {};

const getGameState = (gameId = "default") => {
  if (!gameStates[gameId]) {
    gameStates[gameId] = {
      whiteKingMoved: false,
      blackKingMoved: false,
      whiteRookKingSideMoved: false,
      whiteRookQueenSideMoved: false,
      blackRookKingSideMoved: false,
      blackRookQueenSideMoved: false,
      enPassantTarget: null,
    };
  }
  return gameStates[gameId];
};

export const resetGameState = (gameId = "default") => {
  gameStates[gameId] = {
    whiteKingMoved: false,
    blackKingMoved: false,
    whiteRookKingSideMoved: false,
    whiteRookQueenSideMoved: false,
    blackRookKingSideMoved: false,
    blackRookQueenSideMoved: false,
    enPassantTarget: null,
  };
};

export const isWhitePiece = (piece) => piece && piece === piece.toUpperCase();
export const isBlackPiece = (piece) => piece && piece === piece.toLowerCase();

const isValidPosition = (row, col) =>
  row >= 0 && row < 8 && col >= 0 && col < 8;

const getLineMoves = (board, row, col, isWhite, directions) => {
  const moves = [];
  directions.forEach(([dr, dc]) => {
    let newRow = row + dr;
    let newCol = col + dc;
    while (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target) {
        moves.push([newRow, newCol]);
      } else {
        if (isWhite ? isBlackPiece(target) : isWhitePiece(target)) {
          moves.push([newRow, newCol]);
        }
        break;
      }
      newRow += dr;
      newCol += dc;
    }
  });
  return moves;
};

const getPawnMoves = (board, row, col, isWhite, gameId) => {
  const moves = [];
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  const gameState = getGameState(gameId);

  if (board[row + direction]?.[col] === null) {
    moves.push([row + direction, col]);
    if (row === startRow && board[row + 2 * direction]?.[col] === null) {
      moves.push([row + 2 * direction, col]);
    }
  }

  [-1, 1].forEach((offset) => {
    const targetRow = row + direction;
    const targetCol = col + offset;
    if (isValidPosition(targetRow, targetCol)) {
      const target = board[targetRow][targetCol];
      if (target && (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
        moves.push([targetRow, targetCol]);
      }
      if (
        gameState.enPassantTarget &&
        targetRow === gameState.enPassantTarget[0] &&
        targetCol === gameState.enPassantTarget[1]
      ) {
        moves.push([targetRow, targetCol]);
      }
    }
  });

  return moves;
};

const getKnightMoves = (board, row, col, isWhite) => {
  const moves = [];
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
  knightMoves.forEach(([dr, dc]) => {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target || (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
        moves.push([newRow, newCol]);
      }
    }
  });
  return moves;
};

const getBishopMoves = (board, row, col, isWhite) => {
  return getLineMoves(board, row, col, isWhite, [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]);
};

const getRookMoves = (board, row, col, isWhite) => {
  return getLineMoves(board, row, col, isWhite, [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]);
};

const getQueenMoves = (board, row, col, isWhite) => {
  return [
    ...getBishopMoves(board, row, col, isWhite),
    ...getRookMoves(board, row, col, isWhite),
  ];
};

const isSquareAttacked = (board, row, col, byWhite) => {
  // Check pawn attacks
  const pawnDirection = byWhite ? -1 : 1;
  for (const dc of [-1, 1]) {
    const attackRow = row + pawnDirection;
    const attackCol = col + dc;
    if (isValidPosition(attackRow, attackCol)) {
      const piece = board[attackRow][attackCol];
      if (piece && piece.toLowerCase() === "p") {
        if (byWhite && isWhitePiece(piece)) return true;
        if (!byWhite && isBlackPiece(piece)) return true;
      }
    }
  }

  // Check knight attacks
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
    const attackRow = row + dr;
    const attackCol = col + dc;
    if (isValidPosition(attackRow, attackCol)) {
      const piece = board[attackRow][attackCol];
      if (piece && piece.toLowerCase() === "n") {
        if (byWhite && isWhitePiece(piece)) return true;
        if (!byWhite && isBlackPiece(piece)) return true;
      }
    }
  }

  // Check bishop/queen diagonal attacks
  const bishopDirections = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [dr, dc] of bishopDirections) {
    let currentRow = row + dr;
    let currentCol = col + dc;
    while (isValidPosition(currentRow, currentCol)) {
      const piece = board[currentRow][currentCol];
      if (piece) {
        const pieceType = piece.toLowerCase();
        if (pieceType === "b" || pieceType === "q") {
          if (byWhite && isWhitePiece(piece)) return true;
          if (!byWhite && isBlackPiece(piece)) return true;
        }
        break;
      }
      currentRow += dr;
      currentCol += dc;
    }
  }

  // Check rook/queen straight attacks
  const rookDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of rookDirections) {
    let currentRow = row + dr;
    let currentCol = col + dc;
    while (isValidPosition(currentRow, currentCol)) {
      const piece = board[currentRow][currentCol];
      if (piece) {
        const pieceType = piece.toLowerCase();
        if (pieceType === "r" || pieceType === "q") {
          if (byWhite && isWhitePiece(piece)) return true;
          if (!byWhite && isBlackPiece(piece)) return true;
        }
        break;
      }
      currentRow += dr;
      currentCol += dc;
    }
  }

  // Check king attacks
  const kingDirections = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  for (const [dr, dc] of kingDirections) {
    const attackRow = row + dr;
    const attackCol = col + dc;
    if (isValidPosition(attackRow, attackCol)) {
      const piece = board[attackRow][attackCol];
      if (piece && piece.toLowerCase() === "k") {
        if (byWhite && isWhitePiece(piece)) return true;
        if (!byWhite && isBlackPiece(piece)) return true;
      }
    }
  }

  return false;
};

const getKingMoves = (board, row, col, isWhite, gameId) => {
  const moves = [];
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
  const gameState = getGameState(gameId);

  // Normal king moves
  directions.forEach(([dr, dc]) => {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target || (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
        moves.push([newRow, newCol]);
      }
    }
  });

  // CASTLING LOGIC - FIXED
  // Vua không được đang bị chiếu
  if (!isSquareAttacked(board, row, col, !isWhite)) {
    if (isWhite && row === 7 && col === 4) {
      if (!gameState.whiteKingMoved) {
        // Kingside castling (O-O): e1 -> g1
        if (
          !gameState.whiteRookKingSideMoved &&
          board[7][5] === null &&
          board[7][6] === null &&
          board[7][7] === "R" &&
          !isSquareAttacked(board, 7, 5, false) &&
          !isSquareAttacked(board, 7, 6, false)
        ) {
          moves.push([7, 6]);
        }

        // Queenside castling (O-O-O): e1 -> c1
        if (
          !gameState.whiteRookQueenSideMoved &&
          board[7][1] === null &&
          board[7][2] === null &&
          board[7][3] === null &&
          board[7][0] === "R" &&
          !isSquareAttacked(board, 7, 2, false) &&
          !isSquareAttacked(board, 7, 3, false)
        ) {
          moves.push([7, 2]);
        }
      }
    } else if (!isWhite && row === 0 && col === 4) {
      if (!gameState.blackKingMoved) {
        // Kingside castling (O-O): e8 -> g8
        if (
          !gameState.blackRookKingSideMoved &&
          board[0][5] === null &&
          board[0][6] === null &&
          board[0][7] === "r" &&
          !isSquareAttacked(board, 0, 5, true) &&
          !isSquareAttacked(board, 0, 6, true)
        ) {
          moves.push([0, 6]);
        }

        // Queenside castling (O-O-O): e8 -> c8
        if (
          !gameState.blackRookQueenSideMoved &&
          board[0][1] === null &&
          board[0][2] === null &&
          board[0][3] === null &&
          board[0][0] === "r" &&
          !isSquareAttacked(board, 0, 2, true) &&
          !isSquareAttacked(board, 0, 3, true)
        ) {
          moves.push([0, 2]);
        }
      }
    }
  }

  return moves;
};

export const getValidMoves = (board, row, col, gameId = "default") => {
  const piece = board[row][col];
  if (!piece) return [];

  const isWhite = isWhitePiece(piece);
  const pieceLower = piece.toLowerCase();
  let rawMoves = [];

  switch (pieceLower) {
    case "p":
      rawMoves = getPawnMoves(board, row, col, isWhite, gameId);
      break;
    case "n":
      rawMoves = getKnightMoves(board, row, col, isWhite);
      break;
    case "b":
      rawMoves = getBishopMoves(board, row, col, isWhite);
      break;
    case "r":
      rawMoves = getRookMoves(board, row, col, isWhite);
      break;
    case "q":
      rawMoves = getQueenMoves(board, row, col, isWhite);
      break;
    case "k":
      rawMoves = getKingMoves(board, row, col, isWhite, gameId);
      break;
  }

  // Filter out moves that would leave king in check
  const moves = [];
  for (const [toRow, toCol] of rawMoves) {
    const testBoard = board.map((r) => [...r]);
    const movingPiece = testBoard[row][col];
    testBoard[toRow][toCol] = movingPiece;
    testBoard[row][col] = null;

    // Handle castling simulation
    if (pieceLower === "k" && Math.abs(toCol - col) === 2) {
      if (toCol > col) {
        // Kingside: Xe từ h -> f
        testBoard[toRow][toCol - 1] = testBoard[toRow][7];
        testBoard[toRow][7] = null;
      } else {
        // Queenside: Xe từ a -> d
        testBoard[toRow][toCol + 1] = testBoard[toRow][0];
        testBoard[toRow][0] = null;
      }
    }

    if (!isInCheck(testBoard, isWhite, gameId)) {
      moves.push([toRow, toCol]);
    }
  }

  return moves;
};

export const makeMove = (
  board,
  fromRow,
  fromCol,
  toRow,
  toCol,
  gameId = "default"
) => {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[fromRow][fromCol];
  const isWhite = isWhitePiece(piece);
  const pieceLower = piece.toLowerCase();
  const gameState = getGameState(gameId);

  // Reset en passant
  gameState.enPassantTarget = null;

  // Pawn special moves
  if (pieceLower === "p") {
    const startRow = isWhite ? 6 : 1;
    if (fromRow === startRow && Math.abs(toRow - fromRow) === 2) {
      gameState.enPassantTarget = [fromRow + (toRow - fromRow) / 2, fromCol];
    }
    // En passant capture
    if (Math.abs(toCol - fromCol) === 1 && newBoard[toRow][toCol] === null) {
      newBoard[fromRow][toCol] = null;
    }
  }

  // King move tracking and castling
  if (pieceLower === "k") {
    if (isWhite) {
      gameState.whiteKingMoved = true;
    } else {
      gameState.blackKingMoved = true;
    }

    // Perform castling - di chuyển xe
    if (Math.abs(toCol - fromCol) === 2) {
      if (toCol > fromCol) {
        // Kingside: Xe từ h sang f
        newBoard[toRow][toCol - 1] = newBoard[toRow][7];
        newBoard[toRow][7] = null;
      } else {
        // Queenside: Xe từ a sang d
        newBoard[toRow][toCol + 1] = newBoard[toRow][0];
        newBoard[toRow][0] = null;
      }
    }
  }

  // Rook move tracking
  if (pieceLower === "r") {
    if (isWhite) {
      if (fromRow === 7 && fromCol === 0)
        gameState.whiteRookQueenSideMoved = true;
      if (fromRow === 7 && fromCol === 7)
        gameState.whiteRookKingSideMoved = true;
    } else {
      if (fromRow === 0 && fromCol === 0)
        gameState.blackRookQueenSideMoved = true;
      if (fromRow === 0 && fromCol === 7)
        gameState.blackRookKingSideMoved = true;
    }
  }

  // Track if rook is captured
  const capturedPiece = newBoard[toRow][toCol];
  if (capturedPiece && capturedPiece.toLowerCase() === "r") {
    if (isWhitePiece(capturedPiece)) {
      if (toRow === 7 && toCol === 0) gameState.whiteRookQueenSideMoved = true;
      if (toRow === 7 && toCol === 7) gameState.whiteRookKingSideMoved = true;
    } else {
      if (toRow === 0 && toCol === 0) gameState.blackRookQueenSideMoved = true;
      if (toRow === 0 && toCol === 7) gameState.blackRookKingSideMoved = true;
    }
  }

  // Make the move
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;

  return newBoard;
};

export const evaluateBoard = (board) => {
  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) score += PIECE_VALUES[piece];
    }
  }
  return score;
};

export const getAllMoves = (board, isWhite, gameId = "default") => {
  const moves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && (isWhite ? isWhitePiece(piece) : isBlackPiece(piece))) {
        const validMoves = getValidMoves(board, row, col, gameId);
        validMoves.forEach(([toRow, toCol]) => {
          moves.push({ fromRow: row, fromCol: col, toRow, toCol });
        });
      }
    }
  }
  return moves;
};

export const isInCheck = (board, isWhite, gameId = "default") => {
  let kingPos = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.toLowerCase() === "k") {
        const pieceIsWhite = isWhitePiece(piece);
        if ((isWhite && pieceIsWhite) || (!isWhite && !pieceIsWhite)) {
          kingPos = [row, col];
          break;
        }
      }
    }
    if (kingPos) break;
  }
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos[0], kingPos[1], !isWhite);
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
  if (depth >= maxDepth) {
    return { score: evaluateBoard(board), move: null };
  }

  const moves = getAllMoves(board, isMaximizing, gameId);

  if (moves.length === 0) {
    if (isInCheck(board, isMaximizing, gameId)) {
      return {
        score: isMaximizing ? -100000 + depth : 100000 - depth,
        move: null,
      };
    }
    return { score: 0, move: null };
  }

  let bestMove = moves[0];

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(
        board,
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol,
        gameId
      );
      const result = minimax(
        newBoard,
        depth + 1,
        alpha,
        beta,
        false,
        maxDepth,
        gameId
      );
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(
        board,
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol,
        gameId
      );
      const result = minimax(
        newBoard,
        depth + 1,
        alpha,
        beta,
        true,
        maxDepth,
        gameId
      );
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break;
    }
    return { score: minScore, move: bestMove };
  }
};

export const getAIMove = (board, difficulty, gameId = "default") => {
  let maxDepth;
  switch (difficulty) {
    case "easy":
      maxDepth = 2;
      break;
    case "medium":
      maxDepth = 3;
      break;
    case "hard":
      maxDepth = 4;
      break;
    default:
      maxDepth = 3;
  }

  const moves = getAllMoves(board, false, gameId);
  if (moves.length === 0) return null;

  if (difficulty === "easy" && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const result = minimax(
    board,
    0,
    -Infinity,
    Infinity,
    false,
    maxDepth,
    gameId
  );
  return result.move || moves[0];
};

export const isCheckmate = (board, isWhite, gameId = "default") => {
  if (!isInCheck(board, isWhite, gameId)) return false;
  const moves = getAllMoves(board, isWhite, gameId);
  return moves.length === 0;
};

export const isStalemate = (board, isWhite, gameId = "default") => {
  if (isInCheck(board, isWhite, gameId)) return false;
  const moves = getAllMoves(board, isWhite, gameId);
  return moves.length === 0;
};
