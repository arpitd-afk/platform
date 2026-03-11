"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { studentReportsAPI, api } from "@/lib/api";
import { PageLoading } from "@/components/shared/States";
import toast from "react-hot-toast";
import {
  FileText,
  Download,
  User,
  Trophy,
  Target,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Loader2,
  ChevronRight,
} from "lucide-react";

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="font-display text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div
        className="text-xs font-medium mt-1"
        style={{ color: "var(--text-mid)" }}
      >
        {label}
      </div>
      {sub && (
        <div
          className="text-[10px] mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export default function StudentReportsPage() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [periodDays, setPeriodDays] = useState(90);
  const [downloading, setDownloading] = useState(false);

  const { data: students = [], isLoading: stuLoading } = useQuery({
    queryKey: ["coach-students-report"],
    queryFn: () =>
      api
        .get("/users", { params: { role: "student" } })
        .then((r) => r.data.users || []),
  });

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["student-report-data", selectedStudent?.id, periodDays],
    queryFn: () =>
      studentReportsAPI
        .data(selectedStudent!.id, periodDays)
        .then((r) => r.data),
    enabled: !!selectedStudent,
  });

  const downloadReport = async () => {
    if (!selectedStudent) return;
    setDownloading(true);
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    try {
      const r = await fetch(
        studentReportsAPI.pdfUrl(selectedStudent.id, periodDays),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `report_${selectedStudent.name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      toast.success("Report downloaded!");
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <FileText size={22} style={{ color: "#F472B6" }} />
          Student Reports
        </h1>
        {selectedStudent && (
          <button
            onClick={downloadReport}
            disabled={downloading || reportLoading}
            className="btn-primary flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Download size={14} />
                Download PDF Report
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Student selector */}
        <div className="card p-0 overflow-hidden">
          <div
            className="p-4 border-b border-[var(--border)]"
            style={{ background: "var(--bg-subtle)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Students
            </p>
          </div>
          {/* Period selector */}
          <div className="p-3 border-b border-[var(--border)]">
            <select
              className="input text-sm py-1.5"
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
            >
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {stuLoading ? (
              <div className="p-6 text-center">
                <Loader2
                  size={18}
                  className="animate-spin mx-auto"
                  style={{ color: "var(--amber)" }}
                />
              </div>
            ) : (
              students.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-hover)]"
                  style={{
                    background:
                      selectedStudent?.id === s.id
                        ? "var(--bg-subtle)"
                        : "transparent",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                  >
                    {s.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Rating: {s.rating}
                    </div>
                  </div>
                  {selectedStudent?.id === s.id && (
                    <ChevronRight size={14} style={{ color: "var(--amber)" }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Report preview */}
        <div>
          {!selectedStudent ? (
            <div className="card p-12 text-center space-y-3">
              <User
                size={40}
                className="mx-auto"
                style={{ color: "var(--border-md)" }}
              />
              <div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-mid)" }}
                >
                  Select a student
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Choose a student from the list to preview their report
                </p>
              </div>
            </div>
          ) : reportLoading ? (
            <div className="card p-12 flex items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin"
                style={{ color: "var(--amber)" }}
              />
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="card p-5 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0"
                  style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                >
                  {reportData.student?.name?.[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">
                    {reportData.student?.name}
                  </h2>
                  <div
                    className="text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {reportData.student?.email}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {reportData.period}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl font-bold font-display"
                    style={{ color: "var(--amber)" }}
                  >
                    {reportData.student?.rating}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Rating
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Games Played"
                  value={reportData.stats?.gamesPlayed}
                  sub={`${reportData.stats?.wins}W / ${reportData.stats?.losses}L`}
                  color="var(--amber)"
                />
                <StatCard
                  label="Win Rate"
                  value={`${reportData.stats?.winRate}%`}
                  sub={`${reportData.stats?.gamesPlayed} games`}
                  color="#15803D"
                />
                <StatCard
                  label="Puzzle Accuracy"
                  value={`${reportData.puzzleStats?.accuracy}%`}
                  sub={`${reportData.puzzleStats?.solved} / ${reportData.puzzleStats?.attempted} solved`}
                  color="#1D4ED8"
                />
                <StatCard
                  label="Attendance"
                  value={`${reportData.attendanceSummary?.rate}%`}
                  sub={`${reportData.attendanceSummary?.present} / ${reportData.attendanceSummary?.total} classes`}
                  color={
                    reportData.attendanceSummary?.rate >= 75
                      ? "#15803D"
                      : "#DC2626"
                  }
                />
              </div>

              {/* Rating history mini-chart */}
              {reportData.ratingHistory?.length > 1 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={14} style={{ color: "var(--amber)" }} />
                    Rating Trend
                  </h3>
                  <div className="flex items-end gap-1 h-20">
                    {reportData.ratingHistory.map((r: any, i: number) => {
                      const all = reportData.ratingHistory.map(
                        (x: any) => x.rating,
                      );
                      const min = Math.min(...all),
                        max = Math.max(...all);
                      const range = max - min || 1;
                      const pct = ((r.rating - min) / range) * 80 + 20;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1 group relative"
                        >
                          <div
                            className="w-full rounded-t-sm transition-all"
                            title={String(r.rating)}
                            style={{
                              height: `${pct}%`,
                              background: "var(--amber)",
                              opacity: 0.7,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className="flex justify-between text-xs mt-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>{reportData.ratingHistory[0]?.rating}</span>
                    <span>
                      {
                        reportData.ratingHistory[
                          reportData.ratingHistory.length - 1
                        ]?.rating
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Recent games */}
              {reportData.recentGames?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Trophy size={14} style={{ color: "var(--amber)" }} />
                    Recent Games
                  </h3>
                  <div className="space-y-2">
                    {reportData.recentGames.slice(0, 5).map((g: any) => {
                      const isWhite =
                        g.white_player_id === reportData.student?.id;
                      const isWin =
                        (g.result?.winner === "white" && isWhite) ||
                        (g.result?.winner === "black" && !isWhite);
                      const isLoss =
                        (g.result?.winner === "white" && !isWhite) ||
                        (g.result?.winner === "black" && isWhite);
                      const delta = isWhite
                        ? g.white_rating_change
                        : g.black_rating_change;
                      return (
                        <div
                          key={g.id}
                          className="flex items-center gap-3 p-2 rounded-xl"
                          style={{ background: "var(--bg-subtle)" }}
                        >
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {isWhite ? "⬜" : "⬛"}
                          </span>
                          <span className="text-sm flex-1">
                            vs {isWhite ? g.black_name : g.white_name}
                          </span>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: isWin
                                ? "#DCFCE7"
                                : isLoss
                                  ? "#FEE2E2"
                                  : "rgba(200,150,30,0.12)",
                              color: isWin
                                ? "#15803D"
                                : isLoss
                                  ? "#DC2626"
                                  : "#9A6E00",
                            }}
                          >
                            {isWin ? "Win" : isLoss ? "Loss" : "Draw"}
                          </span>
                          {delta != null && (
                            <span
                              className="text-xs font-mono font-bold"
                              style={{
                                color: delta >= 0 ? "#15803D" : "#DC2626",
                              }}
                            >
                              {delta >= 0 ? "+" : ""}
                              {delta}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Download CTA */}
              <button
                onClick={downloadReport}
                disabled={downloading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {downloading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Download Full PDF Report
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
