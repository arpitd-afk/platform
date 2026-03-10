"use client";
import { useState } from "react";
import {
  useAllAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  usePinAnnouncement,
} from "@/lib/hooks";
import { PageLoading, EmptyState } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import {
  Megaphone,
  Plus,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Users,
  Loader2,
  Save,
  Globe,
  Clock,
} from "lucide-react";

// ─── Role audience options ────────────────────────────────────
const AUDIENCES = [
  {
    value: "",
    label: "Everyone",
    icon: Globe,
    desc: "All students, coaches & parents",
  },
  { value: "student", label: "Students", icon: Users, desc: "Students only" },
  { value: "coach", label: "Coaches", icon: Users, desc: "Coaches only" },
  { value: "parent", label: "Parents", icon: Users, desc: "Parents only" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7
    ? `${days}d ago`
    : new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

// ─── Compose modal ────────────────────────────────────────────
function ComposeModal({
  initial,
  onClose,
}: {
  initial?: any;
  onClose: () => void;
}) {
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    title: initial?.title || "",
    body: initial?.body || "",
    targetRole: initial?.target_role || "",
    isPinned: initial?.is_pinned || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, targetRole: form.targetRole || null };
    if (isEdit) {
      await update.mutateAsync({ id: initial.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;
  const selectedAudience =
    AUDIENCES.find((a) => a.value === form.targetRole) || AUDIENCES[0];

  return (
    <Modal
      title={isEdit ? "Edit Announcement" : "Post Announcement"}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        style={{ minWidth: "min(540px, 92vw)" }}
      >
        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="e.g. Holiday schedule update, Tournament reminder..."
            autoFocus
          />
        </div>

        {/* Body */}
        <div>
          <label className="label">Message *</label>
          <textarea
            required
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="input resize-none h-36"
            placeholder="Write your announcement here. Be clear and concise — your audience will see this on their dashboard."
          />
          <div
            className="text-right text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {form.body.length} characters
          </div>
        </div>

        {/* Audience selector */}
        <div>
          <label className="label">Send to</label>
          <div className="grid grid-cols-2 gap-2">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              const selected = form.targetRole === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm({ ...form, targetRole: a.value })}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={
                    selected
                      ? {
                          background: "rgba(29,78,216,0.08)",
                          borderColor: "#1D4ED8",
                          color: "var(--text)",
                        }
                      : {
                          background: "var(--bg-subtle)",
                          borderColor: "var(--border)",
                          color: "var(--text-mid)",
                        }
                  }
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: selected
                        ? "rgba(29,78,216,0.12)"
                        : "var(--bg-hover)",
                    }}
                  >
                    <Icon
                      size={13}
                      style={{
                        color: selected ? "#1D4ED8" : "var(--text-muted)",
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{a.label}</div>
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {a.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pin toggle */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--bg-subtle)" }}
        >
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isPinned: !f.isPinned }))}
            className={`relative w-11 h-6 rounded-full transition-colors`}
            style={{
              background: form.isPinned ? "var(--amber)" : "var(--border-md)",
            }}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isPinned ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
          <div>
            <div
              className="text-sm font-medium flex items-center gap-1.5"
              style={{ color: "var(--text)" }}
            >
              <Pin size={12} style={{ color: "var(--amber)" }} />
              {form.isPinned ? "Pinned to top" : "Not pinned"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Pinned announcements appear at the top of every dashboard
            </div>
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.body) && (
          <div
            className="p-4 rounded-xl"
            style={{
              background: "rgba(200,150,30,0.05)",
              border: "1px dashed rgba(200,150,30,0.4)",
            }}
          >
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              PREVIEW
            </p>
            {form.isPinned && (
              <div
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide mb-1"
                style={{ color: "var(--amber)" }}
              >
                <Pin size={9} />
                Pinned
              </div>
            )}
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text)" }}
            >
              {form.title || "Your title here"}
            </p>
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: "var(--text-muted)" }}
            >
              {form.body || "Your message here..."}
            </p>
            <p
              className="text-[10px] mt-2"
              style={{ color: "var(--text-muted)" }}
            >
              You · just now · To: {selectedAudience.label}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isEdit ? "Save Changes" : "Post Now"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useAllAnnouncements();
  const deleteAnnouncement = useDeleteAnnouncement();
  const pinAnnouncement = usePinAnnouncement();

  const [showCompose, setShowCompose] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <PageLoading />;

  const pinned = announcements.filter((a: any) => a.is_pinned);
  const regular = announcements.filter((a: any) => !a.is_pinned);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Modals */}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
      {editTarget && (
        <ComposeModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete Announcement?"
          onClose={() => setConfirmDelete(null)}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              "<strong>{confirmDelete.title}</strong>" will be permanently
              removed from all dashboards.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteAnnouncement.mutateAsync(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                disabled={deleteAnnouncement.isPending}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {deleteAnnouncement.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Megaphone size={22} style={{ color: "#1D4ED8" }} />
          Announcements
        </h1>
        <button
          onClick={() => setShowCompose(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Post Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div
            className="font-display text-2xl font-bold"
            style={{ color: "#1D4ED8" }}
          >
            {announcements.length}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Total
          </div>
        </div>
        <div className="stat-card">
          <div
            className="font-display text-2xl font-bold"
            style={{ color: "var(--amber)" }}
          >
            {pinned.length}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Pinned
          </div>
        </div>
        <div className="stat-card">
          <div
            className="font-display text-2xl font-bold"
            style={{ color: "#15803D" }}
          >
            {
              announcements.filter((a: any) => {
                const diff = Date.now() - new Date(a.created_at).getTime();
                return diff < 7 * 24 * 60 * 60 * 1000;
              }).length
            }
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            This week
          </div>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No announcements yet"
            subtitle="Post an announcement to let students, coaches, and parents know what's happening"
            action={
              <button
                onClick={() => setShowCompose(true)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={14} />
                Post First Announcement
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pinned section */}
          {pinned.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                style={{ color: "var(--amber)" }}
              >
                <Pin size={11} />
                Pinned
              </p>
              <div className="space-y-2">
                {pinned.map((ann: any) => (
                  <AnnouncementCard
                    key={ann.id}
                    ann={ann}
                    expanded={expandedId === ann.id}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === ann.id ? null : ann.id)
                    }
                    onEdit={() => setEditTarget(ann)}
                    onDelete={() => setConfirmDelete(ann)}
                    onPin={() =>
                      pinAnnouncement.mutate({ id: ann.id, pinned: false })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular section */}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Recent
                </p>
              )}
              <div className="space-y-2">
                {regular.map((ann: any) => (
                  <AnnouncementCard
                    key={ann.id}
                    ann={ann}
                    expanded={expandedId === ann.id}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === ann.id ? null : ann.id)
                    }
                    onEdit={() => setEditTarget(ann)}
                    onDelete={() => setConfirmDelete(ann)}
                    onPin={() =>
                      pinAnnouncement.mutate({ id: ann.id, pinned: true })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Announcement card ────────────────────────────────────────
function AnnouncementCard({
  ann,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onPin,
}: {
  ann: any;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const audienceLabel = ann.target_role
    ? { student: "Students", coach: "Coaches", parent: "Parents" }[
        ann.target_role as string
      ] || ann.target_role
    : "Everyone";

  const reach = ann.reach ? parseInt(ann.reach) : null;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: ann.is_pinned ? "rgba(200,150,30,0.12)" : "#DBEAFE",
          }}
        >
          {ann.is_pinned ? (
            <Pin size={16} style={{ color: "var(--amber)" }} />
          ) : (
            <Megaphone size={16} style={{ color: "#1D4ED8" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="badge text-[10px] px-2 py-0.5 flex items-center gap-1"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <Users size={9} />
              {audienceLabel}
            </span>
            {reach !== null && (
              <span
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                ~{reach} recipients
              </span>
            )}
          </div>

          <button onClick={onToggleExpand} className="w-full text-left">
            <h3
              className="font-semibold text-sm"
              style={{ color: "var(--text)" }}
            >
              {ann.title}
            </h3>
            {expanded ? (
              <p
                className="text-sm mt-2 leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--text-mid)" }}
              >
                {ann.body}
              </p>
            ) : (
              <p
                className="text-sm mt-0.5 line-clamp-2"
                style={{ color: "var(--text-muted)" }}
              >
                {ann.body}
              </p>
            )}
          </button>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span
              className="text-[11px] flex items-center gap-1"
              style={{ color: "var(--text-muted)" }}
            >
              <Clock size={10} />
              {timeAgo(ann.created_at)} by {ann.author_name}
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={onPin}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                style={{
                  background: "var(--bg-subtle)",
                  color: ann.is_pinned ? "var(--amber)" : "var(--text-muted)",
                  borderColor: "var(--border)",
                }}
                title={ann.is_pinned ? "Unpin" : "Pin to top"}
              >
                {ann.is_pinned ? <PinOff size={11} /> : <Pin size={11} />}
              </button>
              <button
                onClick={onEdit}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                style={{
                  background: "var(--bg-subtle)",
                  color: "var(--text-mid)",
                  borderColor: "var(--border)",
                }}
              >
                <Edit2 size={11} />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                style={{
                  background: "var(--bg-subtle)",
                  color: "#DC2626",
                  borderColor: "var(--border)",
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
