"use client";
import { useState, useEffect } from "react";
import { useAnnouncements } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { getSocket } from "@/lib/hooks/useSocket";
import { Megaphone, Pin, ChevronDown, ChevronUp, X } from "lucide-react";

const TARGET_LABELS: Record<string, string> = {
  student: "Students",
  coach: "Coaches",
  parent: "Parents",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function AnnouncementBanner() {
  const { user } = useAuth();
  const { data: announcements = [], refetch } = useAnnouncements({ limit: 5 });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [liveNew, setLiveNew] = useState<any[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Live socket — real-time new announcements
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    const handler = (ann: any) => {
      // Only show if matches our role
      if (!ann.targetRole || ann.targetRole === user?.role) {
        setLiveNew((prev) => [ann, ...prev]);
        setTimeout(() => refetch(), 500);
      }
    };
    socket.on("announcement:new", handler);
    return () => {
      socket.off("announcement:new", handler);
    };
  }, [token, user?.role, refetch]);

  const visible = [...liveNew, ...announcements]
    .filter((a) => !dismissed.has(a.id))
    // Deduplicate
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i);

  if (visible.length === 0) return null;

  const pinned = visible.filter((a) => a.is_pinned);
  const regular = visible.filter((a) => !a.is_pinned);

  return (
    <div className="space-y-2 mb-4">
      {/* Pinned announcements */}
      {pinned.map((ann) => (
        <div
          key={ann.id}
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(200,150,30,0.08)",
            border: "1px solid rgba(200,150,30,0.3)",
          }}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <Pin
              size={14}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "var(--amber)" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "var(--amber)" }}
                >
                  Pinned
                </span>
                {ann.target_role && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(200,150,30,0.15)",
                      color: "#9A6E00",
                    }}
                  >
                    {TARGET_LABELS[ann.target_role] || ann.target_role}
                  </span>
                )}
              </div>
              <button
                onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
                className="w-full text-left"
              >
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text)" }}
                >
                  {ann.title}
                </p>
                {expanded === ann.id ? (
                  <p
                    className="text-sm mt-1.5 leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text-mid)" }}
                  >
                    {ann.body}
                  </p>
                ) : (
                  <p
                    className="text-sm mt-0.5 line-clamp-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {ann.body}
                  </p>
                )}
              </button>
              <div className="flex items-center justify-between mt-2">
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {ann.author_name} · {timeAgo(ann.created_at)}
                </span>
                <button
                  onClick={() =>
                    setExpanded(expanded === ann.id ? null : ann.id)
                  }
                  className="text-[11px] flex items-center gap-0.5"
                  style={{ color: "var(--amber)" }}
                >
                  {expanded === ann.id ? (
                    <>
                      <ChevronUp size={11} />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={11} />
                      More
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Regular announcements */}
      {regular.slice(0, 3).map((ann, idx) => (
        <div
          key={ann.id}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <Megaphone
              size={14}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#1D4ED8" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {idx === 0 && liveNew.some((l) => l.id === ann.id) && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                  >
                    NEW
                  </span>
                )}
                {ann.target_role && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--bg-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    For {TARGET_LABELS[ann.target_role] || ann.target_role}
                  </span>
                )}
              </div>
              <button
                onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
                className="w-full text-left"
              >
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text)" }}
                >
                  {ann.title}
                </p>
                {expanded === ann.id ? (
                  <p
                    className="text-sm mt-1.5 leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text-mid)" }}
                  >
                    {ann.body}
                  </p>
                ) : (
                  <p
                    className="text-sm mt-0.5 line-clamp-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {ann.body}
                  </p>
                )}
              </button>
              <div className="flex items-center justify-between mt-1.5">
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {ann.author_name} · {timeAgo(ann.created_at)}
                </span>
                <button
                  onClick={() =>
                    setDismissed((prev: any) => new Set([...prev, ann.id]))
                  }
                  className="text-[11px] flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={11} />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
