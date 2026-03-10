"use client";
import { useMyChildren, useStudentAttendance } from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

const COLORS = ["#D4AF37", "#60A5FA", "#4ADE80", "#F472B6", "#A78BFA"];

function ChildAttendance({ child, color }: { child: any; color: string }) {
  const { data: attendance = [], isLoading } = useStudentAttendance(child.id);

  const total = attendance.length;
  const present = attendance.filter((a: any) => a.status === "present").length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: `${color}22`, color }}
          >
            {child.name?.[0]}
          </div>
          <div>
            <div className="font-semibold">{child.name}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {child.batch_name || "No batch"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold" style={{ color }}>
            {pct}%
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {present}/{total} classes
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: "var(--bg-subtle)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background:
              pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626",
          }}
        />
      </div>

      {pct < 75 && total > 0 && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
          style={{ background: "#FEF3C7", color: "#92400E" }}
        >
          ⚠️ Below 75% attendance — please check with the coach.
        </p>
      )}

      {/* Recent classes */}
      {isLoading ? (
        <p
          className="text-xs text-center py-3"
          style={{ color: "var(--text-muted)" }}
        >
          Loading…
        </p>
      ) : attendance.length === 0 ? (
        <p
          className="text-xs text-center py-3"
          style={{ color: "var(--text-muted)" }}
        >
          No classes recorded yet
        </p>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {attendance.slice(0, 12).map((a: any) => (
            <div
              key={a.classroom_id}
              className="flex items-center gap-3 py-2 px-3 rounded-xl"
              style={{
                background:
                  a.status === "present"
                    ? "rgba(22,163,74,0.06)"
                    : "rgba(220,38,38,0.05)",
              }}
            >
              {a.status === "present" ? (
                <CheckCircle2
                  size={14}
                  style={{ color: "#15803D" }}
                  className="shrink-0"
                />
              ) : (
                <XCircle
                  size={14}
                  style={{ color: "#DC2626" }}
                  className="shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {a.class_title}
                </div>
                <div
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {new Date(a.scheduled_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                  <Clock size={9} />
                  {new Date(a.scheduled_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <span
                className="text-xs font-medium shrink-0"
                style={{
                  color: a.status === "present" ? "#15803D" : "#9CA3AF",
                }}
              >
                {a.status === "present" ? "Present" : "Absent"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ParentAttendancePage() {
  const { data: children = [], isLoading } = useMyChildren();

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <Calendar size={22} style={{ color: "#60A5FA" }} />
        Attendance
      </h1>

      {children.length === 0 ? (
        <div className="card">
          <EmptyState title="No children linked" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {children.map((child: any, i: number) => (
            <ChildAttendance
              key={child.id}
              child={child}
              color={COLORS[i % COLORS.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
