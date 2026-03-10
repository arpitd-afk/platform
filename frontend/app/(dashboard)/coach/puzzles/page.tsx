"use client";
import { useState } from "react";
import {
  useCustomPuzzles,
  useCreateCustomPuzzle,
  useUpdateCustomPuzzle,
  useDeleteCustomPuzzle,
  useMcqQuestions,
  useCreateMcq,
  useUpdateMcq,
  useDeleteMcq,
} from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import {
  Puzzle,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Loader2,
  Save,
  HelpCircle,
  CheckSquare,
  Square,
  GripVertical,
  X,
  BookOpen,
  Check,
} from "lucide-react";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];
const DIFF_CFG: Record<string, { color: string; bg: string }> = {
  beginner: { color: "#15803D", bg: "#DCFCE7" },
  intermediate: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)" },
  advanced: { color: "#DC2626", bg: "#FEE2E2" },
  expert: { color: "#7C3AED", bg: "#EDE9FE" },
};

// ─── Custom Puzzle Form Modal ─────────────────────────────────
function PuzzleFormModal({
  initial,
  onClose,
}: {
  initial?: any;
  onClose: () => void;
}) {
  const create = useCreateCustomPuzzle();
  const update = useUpdateCustomPuzzle();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    fen:
      initial?.fen ||
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    solutionMoves: initial?.solution_moves || "",
    solutionPgn: initial?.solution_pgn || "",
    difficulty: initial?.difficulty || "intermediate",
    themes: (initial?.themes || []).join(", "),
    hint: initial?.hint || "",
    isPublished: initial?.is_published || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      themes: form.themes
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
    };
    if (isEdit) await update.mutateAsync({ id: initial.id, data: payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      title={isEdit ? "Edit Puzzle" : "Create Chess Puzzle"}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        style={{ minWidth: "min(560px, 92vw)" }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="e.g. Back Rank Mate in 2"
              autoFocus
            />
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input"
              placeholder="What concept does this puzzle test?"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Starting Position (FEN) *</label>
            <input
              required
              value={form.fen}
              onChange={(e) => setForm({ ...form, fen: e.target.value })}
              className="input font-mono text-xs"
              placeholder="FEN string"
            />
            <p
              className="text-[11px] mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Get FEN from any position on chess.com/lichess → Analysis Board →
              Share
            </p>
          </div>
          <div className="col-span-2">
            <label className="label">Solution Moves (UCI) *</label>
            <input
              required
              value={form.solutionMoves}
              onChange={(e) =>
                setForm({ ...form, solutionMoves: e.target.value })
              }
              className="input font-mono text-xs"
              placeholder="e.g. e2e4 d7d5 f1b5"
            />
            <p
              className="text-[11px] mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Space-separated UCI moves: from-square + to-square, e.g.{" "}
              <code>e1g1</code> for kingside castle
            </p>
          </div>
          <div>
            <label className="label">Solution (SAN / readable)</label>
            <input
              value={form.solutionPgn}
              onChange={(e) =>
                setForm({ ...form, solutionPgn: e.target.value })
              }
              className="input"
              placeholder="e.g. 1. Rxh7+ Kxh7 2. Qh5#"
            />
          </div>
          <div>
            <label className="label">Hint (optional)</label>
            <input
              value={form.hint}
              onChange={(e) => setForm({ ...form, hint: e.target.value })}
              className="input"
              placeholder="e.g. Look at the back rank..."
            />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="input"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Themes (comma-separated)</label>
            <input
              value={form.themes}
              onChange={(e) => setForm({ ...form, themes: e.target.value })}
              className="input"
              placeholder="e.g. tactics, fork, pin"
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
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{
              background: form.isPublished ? "#15803D" : "var(--border-md)",
            }}
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
              {form.isPublished
                ? "🌍 Published — students can solve this"
                : "🔒 Draft"}
            </div>
          </div>
        </div>

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
            {isEdit ? "Save Changes" : "Create Puzzle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── MCQ Option row ───────────────────────────────────────────
function OptionRow({ opt, idx, onChange, onRemove, allowMultiple }: any) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange({ ...opt, isCorrect: !opt.isCorrect })}
        className="flex-shrink-0 transition-colors"
        style={{ color: opt.isCorrect ? "#15803D" : "var(--border-md)" }}
      >
        {allowMultiple ? (
          opt.isCorrect ? (
            <CheckSquare size={18} />
          ) : (
            <Square size={18} />
          )
        ) : (
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${opt.isCorrect ? "border-green-500 bg-green-500" : "border-gray-300"}`}
          >
            {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        )}
      </button>
      <input
        value={opt.text}
        onChange={(e) => onChange({ ...opt, text: e.target.value })}
        className="input flex-1 text-sm py-2"
        placeholder={`Option ${idx + 1}`}
        required
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all"
        style={{ color: "var(--text-muted)" }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── MCQ Form Modal ───────────────────────────────────────────
function McqFormModal({
  initial,
  onClose,
}: {
  initial?: any;
  onClose: () => void;
}) {
  const create = useCreateMcq();
  const update = useUpdateMcq();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    question: initial?.question || "",
    explanation: initial?.explanation || "",
    fen: initial?.fen || "",
    difficulty: initial?.difficulty || "intermediate",
    topics: (initial?.topics || []).join(", "),
    allowMultiple: initial?.allow_multiple || false,
    points: initial?.points || 1,
    isPublished: initial?.is_published || false,
  });
  const [options, setOptions] = useState<any[]>(
    initial?.options?.length
      ? initial.options.map((o: any) => ({
          id: o.id,
          text: o.option_text,
          isCorrect: o.is_correct,
        }))
      : [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
  );

  const updateOption = (idx: number, val: any) => {
    setOptions((opts) => {
      const next = [...opts];
      // For single-answer: deselect others when one is selected
      if (!form.allowMultiple && val.isCorrect) {
        next.forEach((o, i) => {
          if (i !== idx) o.isCorrect = false;
        });
      }
      next[idx] = val;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!options.some((o) => o.isCorrect)) {
      return alert("Please mark at least one option as correct");
    }
    const payload = {
      ...form,
      topics: form.topics
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
      options,
    };
    if (isEdit) await update.mutateAsync({ id: initial.id, data: payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      title={isEdit ? "Edit MCQ" : "Create MCQ Question"}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        style={{
          minWidth: "min(580px, 92vw)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div>
          <label className="label">Question *</label>
          <textarea
            required
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="input resize-none h-24"
            placeholder="Write your question here..."
            autoFocus
          />
        </div>

        {/* Answer type toggle */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--bg-subtle)" }}
        >
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({ ...f, allowMultiple: !f.allowMultiple }))
            }
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{
              background: form.allowMultiple ? "#1D4ED8" : "var(--border-md)",
            }}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.allowMultiple ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
          <div>
            <div
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              {form.allowMultiple ? (
                <>
                  <CheckSquare size={13} className="inline mr-1" />
                  Select all that apply
                </>
              ) : (
                "Single correct answer"
              )}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {form.allowMultiple
                ? "Students can select multiple options"
                : "Students select exactly one option"}
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Answer Options *</label>
            <button
              type="button"
              onClick={() =>
                setOptions((o) => [...o, { text: "", isCorrect: false }])
              }
              className="text-xs flex items-center gap-1 font-medium"
              style={{ color: "#1D4ED8" }}
            >
              <Plus size={12} />
              Add option
            </button>
          </div>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <OptionRow
                key={idx}
                opt={opt}
                idx={idx}
                allowMultiple={form.allowMultiple}
                onChange={(val: any) => updateOption(idx, val)}
                onRemove={() =>
                  options.length > 2 &&
                  setOptions((o) => o.filter((_, i) => i !== idx))
                }
              />
            ))}
          </div>
          <p
            className="text-[11px] mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            {form.allowMultiple
              ? "Click ☐ to mark correct options (multiple allowed)"
              : "Click ○ to mark the single correct option"}
          </p>
        </div>

        <div>
          <label className="label">Explanation (shown after submission)</label>
          <textarea
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            className="input resize-none h-16"
            placeholder="Explain why the correct answer(s) are right..."
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="input"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Points</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.points}
              onChange={(e) =>
                setForm({ ...form, points: parseInt(e.target.value) })
              }
              className="input"
            />
          </div>
          <div>
            <label className="label">Topics</label>
            <input
              value={form.topics}
              onChange={(e) => setForm({ ...form, topics: e.target.value })}
              className="input text-sm"
              placeholder="openings, tactics"
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
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{
              background: form.isPublished ? "#15803D" : "var(--border-md)",
            }}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isPublished ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
          <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {form.isPublished ? "🌍 Published" : "🔒 Draft"}
          </div>
        </div>

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
            {isEdit ? "Save Changes" : "Create Question"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function CoachPuzzlesPage() {
  const [tab, setTab] = useState<"puzzles" | "mcq">("puzzles");
  const [showCreatePuzzle, setShowCreatePuzzle] = useState(false);
  const [showCreateMcq, setShowCreateMcq] = useState(false);
  const [editPuzzle, setEditPuzzle] = useState<any>(null);
  const [editMcq, setEditMcq] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "puzzle" | "mcq";
    item: any;
  } | null>(null);

  const { data: puzzles = [], isLoading: pLoading } = useCustomPuzzles();
  const { data: mcqs = [], isLoading: mLoading } = useMcqQuestions();
  const deletePuzzle = useDeleteCustomPuzzle();
  const deleteMcq = useDeleteMcq();

  const isLoading = pLoading || mLoading;

  const publishedPuzzles = puzzles.filter((p: any) => p.is_published).length;
  const publishedMcqs = mcqs.filter((m: any) => m.is_published).length;
  const totalMcqAttempts = mcqs.reduce(
    (s: number, m: any) => s + (m.attempted_by_me ? 1 : 0),
    0,
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Modals */}
      {showCreatePuzzle && (
        <PuzzleFormModal onClose={() => setShowCreatePuzzle(false)} />
      )}
      {editPuzzle && (
        <PuzzleFormModal
          initial={editPuzzle}
          onClose={() => setEditPuzzle(null)}
        />
      )}
      {showCreateMcq && (
        <McqFormModal onClose={() => setShowCreateMcq(false)} />
      )}
      {editMcq && (
        <McqFormModal initial={editMcq} onClose={() => setEditMcq(null)} />
      )}

      {confirmDelete && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Delete "
              <strong>
                {confirmDelete.type === "puzzle"
                  ? confirmDelete.item.title
                  : confirmDelete.item.question.slice(0, 60)}
              </strong>
              "? All student attempts will be lost.
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
                  if (confirmDelete.type === "puzzle")
                    await deletePuzzle.mutateAsync(confirmDelete.item.id);
                  else await deleteMcq.mutateAsync(confirmDelete.item.id);
                  setConfirmDelete(null);
                }}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Puzzle size={22} style={{ color: "#7C3AED" }} />
          Puzzles & Quizzes
        </h1>
        <button
          onClick={() =>
            tab === "puzzles"
              ? setShowCreatePuzzle(true)
              : setShowCreateMcq(true)
          }
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          {tab === "puzzles" ? "New Puzzle" : "New MCQ"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Puzzles", value: puzzles.length, color: "#7C3AED" },
          { label: "Published", value: publishedPuzzles, color: "#15803D" },
          { label: "MCQ Questions", value: mcqs.length, color: "#1D4ED8" },
          { label: "MCQs Published", value: publishedMcqs, color: "#15803D" },
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

      {/* Tabs */}
      <div className="flex gap-1 card p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("puzzles")}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all"
          style={
            tab === "puzzles"
              ? { background: "rgba(124,58,237,0.12)", color: "#7C3AED" }
              : { color: "var(--text-muted)" }
          }
        >
          <Puzzle size={14} />
          Chess Puzzles
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background:
                tab === "puzzles" ? "rgba(124,58,237,0.15)" : "var(--bg-hover)",
              color: tab === "puzzles" ? "#7C3AED" : "var(--text-muted)",
            }}
          >
            {puzzles.length}
          </span>
        </button>
        <button
          onClick={() => setTab("mcq")}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all"
          style={
            tab === "mcq"
              ? { background: "rgba(29,78,216,0.12)", color: "#1D4ED8" }
              : { color: "var(--text-muted)" }
          }
        >
          <HelpCircle size={14} />
          MCQ Questions
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background:
                tab === "mcq" ? "rgba(29,78,216,0.15)" : "var(--bg-hover)",
              color: tab === "mcq" ? "#1D4ED8" : "var(--text-muted)",
            }}
          >
            {mcqs.length}
          </span>
        </button>
      </div>

      {/* Puzzles tab */}
      {tab === "puzzles" &&
        (isLoading ? (
          <PageLoading />
        ) : puzzles.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No puzzles yet"
              subtitle="Create chess puzzles for your students to solve"
              action={
                <button
                  onClick={() => setShowCreatePuzzle(true)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  Create First Puzzle
                </button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {puzzles.map((p: any) => {
              const cfg = DIFF_CFG[p.difficulty] || DIFF_CFG.intermediate;
              return (
                <div key={p.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: p.is_published
                          ? cfg.bg
                          : "var(--bg-subtle)",
                      }}
                    >
                      <Puzzle
                        size={18}
                        style={{
                          color: p.is_published
                            ? cfg.color
                            : "var(--text-muted)",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="badge text-xs capitalize"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {p.difficulty}
                        </span>
                        {p.is_published ? (
                          <span
                            className="badge text-xs"
                            style={{ background: "#DCFCE7", color: "#15803D" }}
                          >
                            <Globe size={9} className="inline mr-1" />
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
                            <Lock size={9} className="inline mr-1" />
                            Draft
                          </span>
                        )}
                        {p.themes?.slice(0, 3).map((t: string) => (
                          <span key={t} className="badge badge-gray text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--text)" }}
                      >
                        {p.title}
                      </h3>
                      {p.description && (
                        <p
                          className="text-xs mt-0.5 line-clamp-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {parseInt(p.solved_count) || 0} students solved ·{" "}
                          {p.solution_moves}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditPuzzle(p)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-mid)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <Edit2 size={11} />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({ type: "puzzle", item: p })
                            }
                            className="text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                            style={{
                              color: "#DC2626",
                              borderColor: "var(--border)",
                              background: "var(--bg-subtle)",
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* MCQ tab */}
      {tab === "mcq" &&
        (isLoading ? (
          <PageLoading />
        ) : mcqs.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No MCQ questions yet"
              subtitle="Create multiple-choice questions — supports both single and multi-select answers"
              action={
                <button
                  onClick={() => setShowCreateMcq(true)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  Create First MCQ
                </button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {mcqs.map((m: any) => {
              const cfg = DIFF_CFG[m.difficulty] || DIFF_CFG.intermediate;
              const correctCount = (m.options || []).filter(
                (o: any) => o.is_correct,
              ).length;
              return (
                <div key={m.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: m.is_published
                          ? "#EFF6FF"
                          : "var(--bg-subtle)",
                      }}
                    >
                      <HelpCircle
                        size={18}
                        style={{
                          color: m.is_published
                            ? "#1D4ED8"
                            : "var(--text-muted)",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="badge text-xs capitalize"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {m.difficulty}
                        </span>
                        {m.allow_multiple ? (
                          <span
                            className="badge text-xs"
                            style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                          >
                            <CheckSquare size={9} className="inline mr-1" />
                            Multi-select
                          </span>
                        ) : (
                          <span
                            className="badge text-xs"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Single answer
                          </span>
                        )}
                        {m.is_published ? (
                          <span
                            className="badge text-xs"
                            style={{ background: "#DCFCE7", color: "#15803D" }}
                          >
                            <Globe size={9} className="inline mr-1" />
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
                            <Lock size={9} className="inline mr-1" />
                            Draft
                          </span>
                        )}
                        <span
                          className="badge text-xs"
                          style={{
                            background: "rgba(200,150,30,0.1)",
                            color: "var(--amber)",
                          }}
                        >
                          {m.points || 1} pts
                        </span>
                      </div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--text)" }}
                      >
                        {m.question}
                      </p>
                      {/* Options preview */}
                      {m.options?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {m.options.slice(0, 4).map((o: any, i: number) => (
                            <div
                              key={o.id || i}
                              className="flex items-center gap-2 text-xs"
                              style={{
                                color: o.is_correct
                                  ? "#15803D"
                                  : "var(--text-muted)",
                              }}
                            >
                              {o.is_correct ? (
                                <Check size={10} />
                              ) : (
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ background: "var(--border-md)" }}
                                />
                              )}
                              {o.option_text}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {(m.options || []).length} options · {correctCount}{" "}
                          correct
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditMcq(m)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-mid)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <Edit2 size={11} />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({ type: "mcq", item: m })
                            }
                            className="text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                            style={{
                              color: "#DC2626",
                              borderColor: "var(--border)",
                              background: "var(--bg-subtle)",
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
