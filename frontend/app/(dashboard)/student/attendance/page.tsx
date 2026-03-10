"use client";
import { useAuth } from "@/lib/auth-context";
import { useStudentAttendance } from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";

function AttendanceBadge({ pct }: { pct: number }) {
  if (pct >= 90)
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: "#DCFCE7", color: "#15803D" }}
      >
        Excellent
      </span>
    );
  if (pct >= 75)
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: "rgba(200,150,30,0.12)", color: "#9A6E00" }}
      >
        Good
      </span>
    );
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: "#FEE2E2", color: "#DC2626" }}
    >
      Needs Improvement
    </span>
  );
}

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { data: attendance = [], isLoading } = useStudentAttendance(user?.id);

  if (isLoading) return <PageLoading />;

  const total = attendance.length;
  const present = attendance.filter((a: any) => a.status === "present").length;
  const absent = total - present;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  // Group by month
  const grouped = attendance.reduce((acc: any, a: any) => {
    const month = new Date(a.scheduled_at).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    if (!acc[month]) acc[month] = [];
    acc[month].push(a);
    return acc;
  }, {});

  // Last 8 weeks for streak chart
  const weeks: { label: string; pct: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const weekClasses = attendance.filter((a: any) => {
      const d = new Date(a.scheduled_at);
      return d >= start && d <= end;
    });
    const wp =
      weekClasses.length > 0
        ? Math.round(
            (weekClasses.filter((a: any) => a.status === "present").length /
              weekClasses.length) *
              100,
          )
        : -1;
    weeks.push({
      label: end.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      pct: wp,
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <Calendar size={22} style={{ color: "var(--amber)" }} />
        My Attendance
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Classes", value: total, color: "#1D4ED8" },
          { label: "Present", value: present, color: "#15803D" },
          { label: "Absent", value: absent, color: "#DC2626" },
          {
            label: "Attendance %",
            value: `${pct}%`,
            color: pct >= 75 ? "#15803D" : "#DC2626",
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

      {total === 0 ? (
        <div className="card">
          <EmptyState
            title="No classes yet"
            subtitle="Your attendance will appear here once classes are marked"
          />
        </div>
      ) : (
        <>
          {/* Overall progress card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award size={18} style={{ color: "var(--amber)" }} />
                <span className="font-semibold">Overall Attendance</span>
              </div>
              <AttendanceBadge pct={pct} />
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden"
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
            <div
              className="flex justify-between text-xs mt-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <span>{present} present</span>
              <span>{pct}%</span>
              <span>{absent} absent</span>
            </div>
            {pct < 75 && (
              <p
                className="text-xs mt-3 px-3 py-2 rounded-lg"
                style={{ background: "#FEF3C7", color: "#92400E" }}
              >
                ⚠️ Your attendance is below 75%. Regular attendance is important
                for progress.
              </p>
            )}
          </div>

          {/* Weekly bar chart */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: "var(--amber)" }} />
              <span className="font-semibold text-sm">Last 8 Weeks</span>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {weeks.map((w, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: w.pct < 0 ? "4px" : `${Math.max(w.pct, 4)}%`,
                      background:
                        w.pct < 0
                          ? "var(--border)"
                          : w.pct >= 75
                            ? "#16A34A"
                            : w.pct >= 50
                              ? "#D97706"
                              : "#DC2626",
                      opacity: w.pct < 0 ? 0.3 : 1,
                    }}
                  />
                  <span
                    className="text-[9px] text-center leading-tight"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {w.pct < 0 ? "—" : `${w.pct}%`}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1">
              {weeks.map((w, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-[8px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {w.label}
                </div>
              ))}
            </div>
          </div>

          {/* Monthly breakdown */}
          {Object.entries(grouped).map(([month, classes]: any) => {
            const mp = classes.filter(
              (a: any) => a.status === "present",
            ).length;
            const mpct = Math.round((mp / classes.length) * 100);
            return (
              <div key={month} className="card p-0 overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{
                    background: "var(--bg-subtle)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span className="font-semibold text-sm">{month}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span style={{ color: "#15803D" }}>
                      {mp}/{classes.length} present
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: mpct >= 75 ? "#15803D" : "#DC2626" }}
                    >
                      {mpct}%
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {classes.map((a: any) => (
                    <div
                      key={a.classroom_id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0`}
                        style={{
                          background:
                            a.status === "present" ? "#DCFCE7" : "#FEE2E2",
                        }}
                      >
                        {a.status === "present" ? (
                          <CheckCircle2
                            size={16}
                            style={{ color: "#15803D" }}
                          />
                        ) : (
                          <XCircle size={16} style={{ color: "#DC2626" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {a.class_title}
                        </div>
                        <div
                          className="text-xs flex items-center gap-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span>
                            {new Date(a.scheduled_at).toLocaleDateString(
                              "en-IN",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {new Date(a.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {a.batch_name && <span>· {a.batch_name}</span>}
                        </div>
                      </div>
                      <div
                        className="text-xs font-medium shrink-0"
                        style={{
                          color: a.status === "present" ? "#15803D" : "#DC2626",
                        }}
                      >
                        {a.status === "present" ? "Present" : "Absent"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
