"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useLessons,
  useMyLessonProgress,
  useCompleteLesson,
} from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  Video,
  FileText,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
  Tag,
  TrendingUp,
} from "lucide-react";

// ─── Level config ─────────────────────────────────────────────
const LEVEL_CFG: Record<string, { color: string; bg: string; stars: number }> =
  {
    beginner: { color: "#15803D", bg: "#DCFCE7", stars: 1 },
    intermediate: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)", stars: 2 },
    advanced: { color: "#DC2626", bg: "#FEE2E2", stars: 3 },
    expert: { color: "#7C3AED", bg: "#EDE9FE", stars: 4 },
  };

// ─── PGN move viewer ──────────────────────────────────────────
function parsePgnMoves(pgn: string): string[] {
  if (!pgn) return [];
  const body = pgn.replace(/\[.*?\]\s*/g, "").trim();
  const noComments = body.replace(/\{[^}]*\}/g, "").replace(/\([^)]*\)/g, "");
  const tokens = noComments
    .split(/\s+/)
    .filter(
      (t) =>
        t && !/^\d+\./.test(t) && !["1-0", "0-1", "1/2-1/2", "*"].includes(t),
    );
  return tokens;
}

function PgnViewer({ pgn }: { pgn: string }) {
  const [showFull, setShowFull] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const moves = parsePgnMoves(pgn);
  const pairs: [string, string?][] = [];
  for (let i = 0; i < moves.length; i += 2)
    pairs.push([moves[i], moves[i + 1]]);
  const displayPairs = showFull ? pairs : pairs.slice(0, 12);

  return (
    <div className="space-y-3">
      {/* Move grid */}
      <div
        className="p-4 rounded-xl"
        style={{ background: "var(--bg-subtle)" }}
      >
        <div className="flex flex-wrap gap-1.5">
          {displayPairs.map(([w, b], i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5"
              style={{
                background: "white",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-dm-mono)",
              }}
            >
              <span
                className="text-[10px] font-bold"
                style={{ color: "var(--text-muted)", minWidth: "16px" }}
              >
                {i + 1}.
              </span>
              <span className="font-medium" style={{ color: "#1e40af" }}>
                {w}
              </span>
              {b && <span style={{ color: "#9f1239" }}>{b}</span>}
            </span>
          ))}
        </div>

        {pairs.length > 12 && (
          <button
            onClick={() => setShowFull((f) => !f)}
            className="mt-2 flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--amber)" }}
          >
            {showFull ? (
              <>
                <ChevronUp size={12} />
                Show fewer moves
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                {pairs.length - 12} more moves...
              </>
            )}
          </button>
        )}
      </div>
      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <span>
          {moves.length} half-moves · {pairs.length} full moves
        </span>
        <button onClick={() => setShowRaw((f) => !f)} className="underline">
          {showRaw ? "Hide" : "Show"} raw PGN
        </button>
      </div>
      {showRaw && (
        <pre
          className="p-3 rounded-xl text-[10px] overflow-x-auto leading-relaxed"
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            fontFamily: "var(--font-dm-mono)",
          }}
        >
          {pgn}
        </pre>
      )}
    </div>
  );
}

// ─── Lesson detail modal (student view) ───────────────────────
function LessonModal({
  lesson,
  isDone,
  onComplete,
  completing,
}: {
  lesson: any;
  isDone: boolean;
  onComplete: () => void;
  completing: boolean;
}) {
  const cfg = LEVEL_CFG[lesson.level] || LEVEL_CFG.beginner;

  const getYoutubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/);
    return m?.[1];
  };
  const ytId = lesson.video_url ? getYoutubeId(lesson.video_url) : null;

  return (
    <Modal title={lesson.title} onClose={() => {}}>
      <div
        className="space-y-5"
        style={{
          minWidth: "min(580px, 92vw)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="badge text-xs capitalize"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {"★".repeat(cfg.stars)}
            {"☆".repeat(4 - cfg.stars)} {lesson.level}
          </span>
          {isDone && (
            <span
              className="badge text-xs"
              style={{ background: "#DCFCE7", color: "#15803D" }}
            >
              <CheckCircle2 size={9} className="inline mr-1" />
              Completed
            </span>
          )}
          {lesson.tags?.map((t: string) => (
            <span key={t} className="badge badge-gray text-xs">
              <Tag size={9} className="inline mr-1" />
              {t}
            </span>
          ))}
        </div>

        {lesson.description && (
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-mid)" }}
          >
            {lesson.description}
          </p>
        )}

        {/* Video embed */}
        {ytId && (
          <div>
            <h4
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <Video size={14} style={{ color: "#7C3AED" }} />
              Video
            </h4>
            <div
              className="relative w-full rounded-xl overflow-hidden"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}`}
                allowFullScreen
                title={lesson.title}
              />
            </div>
          </div>
        )}
        {lesson.video_url && !ytId && (
          <a
            href={lesson.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-xl border font-medium text-sm"
            style={{
              background: "var(--bg-subtle)",
              borderColor: "var(--border)",
              color: "#1D4ED8",
            }}
          >
            <Play size={14} />
            Watch video ↗
          </a>
        )}

        {/* PGN */}
        {lesson.pgn && (
          <div>
            <h4
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <BookOpen size={14} style={{ color: "var(--amber)" }} />
              Game Moves
            </h4>
            <PgnViewer pgn={lesson.pgn} />
          </div>
        )}

        {/* Complete button */}
        <div className="pt-2">
          {isDone ? (
            <div
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm"
              style={{ background: "#DCFCE7", color: "#15803D" }}
            >
              <CheckCircle2 size={16} />
              Lesson Completed ✓
            </div>
          ) : (
            <button
              onClick={onComplete}
              disabled={completing}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {completing ? (
                <>
                  <span className="animate-spin">⟳</span> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Mark as Complete
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function LessonsPage() {
  const { user } = useAuth();
  const { data: lessons = [], isLoading } = useLessons({
    academyId: user?.academyId,
  });
  const { data: progress = [] } = useMyLessonProgress();
  const complete = useCompleteLesson();

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openLesson, setOpenLesson] = useState<any>(null);

  if (isLoading) return <PageLoading />;

  const completedIds = new Set(
    (progress as any[]).filter((p) => p.completed).map((p) => p.lesson_id),
  );
  const completedCount = lessons.filter((l: any) =>
    completedIds.has(l.id),
  ).length;
  const pct =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

  const filtered = lessons.filter((l: any) => {
    if (
      search &&
      !l.title.toLowerCase().includes(search.toLowerCase()) &&
      !(l.description || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterLevel !== "all" && l.level !== filterLevel) return false;
    if (filterStatus === "completed" && !completedIds.has(l.id)) return false;
    if (filterStatus === "pending" && completedIds.has(l.id)) return false;
    return true;
  });

  const handleComplete = async () => {
    if (!openLesson) return;
    await complete.mutateAsync(openLesson.id);
    setOpenLesson(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {openLesson && (
        <LessonModal
          lesson={openLesson}
          isDone={completedIds.has(openLesson.id)}
          onComplete={handleComplete}
          completing={complete.isPending}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BookOpen size={22} style={{ color: "#1D4ED8" }} />
          Lessons
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {completedCount} of {lessons.length} completed
        </p>
      </div>

      {/* Progress bar */}
      {lessons.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span
              className="flex items-center gap-2"
              style={{ color: "var(--text-mid)" }}
            >
              <TrendingUp size={14} style={{ color: "#1D4ED8" }} />
              Overall Progress
            </span>
            <span className="font-semibold" style={{ color: "#1D4ED8" }}>
              {pct}%
            </span>
          </div>
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "#15803D" : "#1D4ED8",
              }}
            />
          </div>
          {pct === 100 && (
            <p
              className="text-xs mt-2 text-center"
              style={{ color: "#15803D" }}
            >
              🎉 You've completed all lessons!
            </p>
          )}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1" style={{ minWidth: "180px" }}>
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8"
            placeholder="Search lessons..."
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "pending", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all"
              style={
                filterStatus === f
                  ? {
                      background: "#1D4ED8",
                      color: "white",
                      borderColor: "#1D4ED8",
                    }
                  : {
                      background: "var(--bg-subtle)",
                      color: "var(--text-muted)",
                      borderColor: "var(--border)",
                    }
              }
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "beginner", "intermediate", "advanced", "expert"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilterLevel(f)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all"
                style={
                  filterLevel === f
                    ? {
                        background: "var(--amber)",
                        color: "white",
                        borderColor: "var(--amber)",
                      }
                    : {
                        background: "var(--bg-subtle)",
                        color: "var(--text-muted)",
                        borderColor: "var(--border)",
                      }
                }
              >
                {f}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Lessons */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title={
              lessons.length === 0
                ? "No lessons available yet"
                : "No lessons match filters"
            }
            subtitle={
              lessons.length === 0
                ? "Your coach will publish lessons here"
                : "Try adjusting search or filters"
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((lesson: any) => {
            const done = completedIds.has(lesson.id);
            const cfg = LEVEL_CFG[lesson.level] || LEVEL_CFG.beginner;
            const hasPgn = !!lesson.pgn;
            const hasVideo = !!lesson.video_url;
            const moves = hasPgn
              ? (parsePgnMoves(lesson.pgn).length / 2) | 0
              : 0;

            return (
              <button
                key={lesson.id}
                onClick={() => setOpenLesson(lesson)}
                className="card p-5 text-left w-full flex flex-col gap-3 transition-all hover:shadow-md"
                style={done ? { opacity: 0.8 } : {}}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="badge text-xs capitalize"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {"★".repeat(cfg.stars)} {lesson.level}
                    </span>
                    {hasPgn && (
                      <span
                        className="badge text-xs"
                        style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                      >
                        <FileText size={9} className="inline mr-1" />
                        PGN
                      </span>
                    )}
                    {hasVideo && (
                      <span
                        className="badge text-xs"
                        style={{ background: "#F5F3FF", color: "#7C3AED" }}
                      >
                        <Video size={9} className="inline mr-1" />
                        Video
                      </span>
                    )}
                  </div>
                  {done && (
                    <CheckCircle2
                      size={18}
                      style={{ color: "#15803D", flexShrink: 0 }}
                    />
                  )}
                </div>

                {/* Title + description */}
                <div>
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {lesson.description}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {lesson.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {lesson.tags.slice(0, 3).map((t: string) => (
                      <span key={t} className="badge badge-gray text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div
                  className="flex items-center justify-between mt-auto text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div className="flex items-center gap-3">
                    {hasPgn && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={10} />
                        {moves} moves
                      </span>
                    )}
                    {hasVideo && (
                      <span className="flex items-center gap-1">
                        <Play size={10} />
                        Video
                      </span>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: done ? "#15803D" : "#1D4ED8" }}
                  >
                    {done ? "Completed ✓" : "Open →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
