'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import {
  RotateCcw, Flag, Handshake, Settings2, Zap, Clock,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Download, Share2, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChessBoardProps {
  mode?: 'play' | 'analysis' | 'teaching';
  fen?: string;
  playerColor?: 'white' | 'black';
  onMove?: (move: Move, fen: string) => void;
  pgn?: string;
  readOnly?: boolean;
  showControls?: boolean;
  showMoveList?: boolean;
  showEval?: boolean;
  evalScore?: number;
  bestMove?: string;
  arrows?: Array<{ from: string; to: string; color?: string }>;
  highlightSquares?: string[];
  boardSize?: number;
  orientation?: 'white' | 'black';
}

const PIECE_SOUNDS = {
  move: () => { /* Play move sound */ },
  capture: () => { /* Play capture sound */ },
  check: () => { /* Play check sound */ },
};

export default function ChessBoardComponent({
  mode = 'play',
  fen,
  playerColor = 'white',
  onMove,
  pgn,
  readOnly = false,
  showControls = true,
  showMoveList = true,
  showEval = false,
  evalScore = 0,
  bestMove,
  arrows = [],
  highlightSquares = [],
  boardSize,
  orientation,
}: ChessBoardProps) {
  const [game, setGame] = useState(() => {
    const g = new Chess();
    if (fen) g.load(fen);
    if (pgn) g.loadPgn(pgn);
    return g;
  });
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(
    orientation || playerColor
  );
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const moveListRef = useRef<HTMLDivElement>(null);

  // Custom square styles
  const customSquareStyles = useCallback(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(246,246,105,0.5)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(246,246,105,0.5)' };
    }

    // Highlight selected
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(212,175,55,0.5)' };
    }

    // Highlight legal moves
    legalMoves.forEach(sq => {
      styles[sq] = {
        background: `radial-gradient(circle, rgba(212,175,55,0.4) 36%, transparent 40%)`,
      };
    });

    // King in check
    if (game.inCheck()) {
      const kingColor = game.turn();
      const pieces = game.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = pieces[r][c];
          if (piece && piece.type === 'k' && piece.color === kingColor) {
            const file = 'abcdefgh'[c];
            const rank = 8 - r;
            styles[`${file}${rank}` as Square] = {
              backgroundColor: 'rgba(248,113,113,0.6)',
            };
          }
        }
      }
    }

    // Custom highlights
    highlightSquares.forEach(sq => {
      styles[sq as Square] = { ...(styles[sq as Square] || {}), backgroundColor: 'rgba(96,165,250,0.4)' };
    });

    return styles;
  }, [game, lastMove, selectedSquare, legalMoves, highlightSquares]);

  // Handle square click for piece selection
  const onSquareClick = useCallback((square: Square) => {
    if (readOnly) return;
    if (mode === 'analysis') return;

    if (selectedSquare) {
      // Attempt move
      const moves = game.moves({ square: selectedSquare, verbose: true });
      const move = moves.find(m => m.to === square);

      if (move) {
        const gameCopy = new Chess(game.fen());
        const result = gameCopy.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (result) {
          setGame(gameCopy);
          setLastMove({ from: selectedSquare, to: square });
          setMoveHistory(prev => [...prev, result.san]);
          setCurrentMoveIndex(prev => prev + 1);
          onMove?.(result, gameCopy.fen());
        }
      }
      setSelectedSquare(null);
      setLegalMoves([]);
    } else {
      const piece = game.get(square);
      if (piece && (mode === 'play' ? piece.color === (playerColor === 'white' ? 'w' : 'b') : true)) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map(m => m.to as Square));
      }
    }
  }, [game, selectedSquare, playerColor, mode, readOnly, onMove]);

  // Handle drag move
  const onPieceDrop = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    if (readOnly) return false;

    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (move) {
        setGame(gameCopy);
        setLastMove({ from: sourceSquare, to: targetSquare });
        setMoveHistory(prev => [...prev, move.san]);
        setCurrentMoveIndex(prev => prev + 1);
        setSelectedSquare(null);
        setLegalMoves([]);
        onMove?.(move, gameCopy.fen());
        return true;
      }
    } catch {
      // illegal move
    }
    return false;
  }, [game, readOnly, onMove]);

  // Navigation controls
  const goToMove = useCallback((index: number) => {
    const baseGame = new Chess();
    if (pgn) baseGame.loadPgn(pgn);
    const history = baseGame.history({ verbose: true });

    const g = new Chess();
    for (let i = 0; i <= index; i++) {
      if (history[i]) g.move(history[i]);
    }
    setGame(g);
    setCurrentMoveIndex(index);
    if (index >= 0 && history[index]) {
      setLastMove({ from: history[index].from as Square, to: history[index].to as Square });
    }
  }, [pgn]);

  // Build custom arrows
  const customArrows = arrows.map(a => [a.from, a.to, a.color || '#D4AF37'] as [string, string, string]);
  if (bestMove && showEval) {
    customArrows.push([bestMove.slice(0, 2), bestMove.slice(2, 4), 'rgba(96,165,250,0.6)']);
  }

  // Move list pairs
  const movePairs = moveHistory.reduce((acc: Array<[string, string?]>, move, i) => {
    if (i % 2 === 0) acc.push([move]);
    else acc[acc.length - 1][1] = move;
    return acc;
  }, []);

  const gameStatus = () => {
    if (game.isCheckmate()) return { text: 'Checkmate!', color: '#F87171' };
    if (game.isDraw()) return { text: 'Draw', color: '#A09880' };
    if (game.isStalemate()) return { text: 'Stalemate', color: '#A09880' };
    if (game.inCheck()) return { text: 'Check!', color: '#FBBF24' };
    return null;
  };
  const status = gameStatus();

  return (
    <div className="flex gap-4 items-start">
      {/* Board */}
      <div className="flex flex-col gap-2">
        {/* Eval bar */}
        {showEval && (
          <div className="flex items-center gap-2 mb-1">
            <div className="relative h-2 flex-1 bg-white/[0.1] rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${50 + Math.min(Math.max(evalScore * 5, -50), 50)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="absolute left-0 top-0 h-full bg-[#F5F0E8] rounded-full"
              />
            </div>
            <span className="text-xs font-mono text-[#A09880] w-12 text-right">
              {evalScore > 0 ? '+' : ''}{evalScore.toFixed(1)}
            </span>
          </div>
        )}

        {/* Game status */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm font-semibold py-1"
              style={{ color: status.color }}
            >
              {status.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="chess-board-wrapper rounded-xl overflow-hidden shadow-2xl">
          <Chessboard
            position={game.fen()}
            onSquareClick={onSquareClick}
            onPieceDrop={onPieceDrop}
            boardOrientation={boardOrientation}
            customSquareStyles={customSquareStyles()}
            customArrows={customArrows}
            boardWidth={boardSize || 480}
            customBoardStyle={{
              borderRadius: '12px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#B58863' }}
            customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
            animationDuration={150}
            arePiecesDraggable={!readOnly}
          />
        </div>

        {/* Board controls */}
        {showControls && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                className="btn-ghost p-2"
                title="Flip board"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {mode === 'analysis' && (
              <div className="flex items-center gap-1">
                <button onClick={() => goToMove(-1)} className="btn-ghost p-2" title="Start">
                  <ChevronsLeft size={15} />
                </button>
                <button
                  onClick={() => goToMove(Math.max(-1, currentMoveIndex - 1))}
                  className="btn-ghost p-2"
                  title="Previous"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => goToMove(Math.min(moveHistory.length - 1, currentMoveIndex + 1))}
                  className="btn-ghost p-2"
                  title="Next"
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  onClick={() => goToMove(moveHistory.length - 1)}
                  className="btn-ghost p-2"
                  title="End"
                >
                  <ChevronsRight size={15} />
                </button>
              </div>
            )}

            {mode === 'play' && !readOnly && (
              <div className="flex items-center gap-2">
                <button className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3">
                  <Handshake size={13} /> Draw
                </button>
                <button className="btn-danger flex items-center gap-1.5 text-xs py-1.5 px-3">
                  <Flag size={13} /> Resign
                </button>
              </div>
            )}

            <div className="flex items-center gap-1">
              <button className="btn-ghost p-2" title="Download PGN">
                <Download size={15} />
              </button>
              <button className="btn-ghost p-2" title="Share">
                <Share2 size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Move list */}
      {showMoveList && (
        <div className="w-56 flex flex-col gap-3 flex-shrink-0">
          {/* Move list */}
          <div className="card overflow-hidden flex-1" style={{ maxHeight: '440px' }}>
            <div className="px-3 py-2.5 border-b border-white/[0.07] text-xs font-medium text-[#6B6050] uppercase tracking-wider">
              Moves
            </div>
            <div ref={moveListRef} className="overflow-y-auto p-2" style={{ maxHeight: '380px' }}>
              {movePairs.length === 0 ? (
                <p className="text-xs text-[#6B6050] text-center py-4">No moves yet</p>
              ) : (
                <div className="space-y-0.5">
                  {movePairs.map(([white, black], i) => (
                    <div key={i} className="flex items-center gap-1 text-sm">
                      <span className="w-6 text-[#6B6050] text-xs flex-shrink-0">{i + 1}.</span>
                      <button
                        onClick={() => goToMove(i * 2)}
                        className={`flex-1 px-2 py-1 rounded text-left text-xs transition-colors ${
                          currentMoveIndex === i * 2
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'hover:bg-white/[0.05] text-[#F5F0E8]'
                        }`}
                      >
                        {white}
                      </button>
                      {black && (
                        <button
                          onClick={() => goToMove(i * 2 + 1)}
                          className={`flex-1 px-2 py-1 rounded text-left text-xs transition-colors ${
                            currentMoveIndex === i * 2 + 1
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                              : 'hover:bg-white/[0.05] text-[#F5F0E8]'
                          }`}
                        >
                          {black}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analysis info */}
          {showEval && bestMove && (
            <div className="card p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#A09880]">
                <Brain size={13} className="text-[#D4AF37]" />
                Engine Analysis
              </div>
              <div className="text-xs">
                <span className="text-[#6B6050]">Best move: </span>
                <span className="font-mono text-[#D4AF37]">{bestMove}</span>
              </div>
              <div className="text-xs">
                <span className="text-[#6B6050]">Eval: </span>
                <span className={`font-mono ${evalScore > 0 ? 'text-white' : evalScore < 0 ? 'text-[#A09880]' : 'text-[#6B6050]'}`}>
                  {evalScore > 0 ? '+' : ''}{evalScore.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
