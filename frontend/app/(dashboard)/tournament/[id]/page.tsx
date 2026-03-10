"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  useTournament,
  useTournamentStandings,
  useTournamentPairings,
  useStartTournament,
  useNextRound,
  useSetMatchResult,
  useRegisterTournament,
  useUnregisterTournament,
  useCancelTournament,
} from "@/lib/hooks";
import { PageLoading } from "@/components/shared/States";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import {
  Trophy,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  Play,
  SkipForward,
  Crown,
  Shield,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Medal,
  Star,
  TrendingUp,
  Hash,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import Link from "next/link";

// ─── Result badge ─────────────────────────────────────────────
function ResultBadge({
  result,
  side,
}: {
  result: string | null;
  side: "white" | "black";
}) {
  if (!result) return <span className="badge badge-gray text-xs">Pending</span>;
  const isWin =
    result === side ||
    result === `forfeit_${side === "white" ? "black" : "white"}`;
  const isDraw = result === "draw";
  if (isWin) return <span className="badge badge-green text-xs">Win</span>;
  if (isDraw) return <span className="badge badge-orange text-xs">Draw</span>;
  return <span className="badge badge-red text-xs">Loss</span>;
}

// ─── Score display ────────────────────────────────────────────
function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null || score === undefined)
    return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const s = parseFloat(String(score));
  const color =
    s === 1
      ? "#15803D"
      : s === 0.5
        ? "#9A6E00"
        : s === 0
          ? "#DC2626"
          : "var(--text)";
  return (
    <span style={{ color, fontWeight: 700, fontFamily: "var(--font-dm-mono)" }}>
      {s === 0.5 ? "½" : s}
    </span>
  );
}

// ─── Result Entry Modal ───────────────────────────────────────
function ResultModal({
  match,
  tournamentId,
  onClose,
}: {
  match: any;
  tournamentId: string;
  onClose: () => void;
}) {
  const setResult = useSetMatchResult();
  const [submitting, setSubmitting] = useState("");

  const handleResult = async (result: string) => {
    setSubmitting(result);
    try {
      await setResult.mutateAsync({ tournamentId, matchId: match.id, result });
      onClose();
    } finally {
      setSubmitting("");
    }
  };

  const opts = [
    {
      key: "white",
      label: match.white_name || "White",
      icon: "⬜",
      desc: "White wins",
      color: "#15803D",
      bg: "#DCFCE7",
    },
    {
      key: "draw",
      label: "Draw",
      icon: "🤝",
      desc: "Both get ½",
      color: "#9A6E00",
      bg: "rgba(200,150,30,0.12)",
    },
    {
      key: "black",
      label: match.black_name || "Black",
      icon: "⬛",
      desc: "Black wins",
      color: "#15803D",
      bg: "#DCFCE7",
    },
  ];
  const forfeits = [
    { key: "forfeit_white", label: "White forfeit", color: "#DC2626" },
    { key: "forfeit_black", label: "Black forfeit", color: "#DC2626" },
  ];

  return (
    <Modal title="Enter Match Result" onClose={onClose}>
      <div className="space-y-4">
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: "var(--bg-subtle)" }}
        >
          <div className="text-center flex-1">
            <Avatar
              user={{ name: match.white_name, role: "student" }}
              size="sm"
              className="mx-auto mb-1"
            />
            <div className="text-sm font-semibold">
              {match.white_name || "TBD"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {match.white_rating || "—"}
            </div>
          </div>
          <div
            className="text-2xl font-bold px-4"
            style={{ color: "var(--text-muted)" }}
          >
            vs
          </div>
          <div className="text-center flex-1">
            <Avatar
              user={{ name: match.black_name, role: "student" }}
              size="sm"
              className="mx-auto mb-1"
            />
            <div className="text-sm font-semibold">
              {match.black_name || "TBD"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {match.black_rating || "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {opts.map((o) => (
            <button
              key={o.key}
              onClick={() => handleResult(o.key)}
              disabled={!!submitting}
              className="p-4 rounded-xl text-center transition-all hover:scale-105 active:scale-95 border-2"
              style={{
                background: submitting === o.key ? o.bg : "var(--bg-subtle)",
                borderColor: submitting === o.key ? o.color : "var(--border)",
              }}
            >
              {submitting === o.key ? (
                <Loader2
                  size={20}
                  className="animate-spin mx-auto mb-1"
                  style={{ color: o.color }}
                />
              ) : (
                <span className="text-xl">{o.icon}</span>
              )}
              <div
                className="font-bold text-xs mt-1"
                style={{ color: o.color }}
              >
                {o.label}
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {o.desc}
              </div>
            </button>
          ))}
        </div>

        <div
          style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            Forfeit (player did not show)
          </p>
          <div className="flex gap-2">
            {forfeits.map((f) => (
              <button
                key={f.key}
                onClick={() => handleResult(f.key)}
                disabled={!!submitting}
                className="flex-1 py-2 rounded-lg text-xs font-medium border transition-all"
                style={{
                  color: f.color,
                  borderColor: "var(--border-md)",
                  background: "var(--bg-subtle)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {match.result && (
          <div
            className="p-3 rounded-xl text-center text-sm"
            style={{ background: "rgba(200,150,30,0.08)" }}
          >
            <span style={{ color: "var(--text-muted)" }}>Current: </span>
            <strong style={{ color: "var(--text)" }}>
              {match.result === "white"
                ? `${match.white_name} wins`
                : match.result === "black"
                  ? `${match.black_name} wins`
                  : match.result === "draw"
                    ? "Draw"
                    : match.result === "forfeit_white"
                      ? `${match.white_name} forfeited`
                      : `${match.black_name} forfeited`}
            </strong>
            <span
              className="ml-2 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              (click to change)
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "pairings" | "standings" | "players"
  >("pairings");
  const [selectedRound, setSelectedRound] = useState<number | undefined>(
    undefined,
  );
  const [resultModal, setResultModal] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const { data, isLoading: tLoading } = useTournament(id);
  const { data: standings = [] } = useTournamentStandings(id);
  const { data: pairingsData } = useTournamentPairings(id, selectedRound);

  const startTournament = useStartTournament();
  const nextRound = useNextRound();
  const register = useRegisterTournament();
  const unregister = useUnregisterTournament();
  const cancelTournament = useCancelTournament();

  if (tLoading || !data) return <PageLoading />;

  const { tournament: t, players = [] } = data;
  const pairings = pairingsData?.pairings || [];
  const byRound = pairingsData?.byRound || {};
  const rounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);
  const currentRound =
    selectedRound ?? (rounds.length > 0 ? Math.max(...rounds) : 1);

  const isAdmin = ["academy_admin", "super_admin", "coach"].includes(
    user?.role || "",
  );
  const isRegistered = players.some((p: any) => p.player_id === user?.id);
  const myStanding = standings.find((s: any) => s.player_id === user?.id);
  const myMatchThisRound = pairings.find(
    (m: any) =>
      m.round === currentRound &&
      (m.white_id === user?.id || m.black_id === user?.id),
  );

  const currentRoundMatches = byRound[currentRound] || [];
  const pendingInRound = currentRoundMatches.filter(
    (m: any) => m.status !== "completed",
  ).length;
  const allDone = currentRoundMatches.length > 0 && pendingInRound === 0;

  const STATUS_CFG: Record<
    string,
    { label: string; bg: string; color: string }
  > = {
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
  const statusCfg = STATUS_CFG[t.status] || STATUS_CFG.upcoming;

  return (
    <div className="space-y-5 animate-fade-in">
      {resultModal && (
        <ResultModal
          match={resultModal}
          tournamentId={id}
          onClose={() => setResultModal(null)}
        />
      )}

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                className="badge text-xs px-3 py-1 font-medium"
                style={{ background: statusCfg.bg, color: statusCfg.color }}
              >
                {t.status === "live" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block mr-1.5" />
                )}
                {statusCfg.label}
              </span>
              <span className="badge badge-gray text-xs capitalize">
                {t.format?.replace("_", " ")}
              </span>
              <span className="badge badge-gray text-xs">{t.time_control}</span>
            </div>
            <h1
              className="font-display text-2xl font-bold"
              style={{ color: "var(--text)" }}
            >
              {t.name}
            </h1>
            {t.description && (
              <p
                className="text-sm mt-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                {t.description}
              </p>
            )}
            <div
              className="flex flex-wrap items-center gap-4 mt-3 text-sm"
              style={{ color: "var(--text-mid)" }}
            >
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {t.registered_count || 0}/{t.max_players} players
              </span>
              {t.rounds > 0 && (
                <span className="flex items-center gap-1.5">
                  <Hash size={14} />
                  {t.current_round}/{t.rounds} rounds
                </span>
              )}
              {t.starts_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {new Date(t.starts_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {t.prize_pool > 0 && (
                <span className="flex items-center gap-1.5">
                  <Trophy size={14} style={{ color: "var(--amber)" }} />₹
                  {t.prize_pool} prize pool
                </span>
              )}
              {t.entry_fee > 0 && <span>₹{t.entry_fee} entry</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Student: register / unregister */}
            {!isAdmin && t.status === "registration" && !isRegistered && (
              <button
                onClick={() => register.mutate(id)}
                disabled={register.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {register.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trophy size={14} />
                )}
                Register
              </button>
            )}
            {!isAdmin && isRegistered && t.status === "registration" && (
              <button
                onClick={() => unregister.mutate(id)}
                disabled={unregister.isPending}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <X size={13} />
                Withdraw
              </button>
            )}

            {/* Admin actions */}
            {isAdmin && t.status === "registration" && (
              <button
                onClick={() => setConfirmAction("start")}
                disabled={startTournament.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <Play size={14} />
                Start Tournament
              </button>
            )}
            {isAdmin &&
              t.status === "live" &&
              allDone &&
              t.current_round < t.rounds && (
                <button
                  onClick={() => setConfirmAction("next")}
                  disabled={nextRound.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  <SkipForward size={14} />
                  Next Round
                </button>
              )}
            {isAdmin &&
              t.status === "live" &&
              allDone &&
              t.current_round >= t.rounds && (
                <button
                  onClick={() => nextRound.mutate(id)}
                  disabled={nextRound.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  Finish Tournament
                </button>
              )}
            {isAdmin && ["registration", "live"].includes(t.status) && (
              <button
                onClick={() => setConfirmAction("cancel")}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* My standing card */}
        {myStanding && t.status !== "registration" && (
          <div
            className="mt-5 p-4 rounded-xl flex items-center gap-5 flex-wrap"
            style={{
              background: "rgba(200,150,30,0.06)",
              border: "1px solid rgba(200,150,30,0.2)",
            }}
          >
            <div className="flex items-center gap-2">
              <Medal size={18} style={{ color: "var(--amber)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text)" }}
              >
                Your Standing
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="text-center">
                <div
                  className="font-display text-xl font-bold"
                  style={{ color: "var(--amber)" }}
                >
                  #{myStanding.rank || "—"}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Rank
                </div>
              </div>
              <div className="text-center">
                <div
                  className="font-display text-xl font-bold"
                  style={{ color: "#1D4ED8" }}
                >
                  {parseFloat(myStanding.score || 0).toFixed(1)}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Score
                </div>
              </div>
              <div className="text-center">
                <div
                  className="font-display text-xl font-bold"
                  style={{ color: "#15803D" }}
                >
                  {myStanding.wins || 0}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Wins
                </div>
              </div>
              <div className="text-center">
                <div
                  className="font-display text-xl font-bold"
                  style={{ color: "#9A6E00" }}
                >
                  {myStanding.draws || 0}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Draws
                </div>
              </div>
              <div className="text-center">
                <div
                  className="font-display text-xl font-bold"
                  style={{ color: "#DC2626" }}
                >
                  {myStanding.losses || 0}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Losses
                </div>
              </div>
            </div>
            {myMatchThisRound && !myMatchThisRound.is_bye && (
              <div
                className="ml-auto text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Round {currentRound}: vs{" "}
                <strong style={{ color: "var(--text)" }}>
                  {myMatchThisRound.white_id === user?.id
                    ? myMatchThisRound.black_name
                    : myMatchThisRound.white_name}
                </strong>{" "}
                as{" "}
                <strong>
                  {myMatchThisRound.white_id === user?.id
                    ? "⬜ White"
                    : "⬛ Black"}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {t.status === "live" && t.rounds > 0 && (
          <div className="mt-4">
            <div
              className="flex items-center justify-between mb-2 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>Tournament Progress</span>
              <span>
                Round {t.current_round} of {t.rounds}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--bg-subtle)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(t.current_round / t.rounds) * 100}%`,
                  background: "var(--amber)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Round pending warning */}
      {isAdmin && t.status === "live" && pendingInRound > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ background: "#FEF9C3", border: "1px solid #FEF08A" }}
        >
          <AlertTriangle size={16} style={{ color: "#B45309" }} />
          <span style={{ color: "#92400E" }}>
            <strong>{pendingInRound}</strong> match
            {pendingInRound > 1 ? "es" : ""} still pending in Round{" "}
            {currentRound}. Enter all results before advancing.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 card p-1 rounded-xl w-fit">
        {(["pairings", "standings", "players"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={
              activeTab === tab
                ? { background: "rgba(200,150,30,0.12)", color: "var(--amber)" }
                : { color: "var(--text-muted)" }
            }
          >
            {tab}
            {tab === "pairings" &&
              t.status === "live" &&
              pendingInRound > 0 && (
                <span className="ml-1.5 w-4 h-4 text-[10px] bg-red-500 text-white rounded-full inline-flex items-center justify-center">
                  {pendingInRound}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* ── PAIRINGS TAB ── */}
      {activeTab === "pairings" && (
        <div className="space-y-4">
          {/* Round selector */}
          {rounds.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {rounds.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRound(r)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={
                    currentRound === r
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
                  Round {r}
                  {r === t.current_round && t.status === "live" && (
                    <span className="ml-1.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse inline-block" />
                  )}
                </button>
              ))}
            </div>
          )}

          {currentRoundMatches.length === 0 ? (
            <div className="card p-10 text-center">
              {t.status === "registration" ? (
                <>
                  <Trophy
                    size={36}
                    className="mx-auto mb-3"
                    style={{ color: "var(--border-md)" }}
                  />
                  <p className="font-medium">Tournament not started yet</p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {isAdmin
                      ? `${players.length} players registered. Click "Start Tournament" when ready.`
                      : `${players.length} players registered. Waiting for admin to start.`}
                  </p>
                </>
              ) : (
                <>
                  <Circle
                    size={36}
                    className="mx-auto mb-3"
                    style={{ color: "var(--border-md)" }}
                  />
                  <p className="font-medium">No pairings for this round</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {currentRoundMatches.map((m: any, idx: number) => {
                const isMyMatch =
                  m.white_id === user?.id || m.black_id === user?.id;
                const isDone = m.status === "completed";

                return (
                  <div
                    key={m.id}
                    className="card p-4 flex items-center gap-3 flex-wrap"
                    style={
                      isMyMatch
                        ? {
                            borderColor: "rgba(200,150,30,0.4)",
                            background: "rgba(200,150,30,0.03)",
                          }
                        : {}
                    }
                  >
                    {/* Board number */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                      style={{
                        background: "var(--bg-subtle)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {idx + 1}
                    </div>

                    {m.is_bye ? (
                      <div className="flex-1 flex items-center gap-3">
                        <Avatar
                          user={{ name: m.white_name, role: "student" }}
                          size="sm"
                        />
                        <div>
                          <span className="font-medium text-sm">
                            {m.white_name}
                          </span>
                          <span className="ml-3 badge badge-gray text-xs">
                            BYE (+1)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* White */}
                        <div
                          className={`flex items-center gap-2 flex-1 min-w-0 ${m.white_id === user?.id ? "font-bold" : ""}`}
                        >
                          <Avatar
                            user={{ name: m.white_name, role: "student" }}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div
                              className="text-sm truncate"
                              style={{
                                color:
                                  m.white_id === user?.id
                                    ? "var(--amber)"
                                    : "var(--text)",
                              }}
                            >
                              {m.white_name || "TBD"}
                            </div>
                            <div
                              className="text-xs flex items-center gap-1"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Star size={9} />
                              {m.white_rating || "—"}
                              <span className="ml-1 opacity-60">⬜</span>
                            </div>
                          </div>
                          {isDone && (
                            <ResultBadge result={m.result} side="white" />
                          )}
                          {isDone && <ScoreDisplay score={m.white_score} />}
                        </div>

                        {/* VS / Score */}
                        <div className="flex flex-col items-center flex-shrink-0 w-14">
                          {isDone ? (
                            <div className="text-center">
                              <div
                                className="text-xs font-mono font-bold"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {parseFloat(m.white_score || 0) === 0.5
                                  ? "½"
                                  : m.white_score || 0}
                                {" - "}
                                {parseFloat(m.black_score || 0) === 0.5
                                  ? "½"
                                  : m.black_score || 0}
                              </div>
                              <CheckCircle2
                                size={12}
                                className="mx-auto mt-0.5"
                                style={{ color: "#15803D" }}
                              />
                            </div>
                          ) : (
                            <span
                              className="text-sm font-bold"
                              style={{ color: "var(--text-muted)" }}
                            >
                              vs
                            </span>
                          )}
                        </div>

                        {/* Black */}
                        <div
                          className={`flex items-center gap-2 flex-1 min-w-0 justify-end text-right ${m.black_id === user?.id ? "font-bold" : ""}`}
                        >
                          {isDone && <ScoreDisplay score={m.black_score} />}
                          {isDone && (
                            <ResultBadge result={m.result} side="black" />
                          )}
                          <div className="min-w-0">
                            <div
                              className="text-sm truncate"
                              style={{
                                color:
                                  m.black_id === user?.id
                                    ? "var(--amber)"
                                    : "var(--text)",
                              }}
                            >
                              {m.black_name || "TBD"}
                            </div>
                            <div
                              className="text-xs flex items-center gap-1 justify-end"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <span className="opacity-60">⬛</span>
                              <Star size={9} />
                              {m.black_rating || "—"}
                            </div>
                          </div>
                          <Avatar
                            user={{ name: m.black_name, role: "student" }}
                            size="sm"
                          />
                        </div>
                      </>
                    )}

                    {/* Admin: Enter result button */}
                    {isAdmin && !m.is_bye && (
                      <button
                        onClick={() => setResultModal(m)}
                        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all"
                        style={{
                          background: isDone
                            ? "var(--bg-subtle)"
                            : "rgba(200,150,30,0.10)",
                          color: isDone ? "var(--text-muted)" : "#9A6E00",
                          borderColor: isDone
                            ? "var(--border)"
                            : "rgba(200,150,30,0.3)",
                        }}
                      >
                        {isDone ? "Edit" : "Enter Result"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STANDINGS TAB ── */}
      {activeTab === "standings" && (
        <div className="card overflow-hidden">
          {standings.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp
                size={36}
                className="mx-auto mb-3"
                style={{ color: "var(--border-md)" }}
              />
              <p style={{ color: "var(--text-muted)" }}>
                Standings will appear once the tournament starts
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th w-12">#</th>
                  <th className="th">Player</th>
                  <th className="th text-center">Score</th>
                  <th className="th text-center hidden sm:table-cell">Wins</th>
                  <th className="th text-center hidden sm:table-cell">Draws</th>
                  <th className="th text-center hidden sm:table-cell">
                    Losses
                  </th>
                  <th className="th text-center hidden md:table-cell">
                    Buchholz
                  </th>
                  <th className="th text-center hidden sm:table-cell">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s: any, i: number) => {
                  const isMe = s.player_id === user?.id;
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <tr
                      key={s.player_id}
                      className="tr"
                      style={
                        isMe ? { background: "rgba(200,150,30,0.05)" } : {}
                      }
                    >
                      <td className="td text-center">
                        {i < 3 && t.status === "completed" ? (
                          <span className="text-lg">{medals[i]}</span>
                        ) : (
                          <span
                            className="font-mono text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {s.rank || i + 1}
                          </span>
                        )}
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar
                            user={{
                              name: s.name,
                              avatar: s.avatar,
                              role: "student",
                            }}
                            size="sm"
                          />
                          <span
                            className="font-medium text-sm"
                            style={{
                              color: isMe ? "var(--amber)" : "var(--text)",
                            }}
                          >
                            {s.name}
                            {isMe && (
                              <span className="ml-2 badge badge-gold text-[10px]">
                                You
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="td text-center">
                        <span
                          className="font-display text-base font-bold"
                          style={{ color: "var(--amber)" }}
                        >
                          {parseFloat(s.score || 0).toFixed(1)}
                        </span>
                      </td>
                      <td
                        className="td text-center hidden sm:table-cell"
                        style={{ color: "#15803D" }}
                      >
                        {s.wins || 0}
                      </td>
                      <td
                        className="td text-center hidden sm:table-cell"
                        style={{ color: "#9A6E00" }}
                      >
                        {s.draws || 0}
                      </td>
                      <td
                        className="td text-center hidden sm:table-cell"
                        style={{ color: "#DC2626" }}
                      >
                        {s.losses || 0}
                      </td>
                      <td
                        className="td text-center hidden md:table-cell text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {parseFloat(s.tiebreak1 || 0).toFixed(1)}
                      </td>
                      <td
                        className="td text-center hidden sm:table-cell text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {s.rating || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── PLAYERS TAB ── */}
      {activeTab === "players" && (
        <div className="card overflow-hidden">
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-subtle)",
            }}
          >
            <h3 className="section-title">
              Registered Players ({players.length})
            </h3>
          </div>
          {players.length === 0 ? (
            <div className="p-12 text-center">
              <Users
                size={36}
                className="mx-auto mb-3"
                style={{ color: "var(--border-md)" }}
              />
              <p style={{ color: "var(--text-muted)" }}>
                No players registered yet
              </p>
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ "--tw-divide-opacity": 1 } as any}
            >
              {players.map((p: any, i: number) => (
                <div
                  key={p.player_id}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <span
                    className="text-sm font-mono w-6 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {i + 1}
                  </span>
                  <Avatar
                    user={{ name: p.name, avatar: p.avatar, role: "student" }}
                    size="sm"
                  />
                  <div className="flex-1">
                    <span
                      className="font-medium text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      {p.name}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: "var(--amber)" }}
                  >
                    <Star size={12} />
                    {p.rating || 1200}
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {new Date(p.registered_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm dialogs */}
      {confirmAction && (
        <Modal
          title={
            confirmAction === "start"
              ? "Start Tournament?"
              : confirmAction === "next"
                ? "Advance to Next Round?"
                : "Cancel Tournament?"
          }
          onClose={() => setConfirmAction(null)}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {confirmAction === "start" &&
                `This will generate Round 1 pairings for all ${players.length} registered players. This cannot be undone.`}
              {confirmAction === "next" &&
                `All ${currentRoundMatches.length} matches in Round ${currentRound} are complete. This will generate pairings for Round ${(t.current_round || 0) + 1}.`}
              {confirmAction === "cancel" &&
                "This will cancel the tournament and notify all players. This cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="btn-secondary flex-1"
              >
                Go Back
              </button>
              <button
                disabled={
                  startTournament.isPending ||
                  nextRound.isPending ||
                  cancelTournament.isPending
                }
                onClick={async () => {
                  if (confirmAction === "start")
                    await startTournament.mutateAsync(id);
                  else if (confirmAction === "next")
                    await nextRound.mutateAsync(id);
                  else if (confirmAction === "cancel")
                    await cancelTournament.mutateAsync(id);
                  setConfirmAction(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 ${confirmAction === "cancel" ? "btn-danger" : "btn-primary"}`}
              >
                {startTournament.isPending ||
                nextRound.isPending ||
                cancelTournament.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {confirmAction === "start"
                  ? "Start Tournament"
                  : confirmAction === "next"
                    ? "Generate Next Round"
                    : "Cancel Tournament"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
