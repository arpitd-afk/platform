"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { gamesAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";

const GameAnalysis = dynamic(() => import("@/components/shared/GameAnalysis"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-surface-50 rounded-xl border border-dashed border-surface-300">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-amber" size={24} />
        <span className="text-xs text-surface-500 font-medium">Loading Analysis Engine...</span>
      </div>
    </div>
  ),
});
import {
  Brain,
  ChevronLeft,
  Trophy,
  Swords,
  Clock,
  Download,
  Copy,
  CheckCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

function buildPgn(game: any) {
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
  const header = [
    `[Event "Chess Academy Game"]`,
    `[Site "Chess Academy Pro"]`,
    `[Date "${date}"]`,
    `[White "${game.white_name || "White"}"]`,
    `[Black "${game.black_name || "Black"}"]`,
    `[Result "${result}"]`,
    game.time_control ? `[TimeControl "${game.time_control}"]` : null,
    game.opening_name ? `[Opening "${game.opening_name}"]` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return `${header}\n\n${game.pgn || "*"}`;
}

function countMoves(pgn: string) {
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    return g.history().length;
  } catch {
    return 0;
  }
}

export default function GameReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    gamesAPI
      .get(id)
      .then((r) => setGame(r.data.game))
      .catch(() => setError("Game not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--amber)" }}
        />
      </div>
    );

  if (error || !game)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--bg)" }}
      >
        <Swords size={40} style={{ color: "var(--border-md)" }} />
        <p
          className="text-lg font-semibold"
          style={{ color: "var(--text-mid)" }}
        >
          Game not found
        </p>
        <button
          onClick={() => router.back()}
          className="btn-secondary flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Go back
        </button>
      </div>
    );

  const pgn = buildPgn(game);
  const moveCount = countMoves(pgn);
  const isWhite = game.white_player_id === user?.id;
  const isWin =
    (game.result?.winner === "white" && isWhite) ||
    (game.result?.winner === "black" && !isWhite);
  const isLoss =
    (game.result?.winner === "white" && !isWhite) ||
    (game.result?.winner === "black" && isWhite);
  const resultLabel = isWin ? "You won" : isLoss ? "You lost" : "Draw";
  const resultColor = isWin ? "#15803D" : isLoss ? "#DC2626" : "#9A6E00";

  const copyPgn = async () => {
    await navigator.clipboard.writeText(pgn);
    setCopied(true);
    toast.success("PGN copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPgn = () => {
    const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `game_${id?.slice(0, 8)}.pgn`;
    a.click();
  };

  return (
    <div
      className="min-h-screen py-6 px-4 max-w-6xl mx-auto space-y-5"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium btn-secondary px-3 py-2"
        >
          <ChevronLeft size={15} />
          Back
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title flex items-center gap-2 mb-0">
              <Brain size={20} style={{ color: "#F472B6" }} />
              Game Analysis
            </h1>
            <span
              className="badge text-xs px-2 py-1 font-semibold"
              style={{
                background: isWin
                  ? "#DCFCE7"
                  : isLoss
                    ? "#FEE2E2"
                    : "rgba(200,150,30,0.12)",
                color: resultColor,
              }}
            >
              {resultLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyPgn}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2"
          >
            {copied ? (
              <>
                <CheckCheck size={12} />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy PGN
              </>
            )}
          </button>
          <button
            onClick={downloadPgn}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2"
          >
            <Download size={12} />
            Download
          </button>
        </div>
      </div>

      {/* Game info card */}
      <div className="card p-5">
        <div className="flex items-center gap-4 flex-wrap">
          {/* White player */}
          <div className="flex items-center gap-3 flex-1 min-w-40">
            <div
              className="w-10 h-10 rounded-full border-2 border-[var(--border)] flex items-center justify-center font-bold text-sm"
              style={{ background: "#f8f6f2", color: "#1C1107" }}
            >
              {game.white_name?.[0] || "W"}
            </div>
            <div>
              <div className="font-semibold text-sm">
                {game.white_name || "White"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                ⬜ White {game.white_rating ? `· ${game.white_rating}` : ""}
              </div>
            </div>
          </div>

          <div className="text-center px-4">
            <div
              className="text-2xl font-black"
              style={{ color: "var(--text-muted)" }}
            >
              vs
            </div>
            <div
              className="flex items-center gap-2 mt-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {game.time_control && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {game.time_control}
                </span>
              )}
              <span>{moveCount} moves</span>
            </div>
          </div>

          {/* Black player */}
          <div className="flex items-center gap-3 flex-1 min-w-40 justify-end">
            <div className="text-right">
              <div className="font-semibold text-sm">
                {game.black_name || "Black"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                ⬛ Black {game.black_rating ? `· ${game.black_rating}` : ""}
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-full border-2 border-[var(--border)] flex items-center justify-center font-bold text-sm"
              style={{ background: "#2d1f0e", color: "#f7f4ef" }}
            >
              {game.black_name?.[0] || "B"}
            </div>
          </div>
        </div>

        {game.opening_name && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Opening:{" "}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--text-mid)" }}
            >
              {game.opening_name}
            </span>
          </div>
        )}
      </div>

      {/* Analysis */}
      <div className="card p-5">
        <GameAnalysis
          pgn={game.pgn || ""}
          playerNames={{
            white: game.white_name || "White",
            black: game.black_name || "Black",
          }}
        />
      </div>
    </div>
  );
}
