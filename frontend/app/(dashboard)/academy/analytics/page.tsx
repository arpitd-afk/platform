"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAcademyAnalytics, useCoachPerformance } from "@/lib/hooks";
import { useUsers } from "@/lib/hooks";
import { PageLoading } from "@/components/shared/States";
import Avatar from "@/components/shared/Avatar";
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Award,
  Star,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const Tip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.dataKey}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  ) : null;

const PERIODS = ["7d", "30d", "90d", "1y"];

// ─── Metric card ──────────────────────────────────────────────
function MetricCard({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-2xl font-bold" style={{ color }}>
            {value}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </div>
          {sub && (
            <div
              className="text-[10px] mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {sub}
            </div>
          )}
        </div>
        {Icon && <Icon size={20} style={{ color, opacity: 0.5 }} />}
      </div>
    </div>
  );
}

// ─── Coach performance row ────────────────────────────────────
function CoachRow({ coach, rank }: { coach: any; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const improvement = coach.avg_student_improvement || 0;
  const attendance = coach.avg_attendance_pct;

  return (
    <div
      className="border rounded-xl overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        style={{
          background: expanded ? "rgba(200,150,30,0.03)" : "var(--bg-card)",
        }}
      >
        {/* Rank */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{
            background:
              rank === 1
                ? "#FFF8DC"
                : rank === 2
                  ? "#F5F5F5"
                  : rank === 3
                    ? "#FFF0E8"
                    : "var(--bg-subtle)",
            color:
              rank === 1
                ? "#B8860B"
                : rank === 2
                  ? "#888"
                  : rank === 3
                    ? "#CD7F32"
                    : "var(--text-muted)",
          }}
        >
          {rank === 1
            ? "🥇"
            : rank === 2
              ? "🥈"
              : rank === 3
                ? "🥉"
                : `#${rank}`}
        </div>

        {/* Avatar + name */}
        <Avatar
          user={{ name: coach.name, avatar: coach.avatar, role: "coach" }}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-sm"
            style={{ color: "var(--text)" }}
          >
            {coach.name}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {coach.email}
          </div>
        </div>

        {/* Quick metrics */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0 text-center">
          <div>
            <div
              className="font-display text-base font-bold"
              style={{ color: "#1D4ED8" }}
            >
              {coach.hours_taught.toFixed(1)}h
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Hours
            </div>
          </div>
          <div>
            <div
              className="font-display text-base font-bold"
              style={{ color: "#15803D" }}
            >
              {coach.classes_completed}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Classes
            </div>
          </div>
          <div>
            <div
              className="font-display text-base font-bold"
              style={{
                color:
                  improvement > 0
                    ? "#15803D"
                    : improvement < 0
                      ? "#DC2626"
                      : "var(--text-muted)",
              }}
            >
              {improvement > 0 ? "+" : ""}
              {improvement}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Avg Δ
            </div>
          </div>
          {attendance !== null && (
            <div>
              <div
                className="font-display text-base font-bold"
                style={{
                  color:
                    attendance >= 75
                      ? "#15803D"
                      : attendance >= 50
                        ? "#9A6E00"
                        : "#DC2626",
                }}
              >
                {attendance}%
              </div>
              <div
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                Attendance
              </div>
            </div>
          )}
        </div>

        {expanded ? (
          <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-5 pb-5 pt-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              {
                icon: Clock,
                label: "Hours Taught",
                value: `${coach.hours_taught.toFixed(1)}h`,
                color: "#1D4ED8",
              },
              {
                icon: BookOpen,
                label: "Classes Completed",
                value: coach.classes_completed,
                color: "#15803D",
              },
              {
                icon: Target,
                label: "Upcoming Classes",
                value: coach.classes_upcoming,
                color: "#9A6E00",
              },
              {
                icon: Users,
                label: "Batches",
                value: coach.batches_count,
                color: "#7C3AED",
              },
              {
                icon: ClipboardList,
                label: "Assignments Created",
                value: coach.assignments_created,
                color: "#BE185D",
              },
              {
                icon: CheckCircle2,
                label: "Submissions Graded",
                value: coach.submissions_graded,
                color: "#15803D",
              },
              {
                icon: TrendingUp,
                label: "Avg Student Improvement",
                value:
                  improvement !== 0
                    ? `${improvement > 0 ? "+" : ""}${improvement} pts`
                    : "No data",
                color:
                  improvement > 0
                    ? "#15803D"
                    : improvement < 0
                      ? "#DC2626"
                      : "var(--text-muted)",
              },
              {
                icon: Star,
                label: "Avg Attendance",
                value: attendance !== null ? `${attendance}%` : "No data",
                color:
                  attendance === null
                    ? "var(--text-muted)"
                    : attendance >= 75
                      ? "#15803D"
                      : attendance >= 50
                        ? "#9A6E00"
                        : "#DC2626",
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="p-3 rounded-xl"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <Icon
                    size={14}
                    className="mb-1.5"
                    style={{ color: m.color }}
                  />
                  <div
                    className="font-display text-lg font-bold"
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Performance bar */}
          {attendance !== null && (
            <div className="mt-4">
              <div
                className="flex items-center justify-between text-xs mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <span>Attendance Rate</span>
                <span
                  style={{ color: attendance >= 75 ? "#15803D" : "#DC2626" }}
                >
                  {attendance}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${attendance}%`,
                    background:
                      attendance >= 75
                        ? "#15803D"
                        : attendance >= 50
                          ? "#9A6E00"
                          : "#DC2626",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function AcademyAnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [tab, setTab] = useState<"overview" | "coaches">("overview");

  const { data: analytics, isLoading: aLoading } = useAcademyAnalytics(
    user?.academy_id,
    period,
  );
  const { data: coachData, isLoading: cLoading } = useCoachPerformance(
    user?.academy_id,
    period,
  );
  const { data: students = [] } = useUsers({ role: "student" });
  const { data: coaches = [] } = useUsers({ role: "coach" });

  if (aLoading) return <PageLoading />;

  const avgRating =
    students.length > 0
      ? Math.round(
          students.reduce((s: number, x: any) => s + (x.rating || 1200), 0) /
            students.length,
        )
      : 1200;

  const coachList = coachData?.coaches || [];
  const summary = coachData?.summary || {};

  // Rating distribution for chart
  const ratingBuckets = [
    { r: "<800", c: 0 },
    { r: "800-1k", c: 0 },
    { r: "1k-1.2k", c: 0 },
    { r: "1.2k-1.4k", c: 0 },
    { r: ">1.4k", c: 0 },
  ];
  students.forEach((s: any) => {
    const r = s.rating || 1200;
    if (r < 800) ratingBuckets[0].c++;
    else if (r < 1000) ratingBuckets[1].c++;
    else if (r < 1200) ratingBuckets[2].c++;
    else if (r < 1400) ratingBuckets[3].c++;
    else ratingBuckets[4].c++;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 size={22} style={{ color: "#F472B6" }} />
          Analytics
        </h1>
        <div className="flex gap-1 card p-1 rounded-xl">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                period === p
                  ? { background: "rgba(244,114,182,0.15)", color: "#F472B6" }
                  : { color: "var(--text-muted)" }
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Students"
          value={students.length}
          color="#1D4ED8"
          icon={Users}
        />
        <MetricCard
          label="Avg Rating"
          value={avgRating}
          color="var(--amber)"
          icon={Star}
        />
        <MetricCard
          label="Active Coaches"
          value={coaches.filter((c: any) => c.is_active).length}
          color="#15803D"
          icon={Award}
        />
        <MetricCard
          label="Games This Period"
          value={analytics?.totalGames || 0}
          color="#7C3AED"
          icon={Target}
        />
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 card p-1 rounded-xl w-fit">
        {(["overview", "coaches"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={
              tab === t
                ? { background: "rgba(244,114,182,0.12)", color: "#F472B6" }
                : { color: "var(--text-muted)" }
            }
          >
            {t === "coaches" ? "Coach Performance" : "Overview"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Rating Distribution */}
          <div className="card p-6">
            <h3 className="section-title mb-4">Student Rating Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingBuckets} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="r"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  content={<Tip />}
                  cursor={{ fill: "var(--bg-hover)" }}
                />
                <Bar
                  dataKey="c"
                  name="students"
                  radius={[6, 6, 0, 0]}
                  fill="var(--amber)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Class stats */}
          <div className="card p-6">
            <h3 className="section-title mb-4">Classroom Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Classes",
                  value: analytics?.classrooms?.total || "—",
                  color: "#1D4ED8",
                },
                {
                  label: "Completed",
                  value: analytics?.classrooms?.completed || "—",
                  color: "#15803D",
                },
                {
                  label: "Avg Duration",
                  value: analytics?.classrooms?.avg_duration_min
                    ? `${Math.round(analytics.classrooms.avg_duration_min)}m`
                    : "—",
                  color: "var(--amber)",
                },
                {
                  label: "Avg Rating",
                  value: analytics?.studentPerformance?.avg_rating
                    ? Math.round(analytics.studentPerformance.avg_rating)
                    : "—",
                  color: "#7C3AED",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-4 rounded-xl"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <div
                    className="font-display text-2xl font-bold"
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

            {analytics?.topStudents?.length > 0 && (
              <div className="mt-5">
                <p
                  className="text-xs font-semibold mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  TOP STUDENTS BY RATING
                </p>
                <div className="space-y-2">
                  {analytics.topStudents
                    .slice(0, 5)
                    .map((s: any, i: number) => (
                      <div key={s.name} className="flex items-center gap-3">
                        <span
                          className="text-sm w-5 text-center"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `#${i + 1}`}
                        </span>
                        <Avatar
                          user={{
                            name: s.name,
                            avatar: s.avatar,
                            role: "student",
                          }}
                          size="xs"
                        />
                        <span
                          className="flex-1 text-sm"
                          style={{ color: "var(--text)" }}
                        >
                          {s.name}
                        </span>
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: "var(--amber)" }}
                        >
                          {s.rating}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COACH PERFORMANCE TAB ── */}
      {tab === "coaches" && (
        <div className="space-y-4">
          {cLoading ? (
            <div className="card p-10 text-center">
              <div className="animate-spin text-2xl mb-2">⟳</div>
              <p style={{ color: "var(--text-muted)" }}>
                Loading coach data...
              </p>
            </div>
          ) : (
            <>
              {/* Summary row */}
              {coachList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricCard
                    label="Coaches"
                    value={summary.total_coaches || coachList.length}
                    color="#15803D"
                    icon={Users}
                  />
                  <MetricCard
                    label="Total Hours Taught"
                    value={`${(summary.total_hours || 0).toFixed(1)}h`}
                    color="#1D4ED8"
                    icon={Clock}
                    sub={`Last ${period}`}
                  />
                  <MetricCard
                    label="Classes Delivered"
                    value={summary.total_classes || 0}
                    color="#7C3AED"
                    icon={BookOpen}
                    sub={`Last ${period}`}
                  />
                  <MetricCard
                    label="Avg Attendance"
                    value={
                      summary.avg_attendance !== null
                        ? `${summary.avg_attendance}%`
                        : "—"
                    }
                    color={summary.avg_attendance >= 75 ? "#15803D" : "#9A6E00"}
                    icon={Target}
                  />
                </div>
              )}

              {coachList.length === 0 ? (
                <div className="card p-12 text-center">
                  <Users
                    size={36}
                    className="mx-auto mb-3"
                    style={{ color: "var(--border-md)" }}
                  />
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    No coaches found
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Add coaches to your academy to see their performance
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Sorted by hours taught · Click any row to expand details
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Period: {period}
                    </p>
                  </div>
                  {coachList.map((coach: any, i: number) => (
                    <CoachRow key={coach.id} coach={coach} rank={i + 1} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
