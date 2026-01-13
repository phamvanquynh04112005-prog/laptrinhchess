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

export default function BasicChessPage() {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [gameStatus, setGameStatus] = useState("playing");

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <h1 className="text-5xl font-bold text-white mb-6">
        ♟️ Basic Chess - 2 Players
      </h1>

      {/* Game Status */}
      <div className="mb-4 px-6 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
        <p className="text-xl font-semibold text-white text-center">
          {gameStatus === "playing" &&
            `Current Turn: ${
              currentPlayer === "white" ? "♔ White" : "♚ Black"
            }`}
          {gameStatus === "check-white" && "⚠️ White is in Check!"}
          {gameStatus === "check-black" && "⚠️ Black is in Check!"}
          {gameStatus === "checkmate-white" && "🎉 White Wins! Checkmate!"}
          {gameStatus === "checkmate-black" && "🎉 Black Wins! Checkmate!"}
          {gameStatus === "stalemate" && "🤝 Stalemate! Draw!"}
        </p>
      </div>

      {/* Bàn cờ */}
      <div className="inline-block border-4 border-green-800 rounded-lg shadow-2xl overflow-hidden">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const highlighted = isHighlighted(rowIndex, colIndex);
              const selected = isSelected(rowIndex, colIndex);
              const isBlack = piece && piece === piece.toLowerCase();

              return (
                <div
                  key={colIndex}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`
                    w-20 h-20 flex items-center justify-center text-6xl cursor-pointer
                    transition-all duration-200 relative
                    ${isLight ? "bg-green-100" : "bg-green-700"}
                    ${highlighted ? "ring-4 ring-yellow-400 ring-inset" : ""}
                    ${
                      selected
                        ? "ring-4 ring-blue-500 ring-inset shadow-inner"
                        : ""
                    }
                    hover:brightness-110
                  `}
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
                    <div className="absolute w-4 h-4 bg-yellow-500 rounded-full opacity-50"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6">
        <button
          onClick={resetGame}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
        >
          🔄 New Game
        </button>
      </div>

      {/* Game Over Modal */}
      {(gameStatus.includes("checkmate") || gameStatus === "stalemate") && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-8 rounded-2xl shadow-2xl text-center max-w-md">
            <h2 className="text-4xl font-bold text-white mb-4">
              🏆 Game Over!
            </h2>
            <p className="text-xl text-white mb-6">
              {gameStatus === "checkmate-white"
                ? "White wins by checkmate!"
                : gameStatus === "checkmate-black"
                ? "Black wins by checkmate!"
                : "Stalemate! Draw!"}
            </p>
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-white text-green-600 font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
