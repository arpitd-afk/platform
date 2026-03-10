"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useGames } from "@/lib/hooks";
import { gamesAPI } from "@/lib/api";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Avatar from "@/components/shared/Avatar";
import {
  Trophy,
  Swords,
  TrendingUp,
  Download,
  Eye,
  Loader2,
  X,
  Copy,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// ─── PGN builder (client-side fallback if server doesn't have pgn field) ──────
function buildPgnHeader(game: any, user: any) {
  const isWhite = game.white_player_id === user?.id;
  const myName = user?.name || "?";
  const opponentName = isWhite
    ? game.black_name || "?"
    : game.white_name || "?";
  const result =
    game.result?.winner === "white"
      ? "1-0"
      : game.result?.winner === "black"
        ? "0-1"
        : game.status === "completed"
          ? "1/2-1/2"
          : "*";

  const date = new Date(game.created_at || Date.now())
    .toISOString()
    .split("T")[0]
    .replace(/-/g, ".");
  const white = isWhite ? myName : opponentName;
  const black = isWhite ? opponentName : myName;

  return [
    `[Event "Chess Academy Game"]`,
    `[Site "Chess Academy Pro"]`,
    `[Date "${date}"]`,
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${result}"]`,
    `[TimeControl "${game.time_control || "?"}"]`,
    game.opening_name ? `[Opening "${game.opening_name}"]` : null,
    game.white_rating_before
      ? `[WhiteElo "${isWhite ? game.white_rating_before : game.black_rating_before}"]`
      : null,
    game.black_rating_before
      ? `[BlackElo "${isWhite ? game.black_rating_before : game.white_rating_before}"]`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── PGN modal ────────────────────────────────────────────────
function PgnModal({
  game,
  user,
  onClose,
}: {
  game: any;
  user: any;
  onClose: () => void;
}) {
  const [pgn, setPgn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAndShow = async () => {
    if (pgn) return;
    setLoading(true);
    try {
      const res = await gamesAPI.get(game.id);
      const gameFull = res.data.game;
      const header = buildPgnHeader(game, user);
      const moves = gameFull.pgn || "";
      const fullPgn = `${header}\n\n${moves}`.trim();
      setPgn(fullPgn);
    } catch {
      const header = buildPgnHeader(game, user);
      setPgn(`${header}\n\n*`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useState(() => {
    fetchAndShow();
  });

  const downloadPgn = () => {
    if (!pgn) return;
    const isWhite = game.white_player_id === user?.id;
    const opponent = isWhite
      ? game.black_name || "opponent"
      : game.white_name || "opponent";
    const date = new Date(game.created_at || Date.now())
      .toISOString()
      .split("T")[0];
    const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${date}_vs_${opponent.replace(/\s+/g, "_")}.pgn`;
    a.click();
    toast.success("PGN downloaded!");
  };

  const copyPgn = async () => {
    if (!pgn) return;
    await navigator.clipboard.writeText(pgn);
    setCopied(true);
    toast.success("PGN copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="card p-0 overflow-hidden w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-subtle)",
          }}
        >
          <h3
            className="font-semibold text-sm"
            style={{ color: "var(--text)" }}
          >
            Export PGN
          </h3>
          <button onClick={onClose} className="btn-icon w-7 h-7">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Game summary */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--bg-subtle)" }}
          >
            <div className="text-center">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                ⬜ White
              </div>
              <div
                className="font-semibold text-sm"
                style={{ color: "var(--text)" }}
              >
                {game.white_player_id === user?.id
                  ? user?.name
                  : game.white_name || "?"}
              </div>
            </div>
            <div
              className="flex-1 text-center font-bold text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              vs
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                ⬛ Black
              </div>
              <div
                className="font-semibold text-sm"
                style={{ color: "var(--text)" }}
              >
                {game.black_player_id === user?.id
                  ? user?.name
                  : game.black_name || "?"}
              </div>
            </div>
          </div>

          {/* PGN text */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                size={22}
                className="animate-spin"
                style={{ color: "var(--amber)" }}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  PGN DATA
                </label>
                <button
                  onClick={copyPgn}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: copied ? "#15803D" : "var(--amber)" }}
                >
                  {copied ? (
                    <>
                      <CheckCheck size={11} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre
                className="p-3 rounded-xl text-[11px] overflow-auto max-h-56 leading-relaxed select-all"
                style={{
                  background: "#1e1e1e",
                  color: "#d4d4d4",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                {pgn}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              Close
            </button>
            <button
              onClick={copyPgn}
              disabled={!pgn}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy PGN"}
            </button>
            <button
              onClick={downloadPgn}
              disabled={!pgn}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Download .pgn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function StudentGamesPage() {
  const { user } = useAuth();
  const { data: games = [], isLoading } = useGames({ playerId: user?.id });
  const [pgnTarget, setPgnTarget] = useState<any>(null);
  const [filterResult, setFilterResult] = useState("all");

  if (isLoading) return <PageLoading />;

  const wins = games.filter(
    (g: any) =>
      (g.result?.winner === "white" && g.white_player_id === user?.id) ||
      (g.result?.winner === "black" && g.black_player_id === user?.id),
  ).length;
  const losses = games.filter(
    (g: any) =>
      (g.result?.winner === "white" && g.black_player_id === user?.id) ||
      (g.result?.winner === "black" && g.white_player_id === user?.id),
  ).length;
  const draws = games.filter(
    (g: any) => g.status === "completed" && !g.result?.winner,
  ).length;

  const filtered =
    filterResult === "all"
      ? games
      : games.filter((g: any) => {
          const isWin =
            (g.result?.winner === "white" && g.white_player_id === user?.id) ||
            (g.result?.winner === "black" && g.black_player_id === user?.id);
          const isLoss =
            (g.result?.winner === "white" && g.black_player_id === user?.id) ||
            (g.result?.winner === "black" && g.white_player_id === user?.id);
          const isDraw = g.status === "completed" && !g.result?.winner;
          if (filterResult === "win") return isWin;
          if (filterResult === "loss") return isLoss;
          if (filterResult === "draw") return isDraw;
          return true;
        });

  return (
    <div className="space-y-5 animate-fade-in">
      {pgnTarget && (
        <PgnModal
          game={pgnTarget}
          user={user}
          onClose={() => setPgnTarget(null)}
        />
      )}

      <h1 className="page-title flex items-center gap-2">
        <Trophy size={22} style={{ color: "var(--amber)" }} />
        Game History
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: games.length, color: "var(--text)" },
          { label: "Wins", value: wins, color: "#15803D" },
          { label: "Draws", value: draws, color: "#9A6E00" },
          { label: "Losses", value: losses, color: "#DC2626" },
        ].map((s) => (
          <div key={s.label} className="stat-card items-center text-center">
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
      <div className="flex gap-1.5">
        {[
          { key: "all", label: "All" },
          { key: "win", label: "Wins" },
          { key: "draw", label: "Draws" },
          { key: "loss", label: "Losses" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterResult(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={
              filterResult === f.key
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
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No games yet"
            subtitle="Play your first game to see history here"
            action={
              <Link
                href="/game"
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Swords size={14} />
                Play Now
              </Link>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Opponent</th>
                <th className="th text-center">Result</th>
                <th className="th text-center hidden sm:table-cell">Opening</th>
                <th className="th text-center hidden sm:table-cell">
                  Rating Δ
                </th>
                <th className="th text-center">Date</th>
                <th className="th text-center">Export</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g: any) => {
                const isWhite = g.white_player_id === user?.id;
                const isWin =
                  (g.result?.winner === "white" && isWhite) ||
                  (g.result?.winner === "black" && !isWhite);
                const isLoss =
                  (g.result?.winner === "white" && !isWhite) ||
                  (g.result?.winner === "black" && isWhite);
                const isDraw = g.status === "completed" && !g.result?.winner;
                const opponent = {
                  name: isWhite ? g.black_name : g.white_name,
                };
                const ratingDelta = isWhite
                  ? g.white_rating_change
                  : g.black_rating_change;
                return (
                  <tr key={g.id} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <Avatar
                          user={{ name: opponent.name, role: "student" }}
                          size="xs"
                        />
                        <div>
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text)" }}
                          >
                            {opponent.name || "Unknown"}
                          </span>
                          <div
                            className="text-[10px] flex items-center gap-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {isWhite ? "⬜ White" : "⬛ Black"}
                            {g.time_control && <span>· {g.time_control}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="td text-center">
                      <span
                        className="badge text-xs"
                        style={
                          isWin
                            ? { background: "#DCFCE7", color: "#15803D" }
                            : isLoss
                              ? { background: "#FEE2E2", color: "#DC2626" }
                              : {
                                  background: "rgba(200,150,30,0.12)",
                                  color: "#9A6E00",
                                }
                        }
                      >
                        {isWin ? "Win" : isLoss ? "Loss" : "Draw"}
                      </span>
                    </td>
                    <td
                      className="td text-center text-xs hidden sm:table-cell"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {g.opening_name ? (
                        <span title={g.opening_name}>
                          {g.opening_name.length > 20
                            ? g.opening_name.slice(0, 20) + "…"
                            : g.opening_name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="td text-center hidden sm:table-cell">
                      {ratingDelta !== undefined && ratingDelta !== null ? (
                        <span
                          className="text-sm font-mono font-bold"
                          style={{
                            color: ratingDelta >= 0 ? "#15803D" : "#DC2626",
                          }}
                        >
                          {ratingDelta > 0 ? "+" : ""}
                          {ratingDelta}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td
                      className="td text-center text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {g.created_at
                        ? new Date(g.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </td>
                    <td className="td text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPgnTarget(g)}
                          title="Export PGN"
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all"
                          style={{
                            background: "var(--bg-subtle)",
                            color: "var(--text-mid)",
                            borderColor: "var(--border)",
                          }}
                        >
                          <Download size={11} />
                          PGN
                        </button>
                        {g.id && (
                          <Link
                            href={`/game/${g.id}`}
                            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-all"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-muted)",
                              borderColor: "var(--border)",
                            }}
                            title="Review"
                          >
                            <Eye size={11} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
