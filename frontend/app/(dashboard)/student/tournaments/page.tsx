"use client";
import { useAuth } from "@/lib/auth-context";
import {
  useTournaments,
  useRegisterTournament,
  useUnregisterTournament,
} from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Link from "next/link";
import {
  Trophy,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Loader2,
  X,
  Crown,
  Circle,
  Play,
} from "lucide-react";

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    upcoming: {
      label: "Upcoming",
      bg: "var(--bg-subtle)",
      color: "var(--text-muted)",
    },
    registration: {
      label: "Open",
      bg: "rgba(29,78,216,0.10)",
      color: "#1D4ED8",
    },
    live: { label: "Live Now", bg: "#FEE2E2", color: "#DC2626" },
    completed: { label: "Completed", bg: "#DCFCE7", color: "#15803D" },
    cancelled: {
      label: "Cancelled",
      bg: "var(--bg-subtle)",
      color: "var(--text-muted)",
    },
  };

export default function StudentTournamentsPage() {
  const { user } = useAuth();
  const { data: tournaments = [], isLoading } = useTournaments();
  const register = useRegisterTournament();
  const unregister = useUnregisterTournament();

  if (isLoading) return <PageLoading />;

  const myTournaments = (tournaments as any[]).filter(
    (t: any) => t.status === "live" || t.status === "registration",
  );
  const past = (tournaments as any[]).filter(
    (t: any) => t.status === "completed",
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Trophy size={22} style={{ color: "var(--amber)" }} />
          Tournaments
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Compete and track your rankings
        </p>
      </div>

      {/* Active & Open */}
      {myTournaments.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Active &amp; Open</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myTournaments.map((t: any) => {
              const cfg = STATUS_CFG[t.status] || STATUS_CFG.upcoming;
              const isRegistered = t.is_registered; // populated if backend sends it, otherwise check players list
              return (
                <div key={t.id} className="card p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <span
                        className="badge text-xs px-2.5 py-1"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {t.status === "live" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block mr-1.5" />
                        )}
                        {cfg.label}
                      </span>
                      <span className="badge badge-gray text-xs capitalize">
                        {t.format?.replace("_", " ")}
                      </span>
                    </div>
                    {t.prize_pool > 0 && (
                      <div
                        className="flex items-center gap-1 text-sm font-semibold"
                        style={{ color: "var(--amber)" }}
                      >
                        <Crown size={13} />₹{t.prize_pool}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3
                      className="font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {t.name}
                    </h3>
                    {t.description && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t.description}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex flex-wrap items-center gap-3 text-xs"
                    style={{ color: "var(--text-mid)" }}
                  >
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {t.registered_count || 0}/{t.max_players}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {t.time_control}
                    </span>
                    {t.rounds > 0 && (
                      <span className="flex items-center gap-1">
                        <Circle size={11} />R{t.current_round || 0}/{t.rounds}
                      </span>
                    )}
                    {t.starts_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(t.starts_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                    {t.entry_fee > 0 && <span>₹{t.entry_fee} entry</span>}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/tournament/${t.id}`}
                      className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
                    >
                      {t.status === "live" ? (
                        <>
                          <Play size={13} />
                          View Pairings
                        </>
                      ) : (
                        <>
                          <ChevronRight size={13} />
                          View Details
                        </>
                      )}
                    </Link>
                    {t.status === "registration" && !isRegistered && (
                      <button
                        onClick={() => register.mutate(t.id)}
                        disabled={register.isPending}
                        className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                      >
                        {register.isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trophy size={13} />
                        )}
                        Register
                      </button>
                    )}
                    {t.status === "registration" && isRegistered && (
                      <button
                        onClick={() => unregister.mutate(t.id)}
                        disabled={unregister.isPending}
                        className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
                        style={{ color: "#DC2626", borderColor: "#FCA5A5" }}
                      >
                        <X size={13} />
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Tournaments */}
      {past.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Past Tournaments</h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Tournament</th>
                  <th className="th text-center hidden sm:table-cell">
                    Format
                  </th>
                  <th className="th text-center hidden sm:table-cell">
                    Players
                  </th>
                  <th className="th text-center">Results</th>
                </tr>
              </thead>
              <tbody>
                {past.map((t: any) => (
                  <tr key={t.id} className="tr">
                    <td className="td">
                      <div
                        className="font-medium text-sm"
                        style={{ color: "var(--text)" }}
                      >
                        {t.name}
                      </div>
                      {t.starts_at && (
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(t.starts_at).toLocaleDateString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td className="td text-center hidden sm:table-cell">
                      <span className="badge badge-gray text-xs capitalize">
                        {t.format?.replace("_", " ")}
                      </span>
                    </td>
                    <td
                      className="td text-center text-sm hidden sm:table-cell"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.registered_count || 0}
                    </td>
                    <td className="td text-center">
                      <Link
                        href={`/tournament/${t.id}`}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                        style={{
                          background: "var(--bg-subtle)",
                          color: "var(--text-mid)",
                        }}
                      >
                        <CheckCircle2 size={11} className="inline mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="card">
          <EmptyState
            title="No tournaments yet"
            subtitle="Check back soon for upcoming tournaments"
          />
        </div>
      )}
    </div>
  );
}
