"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  Target,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

interface Props {
  pgn: string;
  initialFen?: string;
  onComplete?: () => void;
}

export default function InteractiveStudyBoard({
  pgn,
  initialFen,
  onComplete,
}: Props) {
  const [game, setGame] = useState(new Chess(initialFen));
  const [moves, setMoves] = useState<
    { san: string; from: string; to: string; promotion?: string }[]
  >([]);
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Parse PGN into a list of moves
  useEffect(() => {
    try {
      const tempGame = new Chess();
      tempGame.loadPgn(pgn);
      const history = tempGame.history({ verbose: true });
      setMoves(
        history.map((m) => ({
          san: m.san,
          from: m.from,
          to: m.to,
          promotion: m.promotion,
        })),
      );
      setGame(new Chess(initialFen));
      setCurrentMoveIdx(-1);
    } catch (e) {
      console.error("Failed to parse PGN:", e);
    }
  }, [pgn, initialFen]);

  const makeMove = useCallback(
    (move: any) => {
      try {
        const result = game.move(move);
        if (result) {
          setGame(new Chess(game.fen()));
          return result;
        }
      } catch (e) {
        return null;
      }
    },
    [game],
  );

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (isStudyMode) {
      const nextMove = moves[currentMoveIdx + 1];
      if (!nextMove) return false;

      // Check if the move matches the PGN
      if (sourceSquare === nextMove.from && targetSquare === nextMove.to) {
        const move = makeMove({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q", // always promote to queen for simplicity in study mode
        });
        if (move) {
          setCurrentMoveIdx((i) => i + 1);
          setFeedback({ type: "success", message: `Correct! ${move.san}` });
          setShowHint(false);

          if (currentMoveIdx + 1 === moves.length - 1) {
            setFeedback({
              type: "success",
              message: "Excellent! You completed the study.",
            });
            onComplete?.();
          }
          return true;
        }
      } else {
        setFeedback({
          type: "error",
          message: "Not the move we're looking for. Try again!",
        });
        return false;
      }
    } else {
      // Free play mode
      const move = makeMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      return !!move;
    }
    return false;
  };

  const handleNext = () => {
    if (currentMoveIdx < moves.length - 1) {
      const nextMove = moves[currentMoveIdx + 1];
      makeMove(nextMove);
      setCurrentMoveIdx((i) => i + 1);
      setFeedback(null);
    }
  };

  const handlePrev = () => {
    if (currentMoveIdx >= 0) {
      const newGame = new Chess(initialFen);
      for (let i = 0; i < currentMoveIdx; i++) {
        newGame.move(moves[i]);
      }
      setGame(newGame);
      setCurrentMoveIdx((i) => i - 1);
      setFeedback(null);
    }
  };

  const reset = () => {
    setGame(new Chess(initialFen));
    setCurrentMoveIdx(-1);
    setFeedback(null);
    setShowHint(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsStudyMode(false);
              reset();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!isStudyMode ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"}`}
          >
            Review Mode
          </button>
          <button
            onClick={() => {
              setIsStudyMode(true);
              reset();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isStudyMode ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"}`}
          >
            Study Mode
          </button>
        </div>
        <button
          onClick={reset}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          title="Reset Board"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div
        className="relative mx-auto"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardWidth={400}
          customBoardStyle={{
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />

        {feedback && (
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce ${
              feedback.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : feedback.type === "error"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : feedback.type === "error" ? (
              <XCircle size={16} />
            ) : (
              <Info size={16} />
            )}
            {feedback.message}
          </div>
        )}
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={currentMoveIdx < 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium tabular-nums px-2">
              {currentMoveIdx + 1} / {moves.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentMoveIdx >= moves.length - 1 || isStudyMode}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {isStudyMode && currentMoveIdx < moves.length - 1 && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Lightbulb size={14} />
              {showHint ? "Hide Hint" : "Need a Hint?"}
            </button>
          )}
        </div>

        {showHint && isStudyMode && currentMoveIdx < moves.length - 1 && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 animate-fade-in">
            💡 The next move starts from{" "}
            <strong>{moves[currentMoveIdx + 1].from}</strong>
          </div>
        )}

        {isStudyMode && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <Target size={16} className="text-indigo-600" />
            <p className="text-xs text-indigo-800">
              <strong>Trial {currentMoveIdx + 2}:</strong> Can you find the
              correct continuation?
            </p>
          </div>
        )}

        {!isStudyMode && moves.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {moves.map((m, i) => (
              <span
                key={i}
                className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${i === currentMoveIdx ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"}`}
              >
                {Math.floor(i / 2) + 1}
                {i % 2 === 0 ? "." : "..."} {m.san}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
