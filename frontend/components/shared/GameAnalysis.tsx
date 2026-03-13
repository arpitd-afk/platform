"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  AlertTriangle,
  Loader2,
  BarChart3,
  Target,
  Zap,
  Info,
  RotateCcw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Classification =
  | "brilliant"
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "forced";

interface AnalysedMove {
  san: string;
  uci: string; // e.g. "e2e4"
  fen: string;
  fenBefore: string;
  eval: number; // centipawns after this move, from White's POV
  bestUci: string; // best move uci from engine
  cpl: number; // centipawn loss (always >= 0, from mover's POV)
  classification: Classification;
  isWhite: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CLASSIF: Record<
  Classification,
  { color: string; bg: string; label: string; icon: string }
> = {
  brilliant: {
    color: "#1D9BF0",
    bg: "#DBEAFE",
    label: "!! Brilliant",
    icon: "✨",
  },
  best: { color: "#15803D", bg: "#DCFCE7", label: "✓ Best", icon: "✓" },
  excellent: {
    color: "#5C9900",
    bg: "#ECFCCB",
    label: "+ Excellent",
    icon: "+",
  },
  good: {
    color: "#9A6E00",
    bg: "rgba(200,150,30,0.12)",
    label: "Good",
    icon: "○",
  },
  inaccuracy: {
    color: "#EA580C",
    bg: "#FFEDD5",
    label: "?! Inaccuracy",
    icon: "?!",
  },
  mistake: { color: "#DC2626", bg: "#FEE2E2", label: "? Mistake", icon: "?" },
  blunder: { color: "#7C0000", bg: "#FECDD3", label: "?? Blunder", icon: "??" },
  forced: { color: "#7C3AED", bg: "#EDE9FE", label: "Forced", icon: "□" },
};

// Chess.com-style accuracy from average centipawn loss
function cplToAccuracy(avgCpl: number): number {
  // Exponential decay: accuracy ≈ 103.1668 × e^(−0.04354 × avgCpl) − 3.1669
  return Math.max(
    0,
    Math.min(100, 103.1668 * Math.exp(-0.04354 * avgCpl) - 3.1669),
  );
}

function classifyMove(
  cpl: number,
  forced: boolean,
  isSacrifice: boolean,
): Classification {
  if (forced) return "forced";
  if (cpl <= 10) return isSacrifice ? "brilliant" : "best";
  if (cpl <= 30) return "excellent";
  if (cpl <= 80) return "good";
  if (cpl <= 180) return "inaccuracy";
  if (cpl <= 400) return "mistake";
  return "blunder";
}

// Check if move gives up material (rough: compares material after move vs before)
function isMaterialSacrifice(fenBefore: string, uci: string): boolean {
  try {
    const PIECE_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const g = new Chess(fenBefore);
    const to = uci.slice(2, 4);
    const captured = g.get(to as any);
    if (!captured) return false;
    const moving = g.get(uci.slice(0, 2) as any);
    if (!moving) return false;
    const gainedVal = PIECE_VAL[captured.type] || 0;
    const movingVal = PIECE_VAL[moving.type] || 0;
    return gainedVal < movingVal; // giving up more than gaining
  } catch {
    return false;
  }
}

// Parse UCI best move to square arrows
function uciToArrow(
  uci: string,
  color = "#22C55E",
): [string, string, string] | null {
  if (!uci || uci.length < 4) return null;
  return [uci.slice(0, 2), uci.slice(2, 4), color];
}

// ─── Eval Bar ─────────────────────────────────────────────────────────────────
function EvalBar({ value }: { value: number }) {
  const clamped = Math.max(-700, Math.min(700, value));
  const whitePct = ((clamped + 700) / 1400) * 100;
  const isMate = Math.abs(value) >= 9000;
  const display = isMate
    ? `M${Math.abs(value) - 9000 + 1}`
    : (Math.abs(value) / 100).toFixed(1);
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div
        className="w-5 h-56 rounded-full overflow-hidden relative border border-[var(--border-md)] shadow-inner"
        style={{ background: "#2d1f0e" }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-in-out"
          style={{
            height: `${whitePct}%`,
            background: "linear-gradient(to top, #f0ede8, #ffffff)",
          }}
        />
      </div>
      <span
        className="text-[10px] font-bold tabular-nums"
        style={{ color: value > 0 ? "var(--text)" : "var(--text-muted)" }}
      >
        {value === 0 ? "0.0" : `${sign}${display}`}
      </span>
    </div>
  );
}

// ─── Accuracy Ring ────────────────────────────────────────────────────────────
function AccuracyRing({
  accuracy,
  label,
  color,
}: {
  accuracy: number;
  label: string;
  color: string;
}) {
  const r = 22,
    circ = 2 * Math.PI * r;
  const dash = (accuracy / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="60" height="60">
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="var(--bg-subtle)"
          strokeWidth="5"
        />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text
          x="30"
          y="35"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={color}
        >
          {Math.round(accuracy)}%
        </text>
      </svg>
      <span
        className="text-[10px] font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Main Props ───────────────────────────────────────────────────────────────
interface Props {
  pgn: string;
  playerNames?: { white: string; black: string };
  autoStart?: boolean;
}

export default function GameAnalysis({
  pgn,
  playerNames,
  autoStart = false,
}: Props) {
  const [moves, setMoves] = useState<AnalysedMove[]>([]);
  const [idx, setIdx] = useState(-1); // -1 = starting position
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");
  const [showBestMove, setShowBestMove] = useState(true);
  const workerRef = useRef<Worker | null>(null);
  const moveListRef = useRef<HTMLDivElement>(null);

  // ── Parse PGN ──
  const parsedPositions = useCallback((): {
    san: string;
    uci: string;
    fenBefore: string;
    fen: string;
  }[] => {
    try {
      const g = new Chess();
      g.loadPgn(pgn);
      const history = g.history({ verbose: true });
      const positions: any[] = [];
      const replay = new Chess();
      for (const m of history) {
        const fenBefore = replay.fen();
        replay.move(m.san);
        positions.push({
          san: m.san,
          uci: m.from + m.to + (m.promotion || ""),
          fenBefore,
          fen: replay.fen(),
        });
      }
      return positions;
    } catch {
      return [];
    }
  }, [pgn]);

  // ── Engine helpers ──
  const initEngine = useCallback((): Promise<Worker> => {
    return new Promise((resolve, reject) => {
      try {
        const w = new Worker("/stockfish.js");
        let ready = false;
        w.postMessage("uci");
        w.onmessage = (e) => {
          if (e.data === "uciok") {
            w.postMessage("setoption name Threads value 1");
            w.postMessage("setoption name Hash value 16");
            w.postMessage("isready");
          } else if (e.data === "readyok" && !ready) {
            ready = true;
            resolve(w);
          }
        };
        w.onerror = (e) => reject(new Error("Engine error: " + e.message));
        setTimeout(() => {
          if (!ready)
            reject(
              new Error("Engine timeout — is /public/stockfish.js present?"),
            );
        }, 6000);
      } catch (e) {
        reject(e);
      }
    });
  }, []);

  const evalPosition = useCallback(
    (
      worker: Worker,
      fen: string,
      depth = 16,
    ): Promise<{ score: number; bestUci: string }> => {
      return new Promise((resolve) => {
        let score = 0,
          bestUci = "";
        worker.onmessage = (e) => {
          const msg = e.data as string;
          if (msg.startsWith("info") && msg.includes("score")) {
            if (msg.includes("score cp")) {
              const m = msg.match(/score cp (-?\d+)/);
              if (m) score = parseInt(m[1]);
            } else if (msg.includes("score mate")) {
              const m = msg.match(/score mate (-?\d+)/);
              if (m) score = parseInt(m[1]) > 0 ? 9999 : -9999;
            }
          } else if (msg.startsWith("bestmove")) {
            const m = msg.match(/bestmove (\S+)/);
            if (m) bestUci = m[1];
            resolve({ score, bestUci });
          }
        };
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      });
    },
    [],
  );

  // ── Run full analysis ──
  const runAnalysis = useCallback(async () => {
    const positions = parsedPositions();
    if (!positions.length) {
      setError("No moves found in PGN");
      return;
    }

    setIsAnalysing(true);
    setError("");
    setProgress(0);
    setMoves([]);
    setIdx(-1);

    try {
      setProgressLabel("Loading engine…");
      const worker = await initEngine();
      workerRef.current = worker;

      const START_FEN =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const allFens = [START_FEN, ...positions.map((p) => p.fen)];

      // Evaluate every position
      const evals: number[] = [];
      const bestMoves: string[] = [];

      for (let i = 0; i < allFens.length; i++) {
        setProgressLabel(`Evaluating position ${i + 1} / ${allFens.length}…`);
        setProgress(Math.round((i / allFens.length) * 92));
        const { score, bestUci } = await evalPosition(worker, allFens[i], 16);
        evals.push(score);
        bestMoves.push(bestUci);
      }

      setProgressLabel("Classifying moves…");
      setProgress(96);

      const analysed: AnalysedMove[] = positions.map((pos, i) => {
        const chess = new Chess(pos.fenBefore);
        const isWhite = chess.turn() === "w";

        const prevEvalWhite = evals[i]; // eval before move, White POV
        const currEvalWhite = evals[i + 1]; // eval after move, White POV

        // Convert to mover's POV
        const prevMover = isWhite ? prevEvalWhite : -prevEvalWhite;
        const currMover = isWhite ? currEvalWhite : -currEvalWhite;

        // CPL = how much the move cost the mover vs engine-best
        // If we had played the best move, eval would be ~prevMover
        // Actually: cpl = (eval_before_from_mover_pov) - (eval_after_from_mover_pov)
        // = playing worse than the engine by this many centipawns
        const cpl = Math.max(0, prevMover - currMover);

        const legalMoves = chess.moves();
        const forced = legalMoves.length === 1;
        const sacrifice =
          cpl <= 15 && isMaterialSacrifice(pos.fenBefore, pos.uci);

        return {
          san: pos.san,
          uci: pos.uci,
          fen: pos.fen,
          fenBefore: pos.fenBefore,
          eval: currEvalWhite,
          bestUci: bestMoves[i],
          cpl,
          classification: classifyMove(cpl, forced, sacrifice),
          isWhite,
        };
      });

      worker.terminate();
      workerRef.current = null;
      setMoves(analysed);
      setIdx(analysed.length - 1);
      setProgress(100);
      setProgressLabel("Done");
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setIsAnalysing(false);
    }
  }, [parsedPositions, initEngine, evalPosition]);

  useEffect(() => {
    if (autoStart && pgn?.trim()) runAnalysis();
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(-1, i - 1));
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min((moves.length || 1) - 1, i + 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [moves.length]);

  // Auto-scroll move list
  useEffect(() => {
    if (!moveListRef.current || idx < 0) return;
    const el = moveListRef.current.querySelector(`[data-idx="${idx}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [idx]);

  // ── Derived state ──
  const positions = parsedPositions();
  const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const currentFen =
    idx < 0 ? startFen : moves[idx]?.fen || positions[idx]?.fen || startFen;
  const currentMove = idx >= 0 ? moves[idx] : null;
  const cfg = currentMove ? CLASSIF[currentMove.classification] : null;

  // Best move arrow (green = best, orange = played if different from best)
  const arrows: [string, string, string][] = [];
  if (currentMove && showBestMove) {
    const playedArrow = uciToArrow(
      currentMove.uci,
      currentMove.classification === "blunder"
        ? "#DC2626"
        : currentMove.classification === "mistake"
          ? "#EA580C"
          : "#C8961E",
    );
    const bestArrow = uciToArrow(currentMove.bestUci, "#22C55E");
    if (bestArrow && currentMove.bestUci !== currentMove.uci)
      arrows.push(bestArrow);
    if (playedArrow) arrows.push(playedArrow);
  }

  // Accuracy per side
  const whiteMoves = moves.filter((m) => m.isWhite);
  const blackMoves = moves.filter((m) => !m.isWhite);
  const whiteAcc = whiteMoves.length
    ? cplToAccuracy(
        whiteMoves.reduce((s, m) => s + m.cpl, 0) / whiteMoves.length,
      )
    : 0;
  const blackAcc = blackMoves.length
    ? cplToAccuracy(
        blackMoves.reduce((s, m) => s + m.cpl, 0) / blackMoves.length,
      )
    : 0;

  // Stats breakdown
  const stats = moves.reduce(
    (acc, m) => {
      acc[m.classification] = (acc[m.classification] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      {/* ─── Top bar: Analyse button or re-analyse ─── */}
      {!moves.length && !isAnalysing && (
        <button
          onClick={runAnalysis}
          className="btn-primary flex items-center gap-2 w-full justify-center py-3 text-sm font-semibold"
        >
          <Brain size={16} />
          Analyse with Stockfish
        </button>
      )}

      {/* Progress */}
      {isAnalysing && (
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span
              className="flex items-center gap-2"
              style={{ color: "var(--text-mid)" }}
            >
              <Loader2
                size={12}
                className="animate-spin"
                style={{ color: "var(--amber)" }}
              />
              {progressLabel}
            </span>
            <span
              className="font-bold tabular-nums"
              style={{ color: "var(--amber)" }}
            >
              {progress}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "var(--amber)" }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="card p-4 flex items-start gap-3"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <p className="text-xs text-red-500 mt-1">
              Make sure{" "}
              <code className="bg-red-100 px-1 rounded">stockfish.js</code> is
              in your <code className="bg-red-100 px-1 rounded">/public</code>{" "}
              folder. Run{" "}
              <code className="bg-red-100 px-1 rounded">npm install</code> then{" "}
              <code className="bg-red-100 px-1 rounded">
                node scripts/copy-stockfish.js
              </code>
            </p>
          </div>
        </div>
      )}

      {/* ─── Main analysis layout ─── */}
      {moves.length > 0 && (
        <>
          {/* Accuracy row */}
          <div className="card p-4 flex items-center justify-around">
            <AccuracyRing
              accuracy={whiteAcc}
              label={playerNames?.white || "White"}
              color="#C8961E"
            />
            <div className="text-center">
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Accuracy
              </div>
              <div className="flex items-center gap-2">
                {[
                  { key: "blunder", icon: "??" },
                  { key: "mistake", icon: "?" },
                  { key: "inaccuracy", icon: "?!" },
                  { key: "good", icon: "○" },
                  { key: "best", icon: "✓" },
                  { key: "brilliant", icon: "✨" },
                ]
                  .filter((s) => stats[s.key])
                  .map((s) => (
                    <span
                      key={s.key}
                      className="flex items-center gap-0.5 text-xs font-medium"
                      style={{ color: CLASSIF[s.key as Classification].color }}
                    >
                      {s.icon} {stats[s.key]}
                    </span>
                  ))}
              </div>
            </div>
            <AccuracyRing
              accuracy={blackAcc}
              label={playerNames?.black || "Black"}
              color="#5C4A38"
            />
          </div>

          <div className="grid lg:grid-cols-[28px_1fr_260px] gap-4 items-start">
            {/* Eval bar */}
            <div className="flex items-center justify-center pt-2">
              <EvalBar value={currentMove?.eval ?? 0} />
            </div>

            {/* Board + controls */}
            <div className="space-y-3">
              <div className="relative">
                <Chessboard
                  position={currentFen}
                  boardWidth={400}
                  arePiecesDraggable={false}
                  customArrows={arrows as any}
                  customBoardStyle={{
                    borderRadius: "10px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                  }}
                />
              </div>

              {/* Nav */}
              <div className="flex items-center justify-center gap-2">
                {[
                  { icon: SkipBack, fn: () => setIdx(-1), label: "Start" },
                  {
                    icon: ChevronLeft,
                    fn: () => setIdx((i) => Math.max(-1, i - 1)),
                    label: "Prev",
                  },
                  {
                    icon: ChevronRight,
                    fn: () => setIdx((i) => Math.min(moves.length - 1, i + 1)),
                    label: "Next",
                  },
                  {
                    icon: SkipForward,
                    fn: () => setIdx(moves.length - 1),
                    label: "End",
                  },
                ].map(({ icon: Icon, fn, label }) => (
                  <button
                    key={label}
                    onClick={fn}
                    className="btn-secondary p-2 rounded-xl"
                    title={label}
                  >
                    <Icon size={16} />
                  </button>
                ))}
                <span
                  className="text-xs tabular-nums px-3 font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {idx < 0 ? "Start" : `${idx + 1} / ${moves.length}`}
                </span>
              </div>

              {/* Move annotation */}
              {cfg && currentMove && (
                <div
                  className="rounded-xl p-3 text-sm flex items-center gap-3"
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.color}30`,
                  }}
                >
                  <span className="text-xl shrink-0">
                    {cfg.icon === "??"
                      ? "😱"
                      : cfg.icon === "?"
                        ? "😬"
                        : cfg.icon === "?!"
                          ? "😐"
                          : cfg.icon === "✨"
                            ? "✨"
                            : cfg.icon === "✓"
                              ? "✅"
                              : "●"}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: cfg.color }}>
                      {currentMove.san} — {cfg.label}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Centipawn loss: {currentMove.cpl} cp
                      {currentMove.bestUci &&
                        currentMove.bestUci !== currentMove.uci && (
                          <span>
                            {" "}
                            · Best was{" "}
                            <span className="font-semibold font-mono">
                              {currentMove.bestUci.slice(0, 2)}→
                              {currentMove.bestUci.slice(2, 4)}
                            </span>
                          </span>
                        )}
                    </div>
                  </div>
                  {/* Toggle best move arrow */}
                  <button
                    onClick={() => setShowBestMove((v) => !v)}
                    className="text-xs px-2 py-1 rounded-lg border transition-all"
                    style={{
                      background: showBestMove ? cfg.bg : "var(--bg-subtle)",
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                    title="Toggle best move arrow"
                  >
                    {showBestMove ? "Hide arrow" : "Show arrow"}
                  </button>
                </div>
              )}
            </div>

            {/* Right panel: move list + stats */}
            <div className="space-y-3">
              {/* Stats */}
              <div className="card p-4 space-y-1.5">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Move Classification
                </p>
                {(
                  [
                    "brilliant",
                    "best",
                    "excellent",
                    "good",
                    "inaccuracy",
                    "mistake",
                    "blunder",
                  ] as Classification[]
                ).map((c) => {
                  const n = stats[c] || 0;
                  if (!n) return null;
                  const cfg2 = CLASSIF[c];
                  const pct = Math.round((n / moves.length) * 100);
                  return (
                    <div key={c} className="flex items-center gap-2">
                      <span
                        className="w-5 text-center font-bold text-xs shrink-0"
                        style={{ color: cfg2.color }}
                      >
                        {cfg2.icon}
                      </span>
                      <span
                        className="flex-1 text-xs capitalize"
                        style={{ color: "var(--text-mid)" }}
                      >
                        {c}
                      </span>
                      <div
                        className="w-16 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-subtle)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: cfg2.color }}
                        />
                      </div>
                      <span
                        className="text-xs font-bold w-5 text-right shrink-0"
                        style={{ color: cfg2.color }}
                      >
                        {n}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Move list */}
              <div className="card p-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider px-1 mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Moves
                </p>
                <div ref={moveListRef} className="max-h-72 overflow-y-auto">
                  <div className="grid grid-cols-[20px_1fr_1fr] gap-x-0.5 gap-y-0.5">
                    {Array.from({ length: Math.ceil(moves.length / 2) }).map(
                      (_, i) => {
                        const w = moves[i * 2];
                        const b = moves[i * 2 + 1];
                        return [
                          <span
                            key={`n${i}`}
                            className="text-[10px] font-bold pt-1.5 text-right pr-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {i + 1}.
                          </span>,
                          <button
                            key={`w${i}`}
                            data-idx={i * 2}
                            onClick={() => setIdx(i * 2)}
                            className="text-left text-xs px-1.5 py-1.5 rounded-lg font-medium transition-colors"
                            style={{
                              background:
                                idx === i * 2
                                  ? CLASSIF[w.classification].bg
                                  : "transparent",
                              color: CLASSIF[w.classification].color,
                              border:
                                idx === i * 2
                                  ? `1px solid ${CLASSIF[w.classification].color}40`
                                  : "1px solid transparent",
                            }}
                          >
                            {w.san}
                            <sup className="ml-0.5 opacity-70">
                              {CLASSIF[w.classification].icon}
                            </sup>
                          </button>,
                          b ? (
                            <button
                              key={`b${i}`}
                              data-idx={i * 2 + 1}
                              onClick={() => setIdx(i * 2 + 1)}
                              className="text-left text-xs px-1.5 py-1.5 rounded-lg font-medium transition-colors"
                              style={{
                                background:
                                  idx === i * 2 + 1
                                    ? CLASSIF[b.classification].bg
                                    : "transparent",
                                color: CLASSIF[b.classification].color,
                                border:
                                  idx === i * 2 + 1
                                    ? `1px solid ${CLASSIF[b.classification].color}40`
                                    : "1px solid transparent",
                              }}
                            >
                              {b.san}
                              <sup className="ml-0.5 opacity-70">
                                {CLASSIF[b.classification].icon}
                              </sup>
                            </button>
                          ) : (
                            <span key={`e${i}`} />
                          ),
                        ];
                      },
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={runAnalysis}
                disabled={isAnalysing}
                className="btn-secondary text-xs w-full flex items-center justify-center gap-1.5 py-2"
              >
                <RotateCcw size={12} />
                Re-analyse
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
