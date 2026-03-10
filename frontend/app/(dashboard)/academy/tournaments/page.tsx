"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useTournaments,
  useCreateTournament,
  useCancelTournament,
} from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import Link from "next/link";
import {
  Trophy,
  Plus,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  Play,
  CheckCircle2,
  Crown,
  Loader2,
  X,
  Circle,
} from "lucide-react";

const FORMATS = ["swiss", "round_robin", "arena", "knockout"];

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    upcoming: {
      label: "Upcoming",
      bg: "var(--bg-subtle)",
      color: "var(--text-muted)",
    },
    registration: {
      label: "Registration",
      bg: "rgba(29,78,216,0.10)",
      color: "#1D4ED8",
    },
    live: { label: "Live", bg: "#FEE2E2", color: "#DC2626" },
    completed: { label: "Completed", bg: "#DCFCE7", color: "#15803D" },
    cancelled: {
      label: "Cancelled",
      bg: "var(--bg-subtle)",
      color: "var(--text-muted)",
    },
  };

export default function AcademyTournamentsPage() {
  const { user } = useAuth();
  const { data: tournaments = [], isLoading } = useTournaments();
  const create = useCreateTournament();
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    name: "",
    format: "swiss",
    timeControl: "10+5",
    rounds: 5,
    maxPlayers: 32,
    startsAt: "",
    description: "",
    entryFee: 0,
    prizePool: 0,
  });

  if (isLoading) return <PageLoading />;

  const filtered =
    filterStatus === "all"
      ? tournaments
      : tournaments.filter((t: any) => t.status === filterStatus);
  const statusCounts = {
    live: 0,
    registration: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const t of tournaments as any[])
    if (statusCounts[t.status as keyof typeof statusCounts] !== undefined)
      statusCounts[t.status as keyof typeof statusCounts]++;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync(form);
    setShowModal(false);
    setForm({
      name: "",
      format: "swiss",
      timeControl: "10+5",
      rounds: 5,
      maxPlayers: 32,
      startsAt: "",
      description: "",
      entryFee: 0,
      prizePool: 0,
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {showModal && (
        <Modal title="Create Tournament" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Tournament Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="e.g. Academy Open 2025"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  className="input"
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Time Control</label>
                <select
                  value={form.timeControl}
                  onChange={(e) =>
                    setForm({ ...form, timeControl: e.target.value })
                  }
                  className="input"
                >
                  {["3+2", "5+0", "5+3", "10+0", "10+5", "15+10", "30+0"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="label">Rounds</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={form.rounds}
                  onChange={(e) =>
                    setForm({ ...form, rounds: parseInt(e.target.value) })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Max Players</label>
                <input
                  type="number"
                  min={4}
                  max={256}
                  value={form.maxPlayers}
                  onChange={(e) =>
                    setForm({ ...form, maxPlayers: parseInt(e.target.value) })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Entry Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.entryFee}
                  onChange={(e) =>
                    setForm({ ...form, entryFee: parseFloat(e.target.value) })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Prize Pool (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.prizePool}
                  onChange={(e) =>
                    setForm({ ...form, prizePool: parseFloat(e.target.value) })
                  }
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Start Date & Time</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="input resize-none h-16"
                placeholder="Rules, eligibility, prizes..."
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {create.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trophy size={14} />
                )}
                Create Tournament
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <Trophy size={22} style={{ color: "var(--amber)" }} />
          Tournaments
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Create Tournament
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Live",
            value: statusCounts.live,
            color: "#DC2626",
            bg: "#FEE2E2",
          },
          {
            label: "Registration",
            value: statusCounts.registration,
            color: "#1D4ED8",
            bg: "rgba(29,78,216,0.08)",
          },
          {
            label: "Upcoming",
            value: statusCounts.upcoming,
            color: "#9A6E00",
            bg: "rgba(200,150,30,0.08)",
          },
          {
            label: "Completed",
            value: statusCounts.completed,
            color: "#15803D",
            bg: "#DCFCE7",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card cursor-pointer"
            onClick={() => setFilterStatus(s.label.toLowerCase())}
            style={
              filterStatus === s.label.toLowerCase()
                ? { borderColor: s.color }
                : {}
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
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          "all",
          "registration",
          "live",
          "upcoming",
          "completed",
          "cancelled",
        ].map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className="px-3 py-1 rounded-full text-xs font-medium capitalize border transition-all"
            style={
              filterStatus === f
                ? {
                    background: "var(--amber)",
                    color: "white",
                    borderColor: "var(--amber)",
                  }
                : {
                    background: "var(--bg-subtle)",
                    color: "var(--text-muted)",
                    borderColor: "var(--border)",
                  }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tournament list */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No tournaments"
            subtitle={
              filterStatus === "all"
                ? "Create your first tournament"
                : `No ${filterStatus} tournaments`
            }
            action={
              filterStatus === "all" ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  Create Tournament
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((t: any) => {
            const cfg = STATUS_CFG[t.status] || STATUS_CFG.upcoming;
            return (
              <div key={t.id} className="card p-5 flex flex-col gap-4">
                {/* Status + format */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
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

                {/* Name */}
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

                {/* Info row */}
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
                  <span className="flex items-center gap-1">
                    <Circle size={11} />R{t.current_round || 0}/{t.rounds}
                  </span>
                  {t.starts_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(t.starts_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>

                {/* Round progress bar */}
                {t.status === "live" && t.rounds > 0 && (
                  <div>
                    <div
                      className="flex justify-between text-[10px] mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>
                        Round {t.current_round}/{t.rounds}
                      </span>
                      <span>
                        {Math.round((t.current_round / t.rounds) * 100)}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(t.current_round / t.rounds) * 100}%`,
                          background: "var(--amber)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action button */}
                <Link
                  href={`/tournament/${t.id}`}
                  className="flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-all btn-secondary"
                >
                  {t.status === "live" ? (
                    <>
                      <Play size={13} />
                      Manage Live
                    </>
                  ) : t.status === "completed" ? (
                    <>
                      <CheckCircle2 size={13} />
                      View Results
                    </>
                  ) : (
                    <>
                      <ChevronRight size={13} />
                      Manage
                    </>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
