"use client";
import { useState, useRef } from "react";
import {
  useMyLessons,
  useCreateLesson,
  useUpdateLesson,
  usePublishLesson,
  useDeleteLesson,
} from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import {
  BookOpen,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Upload,
  Tag,
  Clock,
  BarChart2,
  Loader2,
  Save,
  X,
  Globe,
  Lock,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────
const LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const LEVEL_CFG: Record<string, { color: string; bg: string }> = {
  beginner: { color: "#15803D", bg: "#DCFCE7" },
  intermediate: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)" },
  advanced: { color: "#DC2626", bg: "#FEE2E2" },
  expert: { color: "#7C3AED", bg: "#EDE9FE" },
};

// ─── PGN formatter — parse moves from PGN text ────────────────
function parsePgnMoves(pgn: string): string[] {
  if (!pgn) return [];
  // Strip headers ([Event "..."])
  const body = pgn.replace(/\[.*?\]\s*/g, "").trim();
  // Strip comments { ... }
  const noComments = body.replace(/\{[^}]*\}/g, "").replace(/\([^)]*\)/g, "");
  // Extract move tokens (1. e4 e5 2. Nf3 ...)
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
  if (!pgn)
    return (
      <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
        No PGN attached
      </p>
    );

  const moves = parsePgnMoves(pgn);
  const pairs: [string, string?][] = [];
  for (let i = 0; i < moves.length; i += 2)
    pairs.push([moves[i], moves[i + 1]]);

  const displayPairs = showFull ? pairs : pairs.slice(0, 10);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {displayPairs.map(([w, b], i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs rounded-lg px-2 py-1"
            style={{
              background: "var(--bg-subtle)",
              fontFamily: "var(--font-dm-mono)",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>{i + 1}.</span>
            <span style={{ color: "var(--text)" }}>{w}</span>
            {b && <span style={{ color: "var(--text-mid)" }}>{b}</span>}
          </span>
        ))}
        {pairs.length > 10 && (
          <button
            onClick={() => setShowFull((f) => !f)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ background: "var(--bg-subtle)", color: "var(--amber)" }}
          >
            {showFull ? (
              <>
                <ChevronUp size={10} className="inline" /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={10} className="inline" /> +
                {pairs.length - 10} more
              </>
            )}
          </button>
        )}
      </div>
      {moves.length > 0 && (
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {moves.length} half-moves · {pairs.length} full moves
        </p>
      )}
    </div>
  );
}

// ─── Lesson form modal ────────────────────────────────────────
function LessonModal({
  initial,
  onClose,
}: {
  initial?: any;
  onClose: () => void;
}) {
  const create = useCreateLesson();
  const update = useUpdateLesson();
  const isEdit = !!initial;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    level: initial?.level || "beginner",
    pgn: initial?.pgn || "",
    videoUrl: initial?.video_url || "",
    tagsRaw: (initial?.tags || []).join(", "),
    isPublished: initial?.is_published || false,
  });
  const [activeTab, setActiveTab] = useState<"details" | "pgn" | "video">(
    "details",
  );
  const [pgnError, setPgnError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !file.name.endsWith(".pgn") &&
      file.type !== "application/x-chess-pgn" &&
      !file.name.endsWith(".txt")
    ) {
      setPgnError("Please upload a .pgn or .txt file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setForm((f) => ({ ...f, pgn: text }));
      setPgnError("");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = form.tagsRaw
      .split(",")
      .map((t: any) => t.trim())
      .filter(Boolean);
    const payload = { ...form, tags, tagsRaw: undefined };
    if (isEdit) {
      await update.mutateAsync({ id: initial.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  const TABS = [
    { key: "details", label: "Details", icon: FileText },
    { key: "pgn", label: "PGN", icon: BookOpen },
    { key: "video", label: "Video URL", icon: Video },
  ] as const;

  return (
    <Modal title={isEdit ? "Edit Lesson" : "Create Lesson"} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        style={{ minWidth: "min(560px, 92vw)" }}
      >
        {/* Tab nav */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "var(--bg-subtle)" }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                style={
                  activeTab === t.key
                    ? {
                        background: "white",
                        color: "var(--text)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }
                    : { color: "var(--text-muted)" }
                }
              >
                <Icon size={13} />
                {t.label}
                {t.key === "pgn" && form.pgn && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Details tab */}
        {activeTab === "details" && (
          <div className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="e.g. Sicilian Defense: Najdorf Variation"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="input resize-none h-20"
                placeholder="What will students learn? Key concepts, positions to study..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="input"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input
                  value={form.tagsRaw}
                  onChange={(e) =>
                    setForm({ ...form, tagsRaw: e.target.value })
                  }
                  className="input"
                  placeholder="e.g. opening, sicilian, tactics"
                />
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--bg-subtle)" }}
            >
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, isPublished: !f.isPublished }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublished ? "bg-green-500" : ""}`}
                style={
                  !form.isPublished ? { background: "var(--border-md)" } : {}
                }
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isPublished ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {form.isPublished ? "🌍 Published" : "🔒 Draft"}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {form.isPublished
                    ? "Students can see this lesson"
                    : "Only visible to you"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PGN tab */}
        {activeTab === "pgn" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">PGN Text</label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-mid)",
                    borderColor: "var(--border)",
                  }}
                >
                  <Upload size={12} />
                  Upload .pgn file
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pgn,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              <textarea
                value={form.pgn}
                onChange={(e) => {
                  setForm({ ...form, pgn: e.target.value });
                  setPgnError("");
                }}
                className="input resize-none font-mono text-xs h-48"
                placeholder={
                  '[Event "My Lesson"]\n[White "?"]\n[Black "?"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 *'
                }
              />
              {pgnError && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                  {pgnError}
                </p>
              )}
            </div>
            {form.pgn && (
              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--bg-subtle)" }}
              >
                <p
                  className="text-xs font-semibold mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Preview
                </p>
                <PgnViewer pgn={form.pgn} />
              </div>
            )}
          </div>
        )}

        {/* Video tab */}
        {activeTab === "video" && (
          <div className="space-y-4">
            <div>
              <label className="label">Video URL</label>
              <input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="input"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Supports YouTube and Vimeo links. Students will see an embedded
                player.
              </p>
            </div>
            {form.videoUrl && (
              <div
                className="p-4 rounded-xl text-center"
                style={{ background: "var(--bg-subtle)" }}
              >
                <Video
                  size={24}
                  className="mx-auto mb-2"
                  style={{ color: "var(--amber)" }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  Video attached
                </p>
                <p
                  className="text-xs mt-0.5 break-all"
                  style={{ color: "var(--text-muted)" }}
                >
                  {form.videoUrl}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isEdit ? "Save Changes" : "Create Lesson"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function CoachLibraryPage() {
  const { data: lessons = [], isLoading } = useMyLessons();
  const publishLesson = usePublishLesson();
  const deleteLesson = useDeleteLesson();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [previewTarget, setPreviewTarget] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  if (isLoading) return <PageLoading />;

  const filtered = lessons.filter((l: any) => {
    if (
      search &&
      !l.title.toLowerCase().includes(search.toLowerCase()) &&
      !(l.description || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterLevel !== "all" && l.level !== filterLevel) return false;
    if (filterStatus === "published" && !l.is_published) return false;
    if (filterStatus === "draft" && l.is_published) return false;
    return true;
  });

  const published = lessons.filter((l: any) => l.is_published).length;
  const drafts = lessons.length - published;
  const totalStudents = lessons.reduce(
    (s: number, l: any) => s + parseInt(l.completed_count || 0),
    0,
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Modals */}
      {showCreate && <LessonModal onClose={() => setShowCreate(false)} />}
      {editTarget && (
        <LessonModal initial={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {previewTarget && (
        <Modal
          title={previewTarget.title}
          onClose={() => setPreviewTarget(null)}
        >
          <div
            className="space-y-5"
            style={{
              minWidth: "min(560px, 92vw)",
              maxHeight: "75vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="badge text-xs capitalize px-3 py-1"
                style={{
                  background: LEVEL_CFG[previewTarget.level]?.bg,
                  color: LEVEL_CFG[previewTarget.level]?.color,
                }}
              >
                {previewTarget.level}
              </span>
              {previewTarget.is_published ? (
                <span
                  className="badge text-xs"
                  style={{ background: "#DCFCE7", color: "#15803D" }}
                >
                  <Globe size={10} className="inline mr-1" />
                  Published
                </span>
              ) : (
                <span
                  className="badge text-xs"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <Lock size={10} className="inline mr-1" />
                  Draft
                </span>
              )}
              {previewTarget.tags?.map((t: string) => (
                <span key={t} className="badge badge-gray text-xs">
                  {t}
                </span>
              ))}
            </div>

            {previewTarget.description && (
              <p className="text-sm" style={{ color: "var(--text-mid)" }}>
                {previewTarget.description}
              </p>
            )}

            {/* PGN section */}
            {previewTarget.pgn && (
              <div>
                <h4
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: "var(--text)" }}
                >
                  <BookOpen size={14} style={{ color: "var(--amber)" }} />
                  Moves
                </h4>
                <div
                  className="p-4 rounded-xl"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <PgnViewer pgn={previewTarget.pgn} />
                </div>
                <details className="mt-3">
                  <summary
                    className="text-xs cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Show raw PGN
                  </summary>
                  <pre
                    className="mt-2 p-3 rounded-xl text-[10px] overflow-x-auto"
                    style={{
                      background: "#1e1e1e",
                      color: "#d4d4d4",
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    {previewTarget.pgn}
                  </pre>
                </details>
              </div>
            )}

            {/* Video */}
            {previewTarget.video_url && (
              <div>
                <h4
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: "var(--text)" }}
                >
                  <Video size={14} style={{ color: "var(--amber)" }} />
                  Video Lesson
                </h4>
                <a
                  href={previewTarget.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    background: "var(--bg-subtle)",
                    borderColor: "var(--border)",
                    color: "#1D4ED8",
                  }}
                >
                  <Video size={14} />
                  Watch on external player ↗
                </a>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div
                className="p-3 rounded-xl text-center"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="font-display text-xl font-bold"
                  style={{ color: "#15803D" }}
                >
                  {previewTarget.completed_count || 0}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Completions
                </div>
              </div>
              <div
                className="p-3 rounded-xl text-center"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="font-display text-xl font-bold"
                  style={{ color: "var(--amber)" }}
                >
                  {previewTarget.views_count || 0}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Total Views
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete Lesson?" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              "<strong>{confirmDelete.title}</strong>" will be permanently
              deleted. Student progress on this lesson will also be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteLesson.mutateAsync(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                disabled={deleteLesson.isPending}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {deleteLesson.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <BookOpen size={22} style={{ color: "#1D4ED8" }} />
          PGN Library
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          New Lesson
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Lessons", value: lessons.length, color: "#1D4ED8" },
          { label: "Published", value: published, color: "#15803D" },
          { label: "Drafts", value: drafts, color: "#9A6E00" },
          { label: "Completions", value: totalStudents, color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div
              className="font-display text-2xl font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1" style={{ minWidth: "200px" }}>
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
          {["all", "published", "draft"].map((f) => (
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
          {["all", ...LEVELS].map((f) => (
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
          ))}
        </div>
      </div>

      {/* Lessons list */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title={
              lessons.length === 0
                ? "No lessons yet"
                : "No lessons match filters"
            }
            subtitle={
              lessons.length === 0
                ? "Create your first lesson — add a PGN, write a description, and publish to students"
                : "Try adjusting your search or filters"
            }
            action={
              lessons.length === 0 ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  New Lesson
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l: any) => {
            const lvlCfg = LEVEL_CFG[l.level] || LEVEL_CFG.beginner;
            const hasPgn = !!l.pgn;
            const hasVideo = !!l.video_url;
            const completions = parseInt(l.completed_count || 0);
            const views = parseInt(l.views_count || 0);

            return (
              <div key={l.id} className="card p-5">
                <div className="flex items-start gap-4">
                  {/* Status dot */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: l.is_published
                        ? "#DCFCE7"
                        : "var(--bg-subtle)",
                    }}
                  >
                    {l.is_published ? (
                      <Globe size={18} style={{ color: "#15803D" }} />
                    ) : (
                      <Lock size={18} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="badge text-xs capitalize"
                        style={{ background: lvlCfg.bg, color: lvlCfg.color }}
                      >
                        {l.level}
                      </span>
                      {hasPgn && (
                        <span
                          className="badge text-xs"
                          style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                        >
                          <BookOpen size={9} className="inline mr-1" />
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
                      {l.tags?.slice(0, 3).map((t: string) => (
                        <span key={t} className="badge badge-gray text-xs">
                          {t}
                        </span>
                      ))}
                    </div>

                    <h3
                      className="font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {l.title}
                    </h3>
                    {l.description && (
                      <p
                        className="text-sm mt-0.5 line-clamp-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {l.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div
                      className="flex flex-wrap items-center gap-4 mt-2.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {completions} completions
                      </span>
                      {hasPgn && (
                        <span className="flex items-center gap-1">
                          <FileText size={11} />
                          {(parsePgnMoves(l.pgn).length / 2) | 0} moves
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(l.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        onClick={() => setPreviewTarget(l)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all"
                        style={{
                          background: "var(--bg-subtle)",
                          color: "var(--text-mid)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <Eye size={12} />
                        Preview
                      </button>
                      <button
                        onClick={() => setEditTarget(l)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all"
                        style={{
                          background: "var(--bg-subtle)",
                          color: "var(--text-mid)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          publishLesson.mutate({
                            id: l.id,
                            publish: !l.is_published,
                          })
                        }
                        disabled={publishLesson.isPending}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all"
                        style={
                          l.is_published
                            ? {
                                background: "#FEF9C3",
                                color: "#B45309",
                                borderColor: "#FDE68A",
                              }
                            : {
                                background: "#DCFCE7",
                                color: "#15803D",
                                borderColor: "#BBF7D0",
                              }
                        }
                      >
                        {l.is_published ? (
                          <>
                            <EyeOff size={12} />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Globe size={12} />
                            Publish
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(l)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ml-auto"
                        style={{
                          color: "#DC2626",
                          borderColor: "var(--border)",
                          background: "var(--bg-subtle)",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
