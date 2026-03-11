"use client";
import { useState } from "react";
import { useUsers, useBatches } from "@/lib/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersAPI, batchesAPI, api } from "@/lib/api";
import { PageLoading, EmptyState } from "@/components/shared/States";
import CreateUserModal from "@/components/shared/CreateUserModal";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import {
  UserCheck,
  Search,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  X,
  Users,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Star,
  CheckCircle2,
  UserMinus,
  BookMarked,
  Layers,
  Phone,
  Mail,
  UserX,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";

const LEVEL_CFG: Record<string, { label: string; color: string; bg: string }> =
  {
    beginner: { label: "Beginner", color: "#15803D", bg: "#DCFCE7" },
    intermediate: {
      label: "Intermediate",
      color: "#9A6E00",
      bg: "rgba(200,150,30,0.12)",
    },
    advanced: { label: "Advanced", color: "#DC2626", bg: "#FEE2E2" },
    expert: { label: "Expert", color: "#7C3AED", bg: "#EDE9FE" },
  };

// ─── Edit Coach Modal ─────────────────────────────────────────────────────────
function EditCoachModal({
  coach,
  onClose,
}: {
  coach: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(coach.name);
  const [phone, setPhone] = useState(coach.phone || "");
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => usersAPI.update(coach.id, { name, phone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Coach updated");
      onClose();
    },
    onError: () => toast.error("Update failed"),
  });
  return (
    <Modal title="Edit Coach" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={coach.email} disabled />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => mutateAsync()}
            disabled={isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Assign Students Modal ────────────────────────────────────────────────────
function AssignStudentsModal({
  coach,
  allStudents,
  onClose,
}: {
  coach: any;
  allStudents: any[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const assignedIds = new Set(
    allStudents
      .filter((s) => s.assigned_coach_id === coach.id)
      .map((s) => s.id),
  );

  const filtered = allStudents.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = async (student: any) => {
    const isAssigned = assignedIds.has(student.id);
    setSaving(student.id);
    try {
      await usersAPI.assignCoach(student.id, isAssigned ? null : coach.id);
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["coaches-with-students"] });
      toast.success(
        isAssigned
          ? `${student.name} unassigned`
          : `${student.name} assigned to ${coach.name}`,
      );
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(null);
    }
  };

  const assignedStudents = allStudents.filter((s) => assignedIds.has(s.id));

  return (
    <Modal title={`Assign Students — ${coach.name}`} onClose={onClose}>
      <div className="space-y-4">
        {/* Current count badge */}
        <div
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: "var(--bg-subtle)" }}
        >
          <Avatar user={coach} size="sm" />
          <div className="flex-1">
            <div className="font-semibold text-sm">{coach.name}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {coach.email}
            </div>
          </div>
          <div
            className="text-center px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(200,150,30,0.12)" }}
          >
            <div className="font-bold" style={{ color: "var(--amber)" }}>
              {assignedIds.size}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              assigned
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="input pl-9 text-sm py-2"
          />
        </div>

        {/* Student list */}
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p
              className="text-center text-sm py-6"
              style={{ color: "var(--text-muted)" }}
            >
              No students found
            </p>
          )}
          {filtered.map((s: any) => {
            const isAssigned = assignedIds.has(s.id);
            const isOtherCoach =
              !isAssigned &&
              s.assigned_coach_id &&
              s.assigned_coach_id !== coach.id;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer hover:bg-[var(--bg-hover)]"
                style={{
                  background: isAssigned
                    ? "rgba(21,128,61,0.06)"
                    : "transparent",
                }}
                onClick={() => !saving && toggle(s)}
              >
                <Avatar user={s} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  {isOtherCoach && (
                    <div className="text-[10px]" style={{ color: "#9A6E00" }}>
                      Currently: {s.assigned_coach_name}
                    </div>
                  )}
                </div>
                <span
                  className="text-xs font-mono shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.rating}
                </span>
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {saving === s.id ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                      style={{ color: "var(--amber)" }}
                    />
                  ) : isAssigned ? (
                    <CheckCircle2 size={16} style={{ color: "#15803D" }} />
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: "var(--border-md)" }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {assignedIds.size} students assigned
          </span>
          <button onClick={onClose} className="btn-primary text-sm">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Assign Batches Modal ─────────────────────────────────────────────────────
function AssignBatchesModal({
  coach,
  allBatches,
  onClose,
}: {
  coach: any;
  allBatches: any[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const myBatchIds = new Set(
    allBatches.filter((b) => b.coach_id === coach.id).map((b) => b.id),
  );

  const filtered = allBatches.filter(
    (b) => !search || b.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = async (batch: any) => {
    const isMine = myBatchIds.has(batch.id);
    setSaving(batch.id);
    try {
      await batchesAPI.update(batch.id, { coachId: isMine ? null : coach.id });
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["coaches-with-students"] });
      toast.success(
        isMine
          ? `Batch unassigned`
          : `"${batch.name}" assigned to ${coach.name}`,
      );
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal title={`Assign Batches — ${coach.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: "var(--bg-subtle)" }}
        >
          <Avatar user={coach} size="sm" />
          <div className="flex-1">
            <div className="font-semibold text-sm">{coach.name}</div>
          </div>
          <div
            className="text-center px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(200,150,30,0.12)" }}
          >
            <div className="font-bold" style={{ color: "var(--amber)" }}>
              {myBatchIds.size}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              batches
            </div>
          </div>
        </div>

        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batches…"
            className="input pl-9 text-sm py-2"
          />
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p
              className="text-center text-sm py-6"
              style={{ color: "var(--text-muted)" }}
            >
              No batches found
            </p>
          )}
          {filtered.map((b: any) => {
            const isMine = myBatchIds.has(b.id);
            const isOtherCoach =
              !isMine && b.coach_id && b.coach_id !== coach.id;
            const lc = LEVEL_CFG[b.level] || LEVEL_CFG.beginner;
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer hover:bg-[var(--bg-hover)]"
                style={{
                  background: isMine ? "rgba(21,128,61,0.06)" : "transparent",
                }}
                onClick={() => !saving && toggle(b)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: lc.bg }}
                >
                  <BookOpen size={14} style={{ color: lc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: lc.bg, color: lc.color }}
                    >
                      {lc.label}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {b.student_count || 0} students
                    </span>
                    {isOtherCoach && (
                      <span
                        className="text-[10px]"
                        style={{ color: "#9A6E00" }}
                      >
                        → {b.coach_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {saving === b.id ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                      style={{ color: "var(--amber)" }}
                    />
                  ) : isMine ? (
                    <CheckCircle2 size={16} style={{ color: "#15803D" }} />
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: "var(--border-md)" }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {myBatchIds.size} batches assigned
          </span>
          <button onClick={onClose} className="btn-primary text-sm">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Coach Card ───────────────────────────────────────────────────────────────
function CoachCard({
  coach,
  allStudents,
  allBatches,
  onEdit,
  onDelete,
  onAssignStudents,
  onAssignBatches,
  deleting,
}: any) {
  const assignedStudents = allStudents.filter(
    (s: any) => s.assigned_coach_id === coach.id,
  );
  const assignedBatches = allBatches.filter(
    (b: any) => b.coach_id === coach.id,
  );

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      {/* Coach header */}
      <div className="p-4 flex items-start gap-3">
        <Avatar user={coach} size="md" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold" style={{ color: "var(--text)" }}>
            {coach.name}
          </div>
          <div
            className="flex items-center gap-1 text-xs mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            <Mail size={10} />
            {coach.email}
          </div>
          {coach.phone && (
            <div
              className="flex items-center gap-1 text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              <Phone size={10} />
              {coach.phone}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(coach)}
            className="btn-icon w-7 h-7"
            title="Edit coach"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onDelete(coach.id, coach.name)}
            disabled={deleting === coach.id}
            className="btn-icon w-7 h-7"
            style={{ color: "#DC2626" }}
            title="Deactivate"
          >
            {deleting === coach.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "var(--bg-subtle)" }}
        >
          <div
            className="text-xl font-bold font-display"
            style={{ color: "var(--amber)" }}
          >
            {assignedStudents.length}
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Students
          </div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "var(--bg-subtle)" }}
        >
          <div
            className="text-xl font-bold font-display"
            style={{ color: "#1D4ED8" }}
          >
            {assignedBatches.length}
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Batches
          </div>
        </div>
      </div>

      {/* Students preview */}
      <div className="border-t border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span
            className="text-xs font-semibold flex items-center gap-1.5"
            style={{ color: "var(--text-mid)" }}
          >
            <GraduationCap size={12} />
            Students
          </span>
          <button
            onClick={() => onAssignStudents(coach)}
            className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: "var(--amber)" }}
          >
            <Plus size={10} />
            Manage
          </button>
        </div>
        {assignedStudents.length === 0 ? (
          <button
            onClick={() => onAssignStudents(coach)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-2 mx-4 rounded-xl text-xs transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              width: "calc(100% - 2rem)",
              border: "1.5px dashed var(--border-md)",
              color: "var(--text-muted)",
            }}
          >
            <UserX size={13} />
            No students assigned
          </button>
        ) : (
          <div className="px-4 pb-3 space-y-1">
            {assignedStudents.slice(0, 4).map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <Avatar user={s} size="xs" />
                <span className="text-sm flex-1 truncate">{s.name}</span>
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--amber)" }}
                >
                  {s.rating}
                </span>
              </div>
            ))}
            {assignedStudents.length > 4 && (
              <button
                onClick={() => onAssignStudents(coach)}
                className="w-full text-xs py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                +{assignedStudents.length - 4} more — view all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Batches preview */}
      <div className="border-t border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span
            className="text-xs font-semibold flex items-center gap-1.5"
            style={{ color: "var(--text-mid)" }}
          >
            <BookOpen size={12} />
            Batches
          </span>
          <button
            onClick={() => onAssignBatches(coach)}
            className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: "#1D4ED8" }}
          >
            <Plus size={10} />
            Manage
          </button>
        </div>
        {assignedBatches.length === 0 ? (
          <button
            onClick={() => onAssignBatches(coach)}
            className="flex items-center justify-center gap-2 py-3 mb-3 rounded-xl text-xs transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              width: "calc(100% - 2rem)",
              margin: "0 1rem 0.75rem",
              border: "1.5px dashed var(--border-md)",
              color: "var(--text-muted)",
            }}
          >
            <Layers size={13} />
            No batches assigned
          </button>
        ) : (
          <div className="px-4 pb-3 space-y-1.5">
            {assignedBatches.slice(0, 3).map((b: any) => {
              const lc = LEVEL_CFG[b.level] || LEVEL_CFG.beginner;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{ background: lc.bg }}
                  >
                    <BookOpen size={10} style={{ color: lc.color }} />
                  </div>
                  <span className="text-sm flex-1 truncate">{b.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                    style={{ background: lc.bg, color: lc.color }}
                  >
                    {lc.label}
                  </span>
                </div>
              );
            })}
            {assignedBatches.length > 3 && (
              <button
                onClick={() => onAssignBatches(coach)}
                className="w-full text-xs py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                +{assignedBatches.length - 3} more — view all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-auto grid grid-cols-2 border-t border-[var(--border)]">
        <button
          onClick={() => onAssignStudents(coach)}
          className="flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "#15803D", borderRight: "1px solid var(--border)" }}
        >
          <Users size={13} />
          Students
        </button>
        <button
          onClick={() => onAssignBatches(coach)}
          className="flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "#1D4ED8" }}
        >
          <BookMarked size={13} />
          Batches
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CoachesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [assigningStudents, setAssigningStudents] = useState<any>(null);
  const [assigningBatches, setAssigningBatches] = useState<any>(null);

  const { data: coaches = [], isLoading: coachLoading } = useUsers({
    role: "coach",
  });
  const { data: allStudents = [], isLoading: stuLoading } = useUsers({
    role: "student",
  });
  const { data: allBatches = [], isLoading: batchLoading } = useBatches({});

  const isLoading = coachLoading || stuLoading || batchLoading;

  const filtered = coaches.filter(
    (c: any) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Deactivate coach "${name}"? This will not delete their account.`,
      )
    )
      return;
    setDeleting(id);
    try {
      await usersAPI.updateStatus(id, false);
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${name} deactivated`);
    } catch {
      toast.error("Failed");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) return <PageLoading />;

  const unassignedStudents = allStudents.filter(
    (s: any) => !s.assigned_coach_id,
  ).length;
  const unassignedBatches = allBatches.filter((b: any) => !b.coach_id).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {showCreate && (
        <CreateUserModal role="coach" onClose={() => setShowCreate(false)} />
      )}
      {editing && (
        <EditCoachModal coach={editing} onClose={() => setEditing(null)} />
      )}
      {assigningStudents && (
        <AssignStudentsModal
          coach={assigningStudents}
          allStudents={allStudents}
          onClose={() => setAssigningStudents(null)}
        />
      )}
      {assigningBatches && (
        <AssignBatchesModal
          coach={assigningBatches}
          allBatches={allBatches}
          onClose={() => setAssigningBatches(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <UserCheck size={22} style={{ color: "var(--amber)" }} />
          Coaches
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Add Coach
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Coaches",
            value: coaches.length,
            color: "var(--amber)",
          },
          {
            label: "Total Students",
            value: allStudents.length,
            color: "#1D4ED8",
          },
          {
            label: "Unassigned Students",
            value: unassignedStudents,
            color: unassignedStudents > 0 ? "#DC2626" : "#15803D",
          },
          {
            label: "Unassigned Batches",
            value: unassignedBatches,
            color: unassignedBatches > 0 ? "#DC2626" : "#15803D",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div
              className="text-2xl font-display font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts for unassigned */}
      {(unassignedStudents > 0 || unassignedBatches > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {unassignedStudents > 0 && (
            <div
              className="flex-1 flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
            >
              <UserX size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {unassignedStudents} student{unassignedStudents > 1 ? "s" : ""}{" "}
                without a coach — click any coach card to assign
              </p>
            </div>
          )}
          {unassignedBatches > 0 && (
            <div
              className="flex-1 flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(200,150,30,0.08)",
                border: "1px solid rgba(200,150,30,0.25)",
              }}
            >
              <Layers
                size={16}
                style={{ color: "var(--amber)" }}
                className="shrink-0"
              />
              <p className="text-sm font-medium" style={{ color: "#9A6E00" }}>
                {unassignedBatches} batch{unassignedBatches > 1 ? "es" : ""}{" "}
                without a coach — click any coach card to assign
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          className="input pl-9 text-sm"
          placeholder="Search coaches…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Coach grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No coaches yet"
            subtitle="Add your first coach to start assigning students and batches"
            action={
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={14} />
                Add Coach
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((coach: any) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              allStudents={allStudents}
              allBatches={allBatches}
              onEdit={setEditing}
              onDelete={handleDelete}
              onAssignStudents={setAssigningStudents}
              onAssignBatches={setAssigningBatches}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
