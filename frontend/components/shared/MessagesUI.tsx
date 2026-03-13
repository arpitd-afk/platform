"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  useConversations,
  useMessages,
  useContacts,
  useSendMessage,
  useDeleteMessage,
  useMessageSocket,
  useBatchMessages,
  useSendBatchMessage,
  useDeleteBatchMessage,
} from "@/lib/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getSocketInstance } from "@/lib/hooks/useSocket";
import {
  Send,
  Search,
  MessageSquare,
  Loader2,
  Hash,
  Trash2,
  Check,
  CheckCheck,
  Circle,
  ChevronLeft,
  Phone,
  Info,
  Smile,
  X,
  MoreVertical,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  coach: "#15803D",
  student: "#1D4ED8",
  academy_admin: "#9A6E00",
  parent: "#BE185D",
  super_admin: "#7C3AED",
};
const ROLE_BG: Record<string, string> = {
  coach: "#DCFCE7",
  student: "#DBEAFE",
  academy_admin: "rgba(200,150,30,0.12)",
  parent: "rgba(190,24,93,0.1)",
  super_admin: "#EDE9FE",
};
const QUICK_EMOJIS = ["👍", "❤️", "😊", "😂", "🎉", "♟️", "🏆", "👏"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMsgTime(ts: string) {
  const d = new Date(ts);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
  return format(d, "MMM d, h:mm a");
}

function formatConvoTime(ts: string) {
  const d = new Date(ts);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function dateSeparatorLabel(ts: string) {
  const d = new Date(ts);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function shouldShowSeparator(prev: any, curr: any) {
  if (!prev) return true;
  const p = new Date(prev.created_at),
    c = new Date(curr.created_at);
  return p.toDateString() !== c.toDateString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0"
      style={{
        background: "var(--amber)",
        minWidth: 18,
        height: 18,
        padding: "0 4px",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function OnlineDot({ online }: { online?: boolean }) {
  return (
    <span
      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
      style={{ background: online ? "#22C55E" : "#D1D5DB" }}
    />
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex gap-2 items-end">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
      >
        {name?.[0]}
      </div>
      <div
        className="px-4 py-3 rounded-2xl"
        style={{
          background: "var(--bg-subtle)",
          borderRadius: "4px 16px 16px 16px",
        }}
      >
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                background: "var(--text-muted)",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MessagesUI() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [text, setText] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [tab, setTab] = useState<"dm" | "groups">("dm");
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [msgReactions, setMsgReactions] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  const { data: conversations = [], isLoading: convLoading } =
    useConversations();
  const { data: contacts = [] } = useContacts();
  const { data: messages = [], isLoading: msgLoading } = useMessages(
    selectedContact?.isBatch ? undefined : selectedContact?.id,
  );
  const send = useSendMessage();
  const deleteMsg = useDeleteMessage();

  // Wire socket for real-time
  useMessageSocket(user?.id, selectedContact?.id);

  const { data: batches = [] } = useQuery({
    queryKey: ["my-batches-chat"],
    queryFn: () => api.get("/batches").then((r) => r.data.batches || []),
    staleTime: 60000,
  });

  const activeBatchId = selectedContact?.isBatch
    ? selectedContact.id
    : undefined;
  const { data: batchMessages = [], isLoading: batchMsgLoading } =
    useBatchMessages(activeBatchId);
  const sendBatch = useSendBatchMessage();
  const deleteBatchMsg = useDeleteBatchMessage();
  const [batchText, setBatchText] = useState("");

  // Socket: typing indicator + online status
  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket || !user?.id) return;

    const onTyping = ({ fromUserId, isTyping }: any) => {
      setTypingMap((prev) => ({ ...prev, [fromUserId]: isTyping }));
      if (isTyping) {
        setTimeout(
          () => setTypingMap((prev) => ({ ...prev, [fromUserId]: false })),
          3000,
        );
      }
    };
    const onOnline = ({ userId }: any) =>
      setOnlineUsers((prev) => new Set([...Array.from(prev), userId]));
    const onOffline = ({ userId }: any) =>
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });

    const onBatchMsg = (msg: any) => {
      qc.setQueryData(["batch-messages", msg.batch_id], (old: any[]) =>
        old ? [...old.filter((m: any) => m.id !== msg.id), msg] : [msg],
      );
    };
    const onBatchDeleted = ({
      id,
      batch_id,
    }: {
      id: string;
      batch_id?: string;
    }) => {
      const bid = batch_id || activeBatchId;
      if (bid)
        qc.setQueryData(["batch-messages", bid], (old: any[]) =>
          Array.isArray(old) ? old.filter((m: any) => m.id !== id) : old,
        );
    };

    socket.on("dm:typing", onTyping);
    socket.on("user:online", onOnline);
    socket.on("user:offline", onOffline);
    socket.on("batch:message", onBatchMsg);
    socket.on("batch:message_deleted", onBatchDeleted);
    return () => {
      socket.off("dm:typing", onTyping);
      socket.off("user:online", onOnline);
      socket.off("user:offline", onOffline);
      socket.off("batch:message", onBatchMsg);
      socket.off("batch:message_deleted", onBatchDeleted);
    };
  }, [user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, [messages.length, typingMap[selectedContact?.id]]);

  useEffect(() => {
    const socket = getSocketInstance();
    if (selectedContact?.isBatch) {
      socket?.emit("batch:join", { batchId: selectedContact.id });
      return () => {
        socket?.emit("batch:leave", { batchId: selectedContact.id });
      };
    } else if (selectedContact) {
      inputRef.current?.focus();
      api.put(`/messages/${selectedContact.id}/read`).catch(() => {});
    }
  }, [selectedContact?.id]);

  // Mobile detection
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowSidebar(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedContact) return;
    const content = text;
    setText("");
    // Stop typing indicator
    const socket = getSocketInstance();
    if (socket)
      socket.emit("dm:typing", {
        toUserId: selectedContact.id,
        isTyping: false,
      });
    await send.mutateAsync({ receiverId: selectedContact.id, content });
  };

  const handleTyping = (val: string) => {
    setText(val);
    const socket = getSocketInstance();
    if (!socket || !selectedContact?.id) return;
    socket.emit("dm:typing", { toUserId: selectedContact.id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("dm:typing", {
        toUserId: selectedContact.id,
        isTyping: false,
      });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const selectUser = (u: any) => {
    setSelectedContact(u);
    setShowContacts(false);
    setMsgSearch("");
    if (isMobile) setShowSidebar(false);
  };

  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredConvos = conversations.filter((c: any) =>
    (c.other_name || "").toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMessages = msgSearch
    ? messages.filter((m: any) =>
        m.content.toLowerCase().includes(msgSearch.toLowerCase()),
      )
    : messages;

  const isTyping = selectedContact && typingMap[selectedContact.id];
  const isOnline = selectedContact && onlineUsers.has(selectedContact.id);

  // Group messages by date
  const messageGroups: { separator?: string; msg: any }[] =
    filteredMessages.flatMap((msg: any, i: number) => {
      const items: any[] = [];
      if (shouldShowSeparator(filteredMessages[i - 1], msg)) {
        items.push({ separator: dateSeparatorLabel(msg.created_at) });
      }
      items.push({ msg });
      return items;
    });

  return (
    <div className="flex h-[calc(100vh-8rem)] card overflow-hidden">
      {/* ─── Sidebar ───────────────────────────────────────────────────────── */}
      {(showSidebar || !isMobile) && (
        <div
          className="flex flex-col border-r border-[var(--border)]"
          style={{ width: isMobile ? "100%" : "280px", flexShrink: 0 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm flex-1">Messages</h2>
              <button
                onClick={() => {
                  setShowContacts(!showContacts);
                  setTab("dm");
                }}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                + New
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ background: "var(--bg-subtle)" }}
            >
              {[
                { id: "dm", label: "Direct", icon: MessageSquare },
                { id: "groups", label: "Batch", icon: Hash },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id as any);
                    setShowContacts(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-all"
                  style={{
                    background: tab === t.id ? "white" : "transparent",
                    color: tab === t.id ? "var(--text)" : "var(--text-muted)",
                    boxShadow:
                      tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <t.icon size={11} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="input pl-8 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {tab === "groups" ? (
              batches.length === 0 ? (
                <div
                  className="p-8 text-center text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No batches
                </div>
              ) : (
                batches
                  .filter((b: any) =>
                    b.name?.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() =>
                        selectUser({
                          id: b.id,
                          name: b.name,
                          role: "batch",
                          isBatch: true,
                        })
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-[var(--border)]"
                      style={{
                        background:
                          selectedContact?.id === b.id
                            ? "var(--bg-subtle)"
                            : "transparent",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: "rgba(200,150,30,0.12)",
                          color: "var(--amber)",
                        }}
                      >
                        <Hash size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {b.name}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {b.student_count || 0} students
                        </div>
                      </div>
                    </button>
                  ))
              )
            ) : showContacts ? (
              <div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    New Chat
                  </span>
                  <button
                    onClick={() => setShowContacts(false)}
                    className="btn-icon w-6 h-6"
                  >
                    <X size={12} />
                  </button>
                </div>
                {filteredContacts.length === 0 ? (
                  <div
                    className="p-6 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No contacts found
                  </div>
                ) : (
                  filteredContacts.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => selectUser(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left border-b border-[var(--border)]"
                    >
                      <div className="relative shrink-0">
                        <Avatar user={c} size="sm" />
                        <OnlineDot online={onlineUsers.has(c.id)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {c.name}
                        </div>
                        <div
                          className="text-xs capitalize"
                          style={{ color: ROLE_COLOR[c.role] }}
                        >
                          {c.role?.replace("_", " ")}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : convLoading ? (
              <div className="p-8 text-center">
                <Loader2
                  size={18}
                  className="animate-spin mx-auto"
                  style={{ color: "var(--amber)" }}
                />
              </div>
            ) : filteredConvos.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare
                  size={28}
                  className="mx-auto"
                  style={{ color: "var(--border-md)" }}
                />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No conversations yet.
                  <br />
                  Click "+ New" to start one.
                </p>
              </div>
            ) : (
              filteredConvos.map((c: any) => {
                const unread = parseInt(c.unread_count || 0);
                const isActive = selectedContact?.id === c.other_user;
                return (
                  <button
                    key={c.other_user}
                    onClick={() =>
                      selectUser({
                        id: c.other_user,
                        name: c.other_name,
                        role: c.other_role,
                      })
                    }
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-[var(--border)]"
                    style={{
                      background: isActive ? "var(--bg-subtle)" : "transparent",
                    }}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{
                          background:
                            ROLE_BG[c.other_role] || "var(--bg-subtle)",
                          color:
                            ROLE_COLOR[c.other_role] || "var(--text-muted)",
                        }}
                      >
                        {c.other_name?.[0] || "?"}
                      </div>
                      <OnlineDot online={onlineUsers.has(c.other_user)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}
                        >
                          {c.other_name}
                        </span>
                        <span
                          className="text-[10px] shrink-0"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {c.last_at ? formatConvoTime(c.last_at) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span
                          className={`text-xs truncate ${unread ? "font-medium" : ""}`}
                          style={{
                            color: unread
                              ? "var(--text-mid)"
                              : "var(--text-muted)",
                          }}
                        >
                          {c.last_sender_id === user?.id ? "You: " : ""}
                          {c.last_message}
                        </span>
                        <UnreadBadge count={unread} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── Chat Area ─────────────────────────────────────────────────────── */}
      {(!isMobile || !showSidebar) && (
        <div className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]"
                style={{ background: "var(--bg-card)" }}
              >
                {isMobile && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="btn-icon w-8 h-8"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background: selectedContact.isBatch
                        ? "rgba(200,150,30,0.12)"
                        : ROLE_BG[selectedContact.role] || "var(--bg-subtle)",
                      color: selectedContact.isBatch
                        ? "var(--amber)"
                        : ROLE_COLOR[selectedContact.role] ||
                          "var(--text-muted)",
                    }}
                  >
                    {selectedContact.isBatch ? (
                      <Hash size={14} />
                    ) : (
                      selectedContact.name?.[0] || "?"
                    )}
                  </div>
                  {!selectedContact.isBatch && <OnlineDot online={isOnline} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    {selectedContact.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color: selectedContact.isBatch
                        ? "var(--amber)"
                        : isOnline
                          ? "#22C55E"
                          : "var(--text-muted)",
                    }}
                  >
                    {selectedContact.isBatch
                      ? "Batch group"
                      : isTyping
                        ? "typing…"
                        : isOnline
                          ? "Online"
                          : selectedContact.role?.replace("_", " ")}
                  </div>
                </div>
                {/* Message search */}
                <div className="relative hidden sm:block">
                  <Search
                    size={12}
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    placeholder="Search…"
                    className="input pl-7 py-1 text-xs w-36"
                  />
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-5 py-4 space-y-1"
                onClick={() => {
                  setHoveredMsgId(null);
                  setShowEmojiFor(null);
                }}
              >
                {selectedContact.isBatch ? (
                  <div className="flex flex-col h-full">
                    {/* Batch messages list */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                      {batchMsgLoading ? (
                        <div className="flex justify-center pt-8">
                          <Loader2
                            size={20}
                            className="animate-spin"
                            style={{ color: "var(--amber)" }}
                          />
                        </div>
                      ) : batchMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(200,150,30,0.1)" }}
                          >
                            <Hash size={24} style={{ color: "var(--amber)" }} />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-sm">
                              {selectedContact.name}
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "var(--text-muted)" }}
                            >
                              No messages yet. Start the conversation!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {batchMessages.map((m: any, idx: number) => {
                            const isMe = m.sender_id === user?.id;
                            const prev = batchMessages[idx - 1];
                            const showSep = shouldShowSeparator(prev, m);
                            const showName =
                              !prev ||
                              prev.sender_id !== m.sender_id ||
                              showSep;
                            return (
                              <div key={m.id}>
                                {showSep && (
                                  <div className="flex items-center gap-3 my-4">
                                    <div
                                      className="flex-1 h-px"
                                      style={{ background: "var(--border)" }}
                                    />
                                    <span
                                      className="text-[11px] px-3 py-1 rounded-full font-medium"
                                      style={{
                                        background: "var(--bg-subtle)",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      {dateSeparatorLabel(m.created_at)}
                                    </span>
                                    <div
                                      className="flex-1 h-px"
                                      style={{ background: "var(--border)" }}
                                    />
                                  </div>
                                )}
                                <div
                                  className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}
                                  onMouseEnter={() => setHoveredMsgId(m.id)}
                                  onMouseLeave={() => setHoveredMsgId(null)}
                                >
                                  {!isMe && (
                                    <div
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1"
                                      style={{
                                        background:
                                          ROLE_BG[m.sender_role] ||
                                          "var(--bg-subtle)",
                                        color:
                                          ROLE_COLOR[m.sender_role] ||
                                          "var(--text-muted)",
                                      }}
                                    >
                                      {m.sender_name?.[0] || "?"}
                                    </div>
                                  )}
                                  <div
                                    className={`max-w-[70%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
                                  >
                                    {showName && !isMe && (
                                      <span
                                        className="text-[11px] font-semibold px-1"
                                        style={{
                                          color:
                                            ROLE_COLOR[m.sender_role] ||
                                            "var(--text-muted)",
                                        }}
                                      >
                                        {m.sender_name} ·{" "}
                                        <span className="font-normal capitalize">
                                          {m.sender_role?.replace("_", " ")}
                                        </span>
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1">
                                      {hoveredMsgId === m.id && isMe && (
                                        <button
                                          onClick={() =>
                                            deleteBatchMsg.mutate({
                                              batchId: selectedContact.id,
                                              msgId: m.id,
                                            })
                                          }
                                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                                        >
                                          <Trash2
                                            size={12}
                                            style={{ color: "#DC2626" }}
                                          />
                                        </button>
                                      )}
                                      <div
                                        className="px-4 py-2.5 text-sm break-words"
                                        style={{
                                          background: isMe
                                            ? "rgba(200,150,30,0.15)"
                                            : "var(--bg-subtle)",
                                          color: "var(--text)",
                                          borderRadius: isMe
                                            ? "16px 4px 16px 16px"
                                            : "4px 16px 16px 16px",
                                          border: "1px solid var(--border)",
                                        }}
                                      >
                                        {m.content}
                                      </div>
                                    </div>
                                    <span
                                      className="text-[10px] px-1"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {m.created_at
                                        ? formatMsgTime(m.created_at)
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={bottomRef} />
                        </>
                      )}
                    </div>
                    {/* Batch input */}
                    <div
                      className="px-4 py-3 border-t border-[var(--border)]"
                      style={{ background: "var(--bg-card)" }}
                    >
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!batchText.trim()) return;
                          const content = batchText;
                          setBatchText("");
                          await sendBatch.mutateAsync({
                            batchId: selectedContact.id,
                            content,
                          });
                        }}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: "rgba(200,150,30,0.15)",
                            color: "var(--amber)",
                          }}
                        >
                          <Hash size={11} />
                        </div>
                        <input
                          value={batchText}
                          onChange={(e) => setBatchText(e.target.value)}
                          placeholder={`Message ${selectedContact.name}…`}
                          className="input flex-1 text-sm py-2.5"
                          autoComplete="off"
                        />
                        <button
                          type="submit"
                          disabled={!batchText.trim() || sendBatch.isPending}
                          className="btn-primary w-10 h-10 p-0 flex items-center justify-center shrink-0 disabled:opacity-50"
                        >
                          {sendBatch.isPending ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Send size={15} />
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : msgLoading ? (
                  <div className="flex justify-center pt-8">
                    <Loader2
                      size={20}
                      className="animate-spin"
                      style={{ color: "var(--amber)" }}
                    />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      <MessageSquare
                        size={24}
                        style={{ color: "var(--border-md)" }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">No messages yet</p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Say hello to {selectedContact.name}! 👋
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messageGroups.map((item, idx) => {
                      if (item.separator)
                        return (
                          <div
                            key={`sep-${idx}`}
                            className="flex items-center gap-3 my-4"
                          >
                            <div
                              className="flex-1 h-px"
                              style={{ background: "var(--border)" }}
                            />
                            <span
                              className="text-[11px] px-3 py-1 rounded-full font-medium"
                              style={{
                                background: "var(--bg-subtle)",
                                color: "var(--text-muted)",
                              }}
                            >
                              {item.separator}
                            </span>
                            <div
                              className="flex-1 h-px"
                              style={{ background: "var(--border)" }}
                            />
                          </div>
                        );

                      const m = item.msg;
                      const isMe = m.sender_id === user?.id;
                      const reaction = msgReactions[m.id];
                      const showActions = hoveredMsgId === m.id;

                      return (
                        <div
                          key={m.id}
                          className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}
                          onMouseEnter={() => setHoveredMsgId(m.id)}
                          onMouseLeave={() => {
                            if (showEmojiFor !== m.id) setHoveredMsgId(null);
                          }}
                        >
                          {!isMe && (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1"
                              style={{
                                background:
                                  ROLE_BG[m.sender_role] || "var(--bg-subtle)",
                                color:
                                  ROLE_COLOR[m.sender_role] ||
                                  "var(--text-muted)",
                              }}
                            >
                              {m.sender_name?.[0] || "?"}
                            </div>
                          )}

                          <div
                            className={`max-w-[70%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
                          >
                            {/* Action buttons on hover */}
                            {showActions && (
                              <div
                                className={`flex items-center gap-1 mb-1 ${isMe ? "flex-row-reverse" : ""}`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEmojiFor(
                                      showEmojiFor === m.id ? null : m.id,
                                    );
                                  }}
                                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                  <Smile
                                    size={13}
                                    style={{ color: "var(--text-muted)" }}
                                  />
                                </button>
                                {isMe && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMsg.mutate(m.id);
                                    }}
                                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2
                                      size={13}
                                      style={{ color: "#DC2626" }}
                                    />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Emoji picker */}
                            {showEmojiFor === m.id && (
                              <div
                                className={`flex gap-1 p-2 rounded-2xl shadow-md mb-1 ${isMe ? "flex-row-reverse" : ""}`}
                                style={{
                                  background: "white",
                                  border: "1px solid var(--border)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {QUICK_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setMsgReactions((prev) => ({
                                        ...prev,
                                        [m.id]:
                                          prev[m.id] === emoji ? "" : emoji,
                                      }));
                                      setShowEmojiFor(null);
                                    }}
                                    className="text-base hover:scale-125 transition-transform w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-subtle)]"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Bubble */}
                            <div className="relative">
                              <div
                                className="px-4 py-2.5 text-sm break-words"
                                style={{
                                  background: isMe
                                    ? "rgba(200,150,30,0.15)"
                                    : "var(--bg-subtle)",
                                  color: "var(--text)",
                                  borderRadius: isMe
                                    ? "16px 4px 16px 16px"
                                    : "4px 16px 16px 16px",
                                  border: "1px solid var(--border)",
                                  minWidth: "60px",
                                }}
                              >
                                {m.content}
                              </div>
                              {/* Reaction badge */}
                              {reaction && (
                                <span
                                  className="absolute -bottom-2 right-1 text-sm bg-white rounded-full px-1.5 py-0.5 shadow-sm"
                                  style={{
                                    border: "1px solid var(--border)",
                                    fontSize: "13px",
                                    lineHeight: 1,
                                  }}
                                >
                                  {reaction}
                                </span>
                              )}
                            </div>

                            {/* Time + read receipt */}
                            <div
                              className={`flex items-center gap-1 px-1 ${isMe ? "flex-row-reverse" : ""}`}
                            >
                              <span
                                className="text-[10px]"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {m.created_at
                                  ? formatMsgTime(m.created_at)
                                  : ""}
                              </span>
                              {isMe &&
                                (m.is_read ? (
                                  <CheckCheck
                                    size={11}
                                    style={{ color: "var(--amber)" }}
                                  />
                                ) : (
                                  <Check
                                    size={11}
                                    style={{ color: "var(--text-muted)" }}
                                  />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <TypingIndicator name={selectedContact.name} />
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input */}
              {!selectedContact.isBatch && (
                <div
                  className="px-4 py-3 border-t border-[var(--border)]"
                  style={{ background: "var(--bg-card)" }}
                >
                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={inputRef}
                      value={text}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${selectedContact.name}…`}
                      className="input flex-1 text-sm py-2.5"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || send.isPending}
                      className="btn-primary w-10 h-10 p-0 flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      {send.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--bg-subtle)" }}
              >
                <MessageSquare
                  size={28}
                  style={{ color: "var(--border-md)" }}
                />
              </div>
              <div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-mid)" }}
                >
                  Your Messages
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Select a conversation or start a new one
                </p>
              </div>
              <button
                onClick={() => setShowContacts(true)}
                className="btn-primary text-sm"
              >
                Start Conversation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
