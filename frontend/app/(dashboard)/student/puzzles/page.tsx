"use client";
import { useState, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useAuth } from "@/lib/auth-context";
import {
  useRandomPuzzle,
  useSubmitPuzzle,
  useCustomPuzzles,
  useSubmitCustomPuzzle,
  useMcqQuestions,
  useSubmitMcq,
  usePuzzleLeaderboard,
  useMyPuzzleRank,
} from "@/lib/hooks";
import { PageLoading } from "@/components/shared/States";
import Avatar from "@/components/shared/Avatar";
import {
  Puzzle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Flame,
  HelpCircle,
  Trophy,
  CheckSquare,
  Square,
  Lightbulb,
  TrendingUp,
  Target,
  Star,
  Medal,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const DIFF_CFG: Record<string, { color: string; bg: string }> = {
  beginner: { color: "#15803D", bg: "#DCFCE7" },
  intermediate: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)" },
  advanced: { color: "#DC2626", bg: "#FEE2E2" },
  expert: { color: "#7C3AED", bg: "#EDE9FE" },
};

// ─── Leaderboard tab ──────────────────────────────────────────
function LeaderboardTab({
  academyId,
  myId,
}: {
  academyId?: string;
  myId?: string;
}) {
  const { data, isLoading } = usePuzzleLeaderboard(academyId);
  const { data: myRank } = useMyPuzzleRank();
  const lb: any[] = data?.leaderboard || [];

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "var(--amber)" }}
        />
      </div>
    );

  if (lb.length === 0)
    return (
      <div className="text-center py-16">
        <Trophy
          size={40}
          className="mx-auto mb-3"
          style={{ color: "var(--border-md)" }}
        />
        <p className="font-medium" style={{ color: "var(--text)" }}>
          No rankings yet
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Solve puzzles and answer MCQs to appear here
        </p>
      </div>
    );

  const myRankPos = myRank ? lb.findIndex((r) => r.user_id === myId) + 1 : null;

  return (
    <div className="space-y-4">
      {/* My rank card */}
      {myRank && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: "rgba(200,150,30,0.06)",
            border: "1px solid rgba(200,150,30,0.3)",
          }}
        >
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--amber)" }}
          >
            YOUR RANKING
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center">
              <div
                className="font-display text-3xl font-bold"
                style={{ color: "var(--amber)" }}
              >
                #{myRankPos || "—"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Rank
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3 text-center">
              <div
                className="p-2 rounded-xl"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="font-bold text-base"
                  style={{ color: "#7C3AED" }}
                >
                  {myRank.lichess_solved || 0}
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Lichess
                </div>
              </div>
              <div
                className="p-2 rounded-xl"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="font-bold text-base"
                  style={{ color: "#1D4ED8" }}
                >
                  {myRank.custom_solved || 0}
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Custom
                </div>
              </div>
              <div
                className="p-2 rounded-xl"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="font-bold text-base"
                  style={{ color: "#15803D" }}
                >
                  {myRank.mcq_points || 0}
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  MCQ pts
                </div>
              </div>
            </div>
            <div className="text-center">
              <div
                className="font-display text-3xl font-bold"
                style={{ color: "var(--text)" }}
              >
                {myRank.total_score}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Total
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="card overflow-hidden">
        <div
          className="px-4 py-3 text-xs font-semibold grid grid-cols-12 gap-2"
          style={{
            background: "var(--bg-subtle)",
            color: "var(--text-muted)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Student</div>
          <div className="col-span-2 text-center hidden sm:block">Lichess</div>
          <div className="col-span-2 text-center hidden sm:block">Custom</div>
          <div className="col-span-2 text-center hidden sm:block">MCQ pts</div>
          <div className="col-span-3 sm:col-span-1 text-center font-bold">
            Total
          </div>
        </div>
        {lb.map((row, i) => {
          const isMe = row.user_id === myId;
          const rankEmoji =
            i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
          return (
            <div
              key={row.user_id}
              className="px-4 py-3 grid grid-cols-12 gap-2 items-center border-b last:border-0 transition-colors"
              style={{
                borderColor: "var(--border)",
                background: isMe ? "rgba(200,150,30,0.04)" : undefined,
              }}
            >
              <div className="col-span-1 text-center text-sm font-bold">
                {rankEmoji || (
                  <span style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                )}
              </div>
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <Avatar
                  user={{ name: row.name, avatar: row.avatar, role: "student" }}
                  size="xs"
                />
                <span
                  className="text-sm truncate font-medium"
                  style={{ color: isMe ? "var(--amber)" : "var(--text)" }}
                >
                  {row.name}
                  {isMe ? " (you)" : ""}
                </span>
              </div>
              <div
                className="col-span-2 text-center text-sm font-mono hidden sm:block"
                style={{ color: "#7C3AED" }}
              >
                {row.lichess_solved || 0}
              </div>
              <div
                className="col-span-2 text-center text-sm font-mono hidden sm:block"
                style={{ color: "#1D4ED8" }}
              >
                {row.custom_solved || 0}
              </div>
              <div
                className="col-span-2 text-center text-sm font-mono hidden sm:block"
                style={{ color: "#15803D" }}
              >
                {row.mcq_points || 0}
              </div>
              <div
                className="col-span-3 sm:col-span-1 text-center font-display font-bold text-sm"
                style={{ color: "var(--amber)" }}
              >
                {row.total_score}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
        Score = Lichess puzzles solved + Custom puzzles solved + MCQ points
      </p>
    </div>
  );
}

// ─── MCQ Question card ────────────────────────────────────────
function McqCard({ q }: { q: any }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<any>(null);
  const startTime = useRef(Date.now());
  const submitMcq = useSubmitMcq();

  const toggle = (optId: string) => {
    if (result) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (q.allow_multiple) {
        next.has(optId) ? next.delete(optId) : next.add(optId);
      } else {
        next.clear();
        next.add(optId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0 || result) return;
    const res = await submitMcq.mutateAsync({
      id: q.id,
      selectedOptionIds: Array.from(selected),
      timeTakenMs: Date.now() - startTime.current,
    });
    setResult(res.data);
  };

  const attempted = !!q.attempted_by_me;

  const getOptionStyle = (opt: any) => {
    if (!result) {
      return selected.has(opt.id)
        ? {
            background: "rgba(29,78,216,0.1)",
            border: "2px solid #1D4ED8",
            color: "var(--text)",
          }
        : {
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            color: "var(--text-mid)",
          };
    }
    const isSelected = selected.has(opt.id);
    const isCorrectOpt = result.correctOptionIds?.includes(opt.id);
    if (isCorrectOpt)
      return {
        background: "#DCFCE7",
        border: "2px solid #15803D",
        color: "#15803D",
      };
    if (isSelected && !isCorrectOpt)
      return {
        background: "#FEE2E2",
        border: "2px solid #DC2626",
        color: "#DC2626",
      };
    return {
      background: "var(--bg-subtle)",
      border: "1px solid var(--border)",
      color: "var(--text-muted)",
    };
  };

  const cfg = DIFF_CFG[q.difficulty] || DIFF_CFG.intermediate;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: attempted ? "#DCFCE7" : "#EFF6FF" }}
        >
          {attempted ? (
            <CheckCircle2 size={16} style={{ color: "#15803D" }} />
          ) : (
            <HelpCircle size={16} style={{ color: "#1D4ED8" }} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="badge text-xs capitalize"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {q.difficulty}
            </span>
            {q.allow_multiple && (
              <span
                className="badge text-xs"
                style={{ background: "#EFF6FF", color: "#1D4ED8" }}
              >
                <CheckSquare size={9} className="inline mr-1" />
                Select all that apply
              </span>
            )}
            <span
              className="badge text-xs"
              style={{
                background: "rgba(200,150,30,0.1)",
                color: "var(--amber)",
              }}
            >
              {q.points || 1} {q.points === 1 ? "point" : "points"}
            </span>
          </div>
          <p
            className="font-semibold text-sm leading-relaxed"
            style={{ color: "var(--text)" }}
          >
            {q.question}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {(q.options || []).map((opt: any) => {
          const isSelected = selected.has(opt.id);
          const style = getOptionStyle(opt);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={!!result || attempted}
              onClick={() => toggle(opt.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={style}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {q.allow_multiple ? (
                  isSelected ? (
                    <CheckSquare size={15} />
                  ) : (
                    <Square size={15} />
                  )
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center`}
                    style={{
                      borderColor: isSelected ? "#1D4ED8" : "var(--border-md)",
                      background: isSelected ? "#1D4ED8" : "transparent",
                    }}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                )}
              </div>
              <span className="text-sm">{opt.option_text}</span>
              {result && result.correctOptionIds?.includes(opt.id) && (
                <CheckCircle2
                  size={14}
                  className="ml-auto flex-shrink-0"
                  style={{ color: "#15803D" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Result / explanation */}
      {result && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: result.isCorrect ? "#DCFCE7" : "#FEE2E2",
            border: `1px solid ${result.isCorrect ? "#BBF7D0" : "#FECACA"}`,
          }}
        >
          <div
            className="flex items-center gap-2 font-semibold text-sm mb-1"
            style={{ color: result.isCorrect ? "#15803D" : "#DC2626" }}
          >
            {result.isCorrect ? (
              <>
                <CheckCircle2 size={15} />
                Correct! +{result.pointsEarned} points
              </>
            ) : (
              <>
                <XCircle size={15} />
                Incorrect
              </>
            )}
          </div>
          {result.explanation && (
            <p
              className="text-sm mt-1"
              style={{ color: result.isCorrect ? "#166534" : "#991B1B" }}
            >
              {result.explanation}
            </p>
          )}
        </div>
      )}

      {/* Already attempted */}
      {attempted && !result && (
        <div
          className="flex items-center gap-2 text-sm py-2 px-3 rounded-xl"
          style={{
            background: q.my_correct ? "#DCFCE7" : "#FEF9C3",
            color: q.my_correct ? "#15803D" : "#92400E",
          }}
        >
          {q.my_correct ? <CheckCircle2 size={14} /> : <Target size={14} />}
          {q.my_correct
            ? "You answered this correctly"
            : "You attempted this — answer was incorrect"}
        </div>
      )}

      {!attempted && !result && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitMcq.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
        >
          {submitMcq.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ChevronRight size={15} />
          )}
          Submit Answer
        </button>
      )}
    </div>
  );
}

// ─── Custom Puzzle card ───────────────────────────────────────
function CustomPuzzleCard({ puzzle }: { puzzle: any }) {
  const [expanded, setExpanded] = useState(false);
  const [chess, setChess] = useState(() => {
    try {
      return new Chess(puzzle.fen);
    } catch {
      return new Chess();
    }
  });
  const [movesPlayed, setMovesPlayed] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const startTime = useRef(Date.now());
  const submitCustom = useSubmitCustomPuzzle();

  const cfg = DIFF_CFG[puzzle.difficulty] || DIFF_CFG.intermediate;
  const isSolved = !!puzzle.solved_by_me;

  const handleMove = useCallback(
    async (from: string, to: string) => {
      if (result || !expanded) return false;
      const g = new Chess(chess.fen());
      const m = g.move({ from, to, promotion: "q" });
      if (!m) return false;

      const uciMove = from + to + (m.promotion || "");
      const newMoves = [...movesPlayed, uciMove];
      setMovesPlayed(newMoves);
      setChess(g);

      // Auto-submit after each move attempt
      const expected = puzzle.solution_moves.trim().toLowerCase().split(/\s+/);
      if (newMoves.length >= expected.length) {
        const res = await submitCustom.mutateAsync({
          id: puzzle.id,
          moves: newMoves,
          timeTakenMs: Date.now() - startTime.current,
        });
        setResult(res.data);
      }
      return true;
    },
    [chess, movesPlayed, expanded, puzzle, result, submitCustom],
  );

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 p-5 text-left transition-all hover:bg-[var(--bg)]"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isSolved ? "#DCFCE7" : cfg.bg }}
        >
          {isSolved ? (
            <CheckCircle2 size={18} style={{ color: "#15803D" }} />
          ) : (
            <Puzzle size={18} style={{ color: cfg.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="badge text-xs capitalize"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {puzzle.difficulty}
            </span>
            {isSolved && (
              <span
                className="badge text-xs"
                style={{ background: "#DCFCE7", color: "#15803D" }}
              >
                Solved ✓
              </span>
            )}
            {puzzle.themes?.slice(0, 3).map((t: string) => (
              <span key={t} className="badge badge-gray text-xs">
                {t}
              </span>
            ))}
          </div>
          <h3
            className="font-semibold text-sm"
            style={{ color: "var(--text)" }}
          >
            {puzzle.title}
          </h3>
          {puzzle.description && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {puzzle.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {parseInt(puzzle.solved_count) || 0} solved
          </span>
          {expanded ? (
            <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 pt-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="pt-4 flex flex-col lg:flex-row gap-5">
            {/* Board */}
            <div className="flex-shrink-0">
              <div className="w-64 mx-auto lg:mx-0">
                <Chessboard
                  position={chess.fen()}
                  onPieceDrop={handleMove}
                  arePiecesDraggable={!result && !isSolved}
                  boardWidth={256}
                  customBoardStyle={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                  customDarkSquareStyle={{ backgroundColor: "#B58863" }}
                  customLightSquareStyle={{ backgroundColor: "#F0D9B5" }}
                />
                {isSolved && (
                  <p
                    className="text-xs text-center mt-2 font-medium"
                    style={{ color: "#15803D" }}
                  >
                    Already solved ✓
                  </p>
                )}
              </div>
            </div>

            {/* Info panel */}
            <div className="flex-1 space-y-3">
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: "var(--bg-subtle)" }}
              >
                <p
                  className="font-semibold mb-1"
                  style={{ color: "var(--text)" }}
                >
                  {chess.turn() === "w" ? "⬜ White" : "⬛ Black"} to move
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Drag pieces to make your move. Find the best continuation.
                </p>
              </div>

              {/* Moves played */}
              {movesPlayed.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {movesPlayed.map((m, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-lg font-mono"
                      style={{
                        background: "var(--bg-hover)",
                        color: "var(--text-mid)",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Hint */}
              {puzzle.hint && !result && (
                <button
                  onClick={() => setShowHint((h) => !h)}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "var(--amber)" }}
                >
                  <Lightbulb size={12} />
                  {showHint ? "Hide hint" : "Show hint"}
                </button>
              )}
              {showHint && puzzle.hint && (
                <div
                  className="p-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(200,150,30,0.08)",
                    border: "1px solid rgba(200,150,30,0.3)",
                  }}
                >
                  💡 {puzzle.hint}
                </div>
              )}

              {/* Result */}
              {result && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: result.isCorrect ? "#DCFCE7" : "#FEE2E2",
                    border: `1px solid ${result.isCorrect ? "#BBF7D0" : "#FECACA"}`,
                  }}
                >
                  <div
                    className="font-semibold text-sm flex items-center gap-2"
                    style={{ color: result.isCorrect ? "#15803D" : "#DC2626" }}
                  >
                    {result.isCorrect ? (
                      <>
                        <CheckCircle2 size={15} />
                        Correct! Puzzle solved!
                      </>
                    ) : (
                      <>
                        <XCircle size={15} />
                        Not quite right
                      </>
                    )}
                  </div>
                  {result.solutionPgn && (
                    <p
                      className="text-xs mt-2"
                      style={{
                        color: result.isCorrect ? "#166534" : "#991B1B",
                      }}
                    >
                      Solution: {result.solutionPgn}
                    </p>
                  )}
                  {!result.isCorrect && (
                    <button
                      onClick={() => {
                        setChess(new Chess(puzzle.fen));
                        setMovesPlayed([]);
                        setResult(null);
                        setShowHint(false);
                        startTime.current = Date.now();
                      }}
                      className="mt-2 text-xs font-medium"
                      style={{ color: "#DC2626" }}
                    >
                      Try again →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function PuzzlesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"lichess" | "custom" | "mcq" | "leaderboard">(
    "custom",
  );
  const [difficulty, setDifficulty] = useState("intermediate");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [hint, setHint] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Lichess puzzle
  const {
    data: lichessPuzzle,
    isLoading: lLoading,
    refetch,
    isFetching,
  } = useRandomPuzzle(difficulty);
  const submitLichess = useSubmitPuzzle();
  const [lichessChess, setLichessChess] = useState<Chess | null>(null);

  // Custom & MCQ
  const { data: customPuzzles = [], isLoading: cLoading } = useCustomPuzzles();
  const { data: mcqs = [], isLoading: mLoading } = useMcqQuestions();
  const { data: myRank } = useMyPuzzleRank();

  const customSolved = customPuzzles.filter((p: any) => p.solved_by_me).length;
  const mcqCorrect = mcqs.filter((m: any) => m.my_correct).length;
  const totalScore = myRank?.total_score || customSolved + mcqCorrect;

  // Setup lichess chess on puzzle change
  const setupLichess = useCallback(() => {
    if (!lichessPuzzle?.fen) return;
    try {
      const g = new Chess(lichessPuzzle.fen);
      setLichessChess(g);
    } catch {}
    setResult(null);
    setHint(false);
    startTimeRef.current = Date.now();
  }, [lichessPuzzle]);

  const handleLichessMove = useCallback(
    async (from: string, to: string) => {
      if (!lichessChess || !lichessPuzzle || result) return false;
      const g = new Chess(lichessChess.fen());
      const m = g.move({ from, to, promotion: "q" });
      if (!m) return false;
      setLichessChess(g);

      const uciMove = from + to + (m.promotion || "");
      try {
        const res = await submitLichess.mutateAsync({
          id: lichessPuzzle.id,
          moves: [uciMove],
          timeTakenMs: Date.now() - startTimeRef.current,
        });
        setResult(res.data.isCorrect ? "correct" : "wrong");
      } catch {
        setResult("wrong");
      }
      return true;
    },
    [lichessChess, lichessPuzzle, result, submitLichess],
  );

  const TABS = [
    { key: "custom", label: "Custom Puzzles", count: customPuzzles.length },
    { key: "mcq", label: "MCQ Quiz", count: mcqs.length },
    { key: "lichess", label: "Lichess Puzzles", count: null },
    { key: "leaderboard", label: "🏆 Leaderboard", count: null },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Puzzle size={22} style={{ color: "#7C3AED" }} />
          Puzzles & Quizzes
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div
            className="font-display text-2xl font-bold"
            style={{ color: "#7C3AED" }}
          >
            {customSolved}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Custom Solved
          </div>
        </div>
        <div className="stat-card">
          <div
            className="font-display text-2xl font-bold"
            style={{ color: "#1D4ED8" }}
          >
            {mcqCorrect}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            MCQs Correct
          </div>
        </div>
        <div className="stat-card">
          <div
            className="font-display text-2xl font-bold"
            style={{ color: "var(--amber)" }}
          >
            {totalScore}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Total Score
          </div>
        </div>
        <div className="stat-card">
          <div
            className="font-display text-2xl font-bold flex items-center gap-1"
            style={{ color: "#F97316" }}
          >
            <Trophy size={18} />#{myRank ? myRank.rank || "—" : "—"}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Your Rank
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 card p-1 rounded-xl overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={
              tab === t.key
                ? { background: "rgba(124,58,237,0.12)", color: "#7C3AED" }
                : { color: "var(--text-muted)" }
            }
          >
            {t.label}
            {t.count !== null && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background:
                    tab === t.key ? "rgba(124,58,237,0.15)" : "var(--bg-hover)",
                  color: tab === t.key ? "#7C3AED" : "var(--text-muted)",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CUSTOM PUZZLES TAB ── */}
      {tab === "custom" &&
        (cLoading ? (
          <PageLoading />
        ) : customPuzzles.length === 0 ? (
          <div className="card p-10 text-center">
            <Puzzle
              size={36}
              className="mx-auto mb-3"
              style={{ color: "var(--border-md)" }}
            />
            <p className="font-medium" style={{ color: "var(--text)" }}>
              No puzzles yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Your coach hasn't added any puzzles yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customPuzzles.map((p: any) => (
              <CustomPuzzleCard key={p.id} puzzle={p} />
            ))}
          </div>
        ))}

      {/* ── MCQ TAB ── */}
      {tab === "mcq" &&
        (mLoading ? (
          <PageLoading />
        ) : mcqs.length === 0 ? (
          <div className="card p-10 text-center">
            <HelpCircle
              size={36}
              className="mx-auto mb-3"
              style={{ color: "var(--border-md)" }}
            />
            <p className="font-medium" style={{ color: "var(--text)" }}>
              No MCQ questions yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Your coach hasn't added any quiz questions yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {mcqCorrect} / {mcqs.length} answered correctly
              </p>
              <div
                className="h-2 w-32 rounded-full overflow-hidden"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${mcqs.length > 0 ? (mcqCorrect / mcqs.length) * 100 : 0}%`,
                    background: "#15803D",
                  }}
                />
              </div>
            </div>
            {mcqs.map((q: any) => (
              <McqCard key={q.id} q={q} />
            ))}
          </div>
        ))}

      {/* ── LICHESS TAB ── */}
      {tab === "lichess" && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 card p-1 rounded-xl w-fit">
            {["beginner", "intermediate", "advanced", "expert"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setResult(null);
                  setHint(false);
                  refetch();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={
                  difficulty === d
                    ? { background: "rgba(124,58,237,0.12)", color: "#7C3AED" }
                    : { color: "var(--text-muted)" }
                }
              >
                {d}
              </button>
            ))}
          </div>

          {lLoading || !lichessPuzzle ? (
            <div className="card p-10 text-center">
              <Loader2
                size={28}
                className="animate-spin mx-auto"
                style={{ color: "#7C3AED" }}
              />
            </div>
          ) : (
            <div className="card p-5">
              {!lichessChess && (
                <button
                  onClick={setupLichess}
                  className="btn-primary w-full mb-4"
                >
                  Load Puzzle
                </button>
              )}
              {lichessChess && (
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="flex-shrink-0 mx-auto lg:mx-0">
                    <Chessboard
                      position={lichessChess.fen()}
                      onPieceDrop={handleLichessMove}
                      arePiecesDraggable={!result}
                      boardWidth={300}
                      customBoardStyle={{
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                      customDarkSquareStyle={{ backgroundColor: "#B58863" }}
                      customLightSquareStyle={{ backgroundColor: "#F0D9B5" }}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {lichessChess.turn() === "w" ? "⬜ White" : "⬛ Black"}{" "}
                        to move
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Rating: {lichessPuzzle.rating}
                      </p>
                    </div>
                    {lichessPuzzle.themes?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lichessPuzzle.themes.slice(0, 4).map((t: string) => (
                          <span key={t} className="badge badge-gray text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {hint && lichessPuzzle.moves && (
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: "rgba(200,150,30,0.08)" }}
                      >
                        <p
                          className="text-xs"
                          style={{ color: "var(--amber)" }}
                        >
                          First move: {lichessPuzzle.moves.split(" ")[0]}
                        </p>
                      </div>
                    )}
                    {result && (
                      <div
                        className="p-3 rounded-xl"
                        style={{
                          background:
                            result === "correct" ? "#DCFCE7" : "#FEE2E2",
                        }}
                      >
                        <p
                          className="font-semibold text-sm flex items-center gap-2"
                          style={{
                            color: result === "correct" ? "#15803D" : "#DC2626",
                          }}
                        >
                          {result === "correct" ? (
                            <>
                              <CheckCircle2 size={15} />
                              Correct!
                            </>
                          ) : (
                            <>
                              <XCircle size={15} />
                              Incorrect
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {!hint && !result && (
                        <button
                          onClick={() => setHint(true)}
                          className="btn-secondary text-xs flex items-center gap-1.5"
                        >
                          <Lightbulb size={12} />
                          Hint
                        </button>
                      )}
                      <button
                        onClick={() => {
                          refetch();
                          setLichessChess(null);
                          setResult(null);
                          setHint(false);
                        }}
                        disabled={isFetching}
                        className="btn-secondary text-xs flex items-center gap-1.5 ml-auto"
                      >
                        {isFetching ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        Next Puzzle
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {tab === "leaderboard" && (
        <LeaderboardTab academyId={user?.academyId} myId={user?.id} />
      )}
    </div>
  );
}
