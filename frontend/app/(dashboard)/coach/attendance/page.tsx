"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/api";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Avatar from "@/components/shared/Avatar";
import toast from "react-hot-toast";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  scheduled: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)" },
  active: { color: "#15803D", bg: "#DCFCE7" },
  completed: { color: "#5C4A38", bg: "var(--bg-subtle)" },
  cancelled: { color: "#DC2626", bg: "#FEE2E2" },
};

function AttendanceModal({ cls, onClose }: { cls: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: enrolled = [] } = useQuery({
    queryKey: ["batch-students", cls.batch_id],
    queryFn: () =>
      api
        .get(`/batches/${cls.batch_id}/students`)
        .then((r: any) => r.data.students || []),
    enabled: !!cls.batch_id,
  });
  const { data: existing = [] } = useQuery({
    queryKey: ["class-attendance", cls.id],
    queryFn: () =>
      api
        .get(`/classrooms/${cls.id}/attendance`)
        .then((r: any) => r.data.attendance || []),
  });

  const attendedIds = new Set(existing.map((a: any) => a.student_id));
  const [marked, setMarked] = useState(attendedIds);

  const save = useMutation({
    mutationFn: () =>
      api.post(`/classrooms/${cls.id}/attendance/bulk`, {
        present: Array.from(marked),
        absent: enrolled
          .map((s: any) => s.id)
          .filter((id: string) => !marked.has(id)),
      }),
    onSuccess: () => {
      toast.success("Attendance saved & parents notified");
      qc.invalidateQueries({ queryKey: ["class-attendance", cls.id] });
      qc.invalidateQueries({ queryKey: ["coach-classes"] });
      onClose();
    },
    onError: () => toast.error("Failed to save attendance"),
  });

  const toggle = (id: string) =>
    setMarked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="card w-full max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="p-5 border-b border-[var(--border)]">
          <h3 className="font-display font-bold text-lg">{cls.title}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {new Date(cls.scheduled_at).toLocaleString()}
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="font-medium" style={{ color: "#15803D" }}>
              {marked.size} present
            </span>
            <span className="font-medium" style={{ color: "#DC2626" }}>
              {enrolled.length - marked.size} absent
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Quick actions */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMarked(new Set(enrolled.map((s: any) => s.id)))}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <CheckCircle2 size={12} />
              All Present
            </button>
            <button
              onClick={() => setMarked(new Set())}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <XCircle size={12} />
              All Absent
            </button>
          </div>
          {enrolled.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">
              No students enrolled in this batch
            </p>
          ) : (
            enrolled.map((s: any) => (
              <div
                key={s.id}
                onClick={() => toggle(s.id)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all select-none"
                style={{
                  background: marked.has(s.id) ? "#DCFCE7" : "#FEE2E2",
                  border: `1px solid ${marked.has(s.id) ? "#86EFAC" : "#FECACA"}`,
                }}
              >
                <Avatar user={s} size="sm" />
                <div className="flex-1">
                  <div
                    className="font-medium text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    {s.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Rating {s.rating || 1200}
                  </div>
                </div>
                {marked.has(s.id) ? (
                  <CheckCircle2 size={18} className="text-green-600" />
                ) : (
                  <XCircle size={18} className="text-red-400" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {save.isPending ? "Saving…" : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoachAttendancePage() {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["coach-classes"],
    queryFn: () =>
      api
        .get("/classrooms/coach/summary")
        .then((r: any) => r.data.classes || []),
  });

  const { data: classAttendance } = useQuery({
    queryKey: ["class-attendance", expanded],
    queryFn: () =>
      api
        .get(`/classrooms/${expanded}/attendance`)
        .then((r: any) => r.data.attendance || []),
    enabled: !!expanded,
  });

  if (isLoading) return <PageLoading />;

  const grouped = classes.reduce((acc: any, cls: any) => {
    const d = new Date(cls.scheduled_at).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    if (!acc[d]) acc[d] = [];
    acc[d].push(cls);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <Calendar size={22} className="text-[var(--amber)]" />
          Attendance
        </h1>
        <div
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
        >
          {classes.length} classes
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Classes", value: classes.length, color: "#1D4ED8" },
          {
            label: "Avg Attendance",
            value:
              classes.length > 0
                ? Math.round(
                    classes.reduce(
                      (s: number, c: any) =>
                        s +
                        (c.enrolled > 0 ? (c.attended / c.enrolled) * 100 : 0),
                      0,
                    ) / classes.length,
                  ) + "%"
                : "—",
            color: "#15803D",
          },
          {
            label: "This Week",
            value: classes.filter((c: any) => {
              const d = new Date(c.scheduled_at);
              const now = new Date();
              const weekAgo = new Date(now.getTime() - 7 * 86400000);
              return d >= weekAgo && d <= now;
            }).length,
            color: "var(--amber)",
          },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
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

      {classes.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No classes yet"
            subtitle="Classes you teach will appear here"
          />
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayClasses]: any) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-px flex-1"
                style={{ background: "var(--border)" }}
              />
              <span
                className="text-xs font-medium px-2"
                style={{ color: "var(--text-muted)" }}
              >
                {date}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "var(--border)" }}
              />
            </div>
            <div className="space-y-2">
              {dayClasses.map((cls: any) => {
                const cfg = STATUS_CFG[cls.status] || STATUS_CFG.scheduled;
                const pct =
                  cls.enrolled > 0
                    ? Math.round((cls.attended / cls.enrolled) * 100)
                    : 0;
                const isExpanded = expanded === cls.id;
                return (
                  <div key={cls.id} className="card p-0 overflow-hidden">
                    <div className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">
                            {cls.title}
                          </span>
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                            style={{ color: cfg.color, background: cfg.bg }}
                          >
                            {cls.status}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-3 text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(cls.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={10} />
                            {cls.attended}/{cls.enrolled}
                          </span>
                          {cls.enrolled > 0 && (
                            <span
                              style={{
                                color:
                                  pct >= 75
                                    ? "#15803D"
                                    : pct >= 50
                                      ? "#9A6E00"
                                      : "#DC2626",
                              }}
                            >
                              {pct}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setOpenModal(cls)}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Mark
                        </button>
                        <button
                          onClick={() =>
                            setExpanded(isExpanded ? null : cls.id)
                          }
                          className="btn-secondary p-1.5 rounded-lg"
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                    {/* Expanded attendance list */}
                    {isExpanded && (
                      <div
                        className="border-t border-[var(--border)] p-3"
                        style={{ background: "var(--bg-subtle)" }}
                      >
                        {!classAttendance || classAttendance.length === 0 ? (
                          <p
                            className="text-xs text-center py-2"
                            style={{ color: "var(--text-muted)" }}
                          >
                            No attendance marked yet
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {classAttendance.map((a: any) => (
                              <div
                                key={a.student_id}
                                className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 text-xs"
                                style={{ border: "1px solid var(--border)" }}
                              >
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
                                  {a.student_name?.[0]}
                                </div>
                                {a.student_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {openModal && (
        <AttendanceModal cls={openModal} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
}
