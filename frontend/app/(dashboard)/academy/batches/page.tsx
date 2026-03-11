"use client";
import { useState } from "react";
import { useBatches, useUsers } from "@/lib/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { batchesAPI } from "@/lib/api";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import Avatar from "@/components/shared/Avatar";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  Loader2,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

function BatchModal({ batch, onClose }: { batch?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: coaches = [] } = useUsers({ role: "coach" });
  const [name, setName] = useState(batch?.name || "");
  const [coachId, setCoachId] = useState(batch?.coach_id || "");
  const rawSchedule = batch?.schedule;
  const [schedule, setSchedule] = useState<string>(
    !rawSchedule ? "" : typeof rawSchedule === "string" ? rawSchedule : "",
  );
  const [maxSize, setMaxSize] = useState(batch?.max_students || 20);
  const isEdit = !!batch;

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      isEdit
        ? batchesAPI.update(batch.id, {
            name,
            coachId: coachId || undefined,
            schedule,
            maxStudents: maxSize,
          })
        : batchesAPI.create({
            name,
            coachId: coachId || undefined,
            schedule,
            maxStudents: maxSize,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast.success(isEdit ? "Batch updated!" : "Batch created!");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  return (
    <Modal title={isEdit ? "Edit Batch" : "Create Batch"} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Batch Name *</label>
          <input
            className="input"
            placeholder="e.g. Beginners A, Advanced Monday"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assign Coach</label>
            <select
              className="input"
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
            >
              <option value="">No coach assigned</option>
              {coaches.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Max Students</label>
            <input
              className="input"
              type="number"
              min={1}
              max={100}
              value={maxSize}
              onChange={(e) => setMaxSize(Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="label">Schedule</label>
          <input
            className="input"
            placeholder="e.g. Mon/Wed 5–6pm"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => mutateAsync()}
            disabled={isPending || !name}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Batch"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function BatchesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { data: batches = [], isLoading } = useBatches({});

  const filtered = batches.filter(
    (b: any) => !search || b.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete batch "${name}"? Students will not be deleted.`))
      return;
    setDeleting(id);
    try {
      await batchesAPI.delete(id);
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast.success("Batch deleted");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-5 animate-fade-in">
      {showModal && <BatchModal onClose={() => setShowModal(false)} />}
      {editing && (
        <BatchModal batch={editing} onClose={() => setEditing(null)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Layers size={22} style={{ color: "var(--amber)" }} />
          Batches
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Create Batch
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            className="input pl-9 text-sm"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="stat-card flex-row items-center gap-2 px-4 py-2.5">
          <span
            className="text-2xl font-display font-bold"
            style={{ color: "var(--amber)" }}
          >
            {batches.length}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Total Batches
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No batches yet"
            subtitle="Create your first batch to group students"
            action={
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-sm"
              >
                <Plus size={14} />
                Create Batch
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b: any) => (
            <div key={b.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {b.name}
                  </h3>
                  {typeof b.schedule === "string" && b.schedule.trim() && (
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {b.schedule}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(b)}
                    className="btn-icon w-8 h-8"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.name)}
                    disabled={deleting === b.id}
                    className="btn-icon w-8 h-8"
                    style={{ color: "#DC2626" }}
                  >
                    {deleting === b.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>

              {b.coach_name && (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-mid)" }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "rgba(21,128,61,0.12)",
                      color: "#15803D",
                    }}
                  >
                    {b.coach_name?.[0]}
                  </div>
                  {b.coach_name}
                </div>
              )}

              <div
                className="flex items-center justify-between pt-1"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "var(--text-mid)" }}
                >
                  <Users size={14} />
                  <span>
                    {b.student_count || 0} / {b.max_students || "∞"} students
                  </span>
                </div>
                <div className="progress-bar w-24">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, ((b.student_count || 0) / (b.max_students || 20)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
