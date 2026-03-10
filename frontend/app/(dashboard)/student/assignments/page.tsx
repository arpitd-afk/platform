"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAssignments, useSubmitAssignment } from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import {
  ClipboardList,
  Upload,
  Clock,
  CheckCircle2,
  BookOpen,
  Target,
  Award,
  Eye,
  Swords,
  Star,
  Loader2,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Type config ──────────────────────────────────────────────
const TYPE_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  tactics: { color: "#7C3AED", bg: "#EDE9FE", icon: Target },
  opening: { color: "#1D4ED8", bg: "#DBEAFE", icon: BookOpen },
  endgame: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)", icon: Award },
  analysis: { color: "#15803D", bg: "#DCFCE7", icon: Swords },
  game_review: { color: "#BE185D", bg: "#FCE7F3", icon: Eye },
  custom: {
    color: "var(--text-mid)",
    bg: "var(--bg-subtle)",
    icon: ClipboardList,
  },
};

// ─── Grade card ───────────────────────────────────────────────
function GradeCard({
  grade,
  passingScore = 70,
}: {
  grade: number;
  passingScore?: number;
}) {
  const passed = grade >= passingScore;
  return (
    <div
      className="text-center px-5 py-3 rounded-xl flex-shrink-0"
      style={{
        background: passed ? "#F0FDF4" : "#FFF1F2",
        border: `1px solid ${passed ? "#BBF7D0" : "#FECDD3"}`,
      }}
    >
      <div
        className="font-display text-2xl font-bold"
        style={{ color: passed ? "#15803D" : "#DC2626" }}
      >
        {grade}
      </div>
      <div
        className="text-xs mt-0.5"
        style={{ color: passed ? "#15803D" : "#DC2626" }}
      >
        /100 {passed ? "✅" : "❌"}
      </div>
    </div>
  );
}

// ─── Submit modal ─────────────────────────────────────────────
function SubmitModal({
  assignment,
  onClose,
}: {
  assignment: any;
  onClose: () => void;
}) {
  const submit = useSubmitAssignment();
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = async () => {
    await submit.mutateAsync({
      id: assignment.id,
      submission: { note, link, submittedAt: new Date().toISOString() },
    });
    onClose();
  };

  const cfg = TYPE_CFG[assignment.type] || TYPE_CFG.custom;
  const Icon = cfg.icon;

  return (
    <Modal title="Submit Assignment" onClose={onClose}>
      <div className="space-y-5" style={{ minWidth: "min(420px, 90vw)" }}>
        {/* Assignment info */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "var(--bg-subtle)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg }}
          >
            <Icon size={18} style={{ color: cfg.color }} />
          </div>
          <div>
            <div
              className="font-semibold text-sm"
              style={{ color: "var(--text)" }}
            >
              {assignment.title}
            </div>
            {assignment.due_date && (
              <div
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: "var(--text-muted)" }}
              >
                <Clock size={10} />
                Due{" "}
                {new Date(assignment.due_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        </div>

        {/* Assignment instructions */}
        {assignment.description && (
          <div
            className="text-sm p-3 rounded-xl"
            style={{
              background: "rgba(200,150,30,0.05)",
              border: "1px solid rgba(200,150,30,0.15)",
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "var(--amber)" }}
            >
              Instructions
            </p>
            <p style={{ color: "var(--text-mid)" }}>{assignment.description}</p>
          </div>
        )}

        <div>
          <label className="label">Your Notes / Answer</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input resize-none h-28"
            placeholder="Describe your approach, add your analysis, or paste a PGN..."
            autoFocus
          />
        </div>

        <div>
          <label className="label">Link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="input"
            placeholder="Lichess.org game link, Lichess study, etc."
          />
        </div>

        <div
          className="text-xs p-3 rounded-xl flex items-start gap-2"
          style={{ background: "var(--bg-subtle)" }}
        >
          <Star
            size={12}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "var(--amber)" }}
          />
          <span style={{ color: "var(--text-muted)" }}>
            Passing score:{" "}
            <strong style={{ color: "var(--text)" }}>
              {assignment.passing_score || 70}/100
            </strong>
            . Max attempts:{" "}
            <strong style={{ color: "var(--text)" }}>
              {assignment.max_attempts || 3}
            </strong>
            .
          </span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submit.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {submit.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {submit.isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const { data: assignments = [], isLoading } = useAssignments({
    studentId: user?.id,
  });
  const [filter, setFilter] = useState("all");
  const [submitTarget, setSubmitTarget] = useState<any>(null);
  const [viewTarget, setViewTarget] = useState<any>(null);

  if (isLoading) return <PageLoading />;

  const now = new Date();

  const counts = {
    pending: assignments.filter(
      (a: any) =>
        !a.submitted_at && (!a.due_date || new Date(a.due_date) > now),
    ).length,
    overdue: assignments.filter(
      (a: any) => !a.submitted_at && a.due_date && new Date(a.due_date) < now,
    ).length,
    submitted: assignments.filter(
      (a: any) => a.submitted_at && a.grade === null,
    ).length,
    graded: assignments.filter(
      (a: any) => a.grade !== null && a.grade !== undefined,
    ).length,
  };

  const filtered =
    filter === "all"
      ? assignments
      : assignments.filter((a: any) => {
          if (filter === "pending")
            return (
              !a.submitted_at && (!a.due_date || new Date(a.due_date) > now)
            );
          if (filter === "overdue")
            return !a.submitted_at && a.due_date && new Date(a.due_date) < now;
          if (filter === "submitted")
            return (
              a.submitted_at && (a.grade === null || a.grade === undefined)
            );
          if (filter === "graded")
            return a.grade !== null && a.grade !== undefined;
          return true;
        });

  const avgGrade = (() => {
    const graded = assignments.filter(
      (a: any) => a.grade !== null && a.grade !== undefined,
    );
    if (!graded.length) return null;
    return Math.round(
      graded.reduce((s: number, a: any) => s + a.grade, 0) / graded.length,
    );
  })();

  return (
    <div className="space-y-5 animate-fade-in">
      {submitTarget && (
        <SubmitModal
          assignment={submitTarget}
          onClose={() => setSubmitTarget(null)}
        />
      )}

      {/* Feedback viewer modal */}
      {viewTarget && (
        <Modal title="Assignment Result" onClose={() => setViewTarget(null)}>
          <div className="space-y-4" style={{ minWidth: "min(420px, 90vw)" }}>
            <div className="flex items-center gap-4">
              {(() => {
                const cfg = TYPE_CFG[viewTarget.type] || TYPE_CFG.custom;
                const Icon = cfg.icon;
                return (
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={20} style={{ color: cfg.color }} />
                  </div>
                );
              })()}
              <div className="flex-1">
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  {viewTarget.title}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Coach: {viewTarget.coach_name || "—"}
                </p>
              </div>
              {viewTarget.grade !== null && viewTarget.grade !== undefined && (
                <GradeCard
                  grade={viewTarget.grade}
                  passingScore={viewTarget.passing_score || 70}
                />
              )}
            </div>

            {viewTarget.submitted_at && (
              <div
                className="p-3 rounded-xl"
                style={{ background: "var(--bg-subtle)" }}
              >
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Your Submission
                </p>
                <p className="text-sm" style={{ color: "var(--text-mid)" }}>
                  {viewTarget.note ||
                    viewTarget.submission?.note ||
                    "No notes added"}
                </p>
                {(viewTarget.link || viewTarget.submission?.link) && (
                  <a
                    href={viewTarget.link || viewTarget.submission?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs mt-2 block"
                    style={{ color: "#1D4ED8" }}
                  >
                    🔗 {viewTarget.link || viewTarget.submission?.link}
                  </a>
                )}
                <p
                  className="text-[10px] mt-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Submitted{" "}
                  {formatDistanceToNow(new Date(viewTarget.submitted_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}

            {viewTarget.feedback ? (
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(200,150,30,0.06)",
                  border: "1px solid rgba(200,150,30,0.2)",
                }}
              >
                <p
                  className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                  style={{ color: "var(--amber)" }}
                >
                  <MessageSquare size={12} />
                  Coach Feedback
                </p>
                <p className="text-sm" style={{ color: "var(--text)" }}>
                  {viewTarget.feedback}
                </p>
                {viewTarget.graded_at && (
                  <p
                    className="text-[10px] mt-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Graded{" "}
                    {formatDistanceToNow(new Date(viewTarget.graded_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            ) : viewTarget.submitted_at ? (
              <div
                className="p-3 rounded-xl text-sm text-center"
                style={{ background: "var(--bg-subtle)" }}
              >
                <p style={{ color: "var(--text-muted)" }}>
                  ⏳ Waiting for your coach to grade this submission
                </p>
              </div>
            ) : null}
          </div>
        </Modal>
      )}

      {/* Header */}
      <h1 className="page-title flex items-center gap-2">
        <ClipboardList size={22} style={{ color: "#7C3AED" }} />
        Assignments
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            key: "pending",
            label: "Pending",
            value: counts.pending,
            color: "#9A6E00",
            bg: "rgba(200,150,30,0.08)",
          },
          {
            key: "overdue",
            label: "Overdue",
            value: counts.overdue,
            color: "#DC2626",
            bg: "#FEF2F2",
          },
          {
            key: "submitted",
            label: "Submitted",
            value: counts.submitted,
            color: "#1D4ED8",
            bg: "#EFF6FF",
          },
          {
            key: "graded",
            label: "Graded",
            value: counts.graded,
            color: "#15803D",
            bg: "#F0FDF4",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className="stat-card text-left transition-all"
            style={
              filter === s.key ? { borderColor: s.color, background: s.bg } : {}
            }
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
          </button>
        ))}
      </div>

      {/* Average grade banner */}
      {avgGrade !== null && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background:
              avgGrade >= 70 ? "rgba(21,128,61,0.06)" : "rgba(220,38,38,0.05)",
            border: `1px solid ${avgGrade >= 70 ? "#BBF7D0" : "#FECDD3"}`,
          }}
        >
          <TrendingUp
            size={18}
            style={{ color: avgGrade >= 70 ? "#15803D" : "#DC2626" }}
          />
          <span className="text-sm" style={{ color: "var(--text-mid)" }}>
            Your average grade:{" "}
            <strong style={{ color: avgGrade >= 70 ? "#15803D" : "#DC2626" }}>
              {avgGrade}/100
            </strong>
            {avgGrade >= 70 ? " — Keep it up! 🎉" : " — Room to improve 💪"}
          </span>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "overdue", label: "Overdue" },
          { key: "submitted", label: "Awaiting Grade" },
          { key: "graded", label: "Graded" },
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

      {/* Assignment cards */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No assignments"
            subtitle="Nothing here for this filter"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a: any) => {
            const cfg = TYPE_CFG[a.type] || TYPE_CFG.custom;
            const Icon = cfg.icon;
            const isOverdue =
              !a.submitted_at && a.due_date && new Date(a.due_date) < now;
            const isSubmitted = !!a.submitted_at;
            const isGraded = a.grade !== null && a.grade !== undefined;
            const isPending = !isSubmitted && !isOverdue;

            return (
              <div
                key={a.id}
                className="card p-5"
                style={
                  isOverdue
                    ? { borderColor: "#FCA5A5" }
                    : isGraded
                      ? { borderColor: "#BBF7D0" }
                      : {}
                }
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Status badges */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="badge text-xs"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {a.type?.replace("_", " ")}
                      </span>
                      {isOverdue && (
                        <span
                          className="badge text-xs flex items-center gap-1"
                          style={{ background: "#FEE2E2", color: "#DC2626" }}
                        >
                          <AlertTriangle size={9} />
                          Overdue
                        </span>
                      )}
                      {isGraded && (
                        <span
                          className="badge text-xs"
                          style={{ background: "#DCFCE7", color: "#15803D" }}
                        >
                          ✅ Graded
                        </span>
                      )}
                      {isSubmitted && !isGraded && (
                        <span
                          className="badge text-xs"
                          style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                        >
                          ⏳ Awaiting grade
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
                        className="text-sm mt-1 line-clamp-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {a.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div
                      className="flex flex-wrap items-center gap-3 mt-2.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {a.coach_name && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={10} />
                          {a.coach_name}
                        </span>
                      )}
                      {a.due_date && (
                        <span
                          className={`flex items-center gap-1 ${isOverdue ? "font-medium" : ""}`}
                          style={{
                            color: isOverdue ? "#DC2626" : "var(--text-muted)",
                          }}
                        >
                          <Clock size={10} />
                          Due{" "}
                          {new Date(a.due_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                          {isPending &&
                            ` · ${formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}`}
                        </span>
                      )}
                      {a.submitted_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Submitted{" "}
                          {formatDistanceToNow(new Date(a.submitted_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>

                    {/* Grade + Feedback preview */}
                    {isGraded && (
                      <div className="mt-3 flex items-start gap-3">
                        <GradeCard
                          grade={a.grade}
                          passingScore={a.passing_score || 70}
                        />
                        {a.feedback && (
                          <div
                            className="flex-1 p-3 rounded-xl"
                            style={{
                              background: "rgba(200,150,30,0.06)",
                              border: "1px solid rgba(200,150,30,0.15)",
                            }}
                          >
                            <p
                              className="text-xs font-semibold mb-1"
                              style={{ color: "var(--amber)" }}
                            >
                              <MessageSquare
                                size={10}
                                className="inline mr-1"
                              />
                              Coach Feedback
                            </p>
                            <p
                              className="text-sm line-clamp-2"
                              style={{ color: "var(--text)" }}
                            >
                              {a.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      {!isSubmitted && (
                        <button
                          onClick={() => setSubmitTarget(a)}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <Upload size={13} />
                          Submit Assignment
                        </button>
                      )}
                      {isSubmitted && (
                        <button
                          onClick={() => setViewTarget(a)}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          <Eye size={13} />
                          {isGraded
                            ? "View Grade & Feedback"
                            : "View Submission"}
                        </button>
                      )}
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
