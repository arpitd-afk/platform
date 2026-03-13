"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useAssignmentSubmissions,
  useGradeSubmission,
} from "@/lib/hooks";
import { useBatches, useUsers } from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import Avatar from "@/components/shared/Avatar";
import {
  ClipboardList,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  Star,
  Loader2,
  Trash2,
  Edit2,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Award,
  BookOpen,
  Target,
  Swords,
  X,
  Save,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Constants ────────────────────────────────────────────────
const TYPES = [
  "puzzle",
  "opening",
  "endgame",
  "game_analysis",
  "video",
  "custom",
];

const TYPE_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  puzzle: { color: "#7C3AED", bg: "#EDE9FE", icon: Target },
  opening: { color: "#1D4ED8", bg: "#DBEAFE", icon: BookOpen },
  endgame: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)", icon: Award },
  game_analysis: { color: "#15803D", bg: "#DCFCE7", icon: Swords },
  video: { color: "#BE185D", bg: "#FCE7F3", icon: Eye },
  custom: {
    color: "var(--text-mid)",
    bg: "var(--bg-subtle)",
    icon: ClipboardList,
  },
};

// ─── Grade badge ───────────────────────────────────────────────
function GradeBadge({
  grade,
  passingScore = 70,
}: {
  grade?: number | null;
  passingScore?: number;
}) {
  if (grade === null || grade === undefined)
    return <span className="badge badge-gray text-xs">Not graded</span>;
  const passed = grade >= passingScore;
  return (
    <span
      className="badge text-xs font-bold px-3"
      style={{
        background: passed ? "#DCFCE7" : "#FEE2E2",
        color: passed ? "#15803D" : "#DC2626",
      }}
    >
      {grade}/100 {passed ? "✅" : "❌"}
    </span>
  );
}

// ─── Submissions panel (inline expand) ────────────────────────
function SubmissionsPanel({
  assignment,
  onClose,
}: {
  assignment: any;
  onClose: () => void;
}) {
  const { data: submissions = [], isLoading } = useAssignmentSubmissions(
    assignment.id,
  );
  const gradeSubmission = useGradeSubmission();
  const [grading, setGrading] = useState<string | null>(null);
  const [gradeVal, setGradeVal] = useState("");
  const [feedbackVal, setFeedbackVal] = useState("");

  const openGrade = (sub: any) => {
    setGrading(sub.id);
    setGradeVal(
      sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : "",
    );
    setFeedbackVal(sub.feedback || "");
  };

  const saveGrade = async (sub: any) => {
    await gradeSubmission.mutateAsync({
      assignmentId: assignment.id,
      submissionId: sub.id,
      grade: gradeVal !== "" ? parseInt(gradeVal) : undefined,
      feedback: feedbackVal || undefined,
    });
    setGrading(null);
  };

  const pending = submissions.filter((s: any) => !s.graded_at).length;
  const graded = submissions.filter((s: any) => !!s.graded_at).length;

  return (
    <Modal title={`Submissions — ${assignment.title}`} onClose={onClose}>
      <div className="space-y-4" style={{ minWidth: "min(560px, 90vw)" }}>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: submissions.length, color: "var(--text)" },
            { label: "Pending", value: pending, color: "#9A6E00" },
            { label: "Graded", value: graded, color: "#15803D" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-3 rounded-xl"
              style={{ background: "var(--bg-subtle)" }}
            >
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

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "var(--amber)" }}
            />
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList
              size={32}
              className="mx-auto mb-3"
              style={{ color: "var(--border-md)" }}
            />
            <p className="font-medium" style={{ color: "var(--text)" }}>
              No submissions yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Students haven't submitted this assignment
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {submissions.map((sub: any) => {
              const isGrading = grading === sub.id;
              const note = sub.submission?.note || sub.submission?.text || "";

              return (
                <div
                  key={sub.id}
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Student row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <Avatar
                      user={{
                        name: sub.student_name,
                        avatar: sub.student_avatar,
                        role: "student",
                      }}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-sm"
                        style={{ color: "var(--text)" }}
                      >
                        {sub.student_name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {sub.batch_name || "—"} · submitted{" "}
                        {formatDistanceToNow(new Date(sub.submitted_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GradeBadge
                        grade={sub.grade}
                        passingScore={assignment.passing_score || 70}
                      />
                      {!isGrading && (
                        <button
                          onClick={() => openGrade(sub)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={{
                            background: "rgba(200,150,30,0.12)",
                            color: "#9A6E00",
                          }}
                        >
                          {sub.graded_at ? (
                            <>
                              <Edit2 size={11} />
                              Edit
                            </>
                          ) : (
                            <>
                              <Star size={11} />
                              Grade
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student notes */}
                  {note && (
                    <div
                      className="px-4 py-3"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <p
                        className="text-xs font-semibold mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Student's Note
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-mid)" }}
                      >
                        {note}
                      </p>
                    </div>
                  )}

                  {/* Existing feedback (collapsed unless grading) */}
                  {sub.feedback && !isGrading && (
                    <div
                      className="px-4 py-3 rounded-b-xl"
                      style={{
                        background: "rgba(200,150,30,0.05)",
                        borderTop: "1px solid rgba(200,150,30,0.15)",
                      }}
                    >
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "var(--amber)" }}
                      >
                        Your Feedback
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-mid)" }}
                      >
                        {sub.feedback}
                      </p>
                    </div>
                  )}

                  {/* Grade form */}
                  {isGrading && (
                    <div
                      className="px-4 py-4 space-y-3"
                      style={{
                        borderTop: "1px solid var(--border)",
                        background: "rgba(200,150,30,0.03)",
                      }}
                    >
                      <div className="flex items-end gap-3">
                        <div className="flex-shrink-0">
                          <label className="label text-xs">Score (0–100)</label>
                          <div className="relative w-28">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={gradeVal}
                              onChange={(e) => setGradeVal(e.target.value)}
                              placeholder="—"
                              className="input text-center font-display text-lg font-bold pr-8"
                              style={{ color: "var(--amber)" }}
                              autoFocus
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              /100
                            </span>
                          </div>
                          {gradeVal !== "" && (
                            <div
                              className="mt-1 text-[10px] font-medium"
                              style={{
                                color:
                                  parseInt(gradeVal) >=
                                  (assignment.passing_score || 70)
                                    ? "#15803D"
                                    : "#DC2626",
                              }}
                            >
                              {parseInt(gradeVal) >=
                              (assignment.passing_score || 70)
                                ? `✅ Pass (≥${assignment.passing_score || 70})`
                                : `❌ Fail (<${assignment.passing_score || 70})`}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="label text-xs">
                            Feedback for student
                          </label>
                          <textarea
                            value={feedbackVal}
                            onChange={(e) => setFeedbackVal(e.target.value)}
                            rows={2}
                            className="input resize-none text-sm"
                            placeholder="Great work on the opening! Try to improve the middlegame..."
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setGrading(null)}
                          className="btn-secondary text-sm flex items-center gap-1.5"
                        >
                          <X size={13} />
                          Cancel
                        </button>
                        <button
                          onClick={() => saveGrade(sub)}
                          disabled={gradeSubmission.isPending}
                          className="btn-primary text-sm flex items-center gap-1.5"
                        >
                          {gradeSubmission.isPending ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Save size={13} />
                          )}
                          Save Grade
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Create / Edit modal ───────────────────────────────────────
function AssignmentFormModal({
  initial,
  onClose,
  batches,
  students,
}: {
  initial?: any;
  onClose: () => void;
  batches: any[];
  students: any[];
}) {
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    type: initial?.type || "puzzle",
    batchId: initial?.batch_id || "",
    studentId: initial?.student_id || "",
    dueDate: initial?.due_date ? initial.due_date.substring(0, 10) : "",
    passingScore: initial?.passing_score ?? 70,
    maxAttempts: initial?.max_attempts ?? 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await update.mutateAsync({ id: initial.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      title={isEdit ? "Edit Assignment" : "Create Assignment"}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        style={{ minWidth: "min(500px, 90vw)" }}
      >
        <div>
          <label className="label">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="e.g. Sicilian Defense Puzzle Set"
            autoFocus
          />
        </div>

        <div>
          <label className="label">Instructions</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input resize-none h-20"
            placeholder="Describe what students need to do. You can include a FEN position, PGN, or link..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assign to Batch</label>
            <select
              value={form.batchId}
              onChange={(e) =>
                setForm({ ...form, batchId: e.target.value, studentId: "" })
              }
              className="input"
            >
              <option value="">All my students</option>
              {batches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Or specific student</label>
            <select
              value={form.studentId}
              onChange={(e) =>
                setForm({ ...form, studentId: e.target.value, batchId: "" })
              }
              className="input"
            >
              <option value="">—</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Passing Score (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.passingScore}
              onChange={(e) =>
                setForm({ ...form, passingScore: parseInt(e.target.value) })
              }
              className="input"
            />
          </div>
          <div>
            <label className="label">Max Attempts</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.maxAttempts}
              onChange={(e) =>
                setForm({ ...form, maxAttempts: parseInt(e.target.value) })
              }
              className="input"
            />
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
            {isPending
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function CoachAssignmentsPage() {
  const { user } = useAuth();
  const { data: assignments = [], isLoading } = useAssignments({});
  const { data: batches = [] } = useBatches();
  const { data: students = [] } = useUsers({ role: "student" });
  const deleteAssignment = useDeleteAssignment();

  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [submissionsTarget, setSubmissionsTarget] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  if (isLoading) return <PageLoading />;

  const filtered =
    filter === "all"
      ? assignments
      : assignments.filter((a: any) => {
          if (filter === "pending")
            return (a.total_submissions || 0) > (a.graded_count || 0);
          if (filter === "active")
            return !a.due_date || new Date(a.due_date) > new Date();
          if (filter === "overdue")
            return a.due_date && new Date(a.due_date) < new Date();
          return true;
        });

  const totalSubmissions = assignments.reduce(
    (s: number, a: any) => s + (parseInt(a.total_submissions) || 0),
    0,
  );
  const ungraded = assignments.reduce(
    (s: number, a: any) =>
      s +
      Math.max(
        0,
        (parseInt(a.total_submissions) || 0) - (parseInt(a.graded_count) || 0),
      ),
    0,
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Modals */}
      {showCreate && (
        <AssignmentFormModal
          onClose={() => setShowCreate(false)}
          batches={batches}
          students={students}
        />
      )}
      {editTarget && (
        <AssignmentFormModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          batches={batches}
          students={students}
        />
      )}
      {submissionsTarget && (
        <SubmissionsPanel
          assignment={submissionsTarget}
          onClose={() => setSubmissionsTarget(null)}
        />
      )}
      {confirmDelete && (
        <Modal
          title="Delete Assignment?"
          onClose={() => setConfirmDelete(null)}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              "<strong>{confirmDelete.title}</strong>" and all its submissions
              will be permanently deleted.
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
                  await deleteAssignment.mutateAsync(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                disabled={deleteAssignment.isPending}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {deleteAssignment.isPending ? (
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
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <ClipboardList size={22} style={{ color: "#7C3AED" }} />
          Assignments
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Create Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: assignments.length, color: "#7C3AED" },
          { label: "Submissions", value: totalSubmissions, color: "#1D4ED8" },
          {
            label: "Need Grading",
            value: ungraded,
            color: ungraded > 0 ? "#DC2626" : "#15803D",
          },
          { label: "Batches", value: batches.length, color: "var(--amber)" },
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
            {s.label === "Need Grading" && ungraded > 0 && (
              <div className="mt-1 text-[10px]" style={{ color: "#DC2626" }}>
                Action needed
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { key: "all", label: "All" },
          {
            key: "pending",
            label: `Needs Grading${ungraded > 0 ? ` (${ungraded})` : ""}`,
          },
          { key: "active", label: "Active" },
          { key: "overdue", label: "Overdue" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={
              filter === f.key
                ? {
                    background: "#7C3AED",
                    color: "white",
                    borderColor: "#7C3AED",
                  }
                : {
                    background: "var(--bg-subtle)",
                    color: "var(--text-muted)",
                    borderColor: "var(--border)",
                  }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Assignments list */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No assignments"
            subtitle="Create your first assignment for students"
            action={
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={14} />
                Create Assignment
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => {
            const cfg = TYPE_CFG[a.type] || TYPE_CFG.custom;
            const Icon = cfg.icon;
            const submCount = parseInt(a.total_submissions) || 0;
            const gradedCount = parseInt(a.graded_count) || 0;
            const pendingGrade = submCount - gradedCount;
            const isOverdue = a.due_date && new Date(a.due_date) < new Date();

            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start gap-4">
                  {/* Type icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="badge text-xs"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {a.type?.replace("_", " ")}
                          </span>
                          {pendingGrade > 0 && (
                            <span
                              className="badge text-xs"
                              style={{
                                background: "#FEE2E2",
                                color: "#DC2626",
                              }}
                            >
                              {pendingGrade} ungraded
                            </span>
                          )}
                          {isOverdue && (
                            <span
                              className="badge text-xs"
                              style={{
                                background: "#FEF3C7",
                                color: "#B45309",
                              }}
                            >
                              Overdue
                            </span>
                          )}
                        </div>
                        <h3
                          className="font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {a.title}
                        </h3>
                        {a.description && (
                          <p
                            className="text-sm mt-0.5 line-clamp-2"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {a.description}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditTarget(a)}
                          className="btn-icon w-8 h-8"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(a)}
                          className="btn-icon w-8 h-8 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div
                      className="flex flex-wrap items-center gap-3 mt-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {a.batch_name && (
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {a.batch_name}
                        </span>
                      )}
                      {a.student_name && (
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {a.student_name}
                        </span>
                      )}
                      {a.due_date && (
                        <span
                          className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}
                        >
                          <Clock size={11} />
                          Due{" "}
                          {new Date(a.due_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        {gradedCount}/{submCount} graded
                      </span>
                      {a.passing_score && (
                        <span className="flex items-center gap-1">
                          <Star size={11} />
                          Pass: {a.passing_score}%
                        </span>
                      )}
                    </div>

                    {/* Submission progress bar */}
                    {submCount > 0 && (
                      <div className="mt-3">
                        <div
                          className="flex items-center justify-between text-[10px] mb-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span>Grading progress</span>
                          <span>
                            {Math.round((gradedCount / submCount) * 100)}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--bg-subtle)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(gradedCount / submCount) * 100}%`,
                              background:
                                gradedCount === submCount
                                  ? "#15803D"
                                  : "var(--amber)",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* View submissions button */}
                    <button
                      onClick={() => setSubmissionsTarget(a)}
                      className="mt-3 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all"
                      style={{
                        background:
                          pendingGrade > 0
                            ? "rgba(200,150,30,0.10)"
                            : "var(--bg-subtle)",
                        color: pendingGrade > 0 ? "#9A6E00" : "var(--text-mid)",
                      }}
                    >
                      <Eye size={14} />
                      {submCount === 0
                        ? "No submissions yet"
                        : `View ${submCount} Submission${submCount > 1 ? "s" : ""}`}
                      {pendingGrade > 0 && ` · ${pendingGrade} need grading`}
                    </button>
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
