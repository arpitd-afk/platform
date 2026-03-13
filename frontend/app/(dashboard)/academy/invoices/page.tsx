"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentInvoicesAPI, api } from "@/lib/api";
import { PageLoading } from "@/components/shared/States";
import toast from "react-hot-toast";
import {
  Receipt,
  Plus,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  X,
  ChevronDown,
  Search,
  FileText,
  MoreVertical,
  Edit3,
  IndianRupee,
} from "lucide-react";
import Modal from "@/components/shared/Modal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LineItem {
  description: string;
  qty: number;
  rate: number;
}

const STATUS_CFG: Record<
  string,
  { bg: string; color: string; label: string; icon: any }
> = {
  draft: {
    bg: "var(--bg-subtle)",
    color: "var(--text-muted)",
    label: "Draft",
    icon: FileText,
  },
  sent: {
    bg: "rgba(200,150,30,0.12)",
    color: "#9A6E00",
    label: "Sent",
    icon: Send,
  },
  paid: { bg: "#DCFCE7", color: "#15803D", label: "Paid", icon: CheckCircle2 },
  overdue: {
    bg: "#FEE2E2",
    color: "#DC2626",
    label: "Overdue",
    icon: AlertTriangle,
  },
  cancelled: { bg: "#F3F4F6", color: "#6B7280", label: "Cancelled", icon: X },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || STATUS_CFG.draft;
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      <Icon size={10} />
      {c.label}
    </span>
  );
}

function fmt(n: any, currency = "INR") {
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
function CreateInvoiceModal({ students, batches, onClose, onCreated }: any) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    studentId: "",
    batchId: "",
    dueDate: "",
    periodFrom: "",
    periodTo: "",
    notes: "",
    taxRate: 18,
    currency: "INR",
    status: "draft",
  });
  const [items, setItems] = useState<LineItem[]>([
    { description: "Monthly Tuition Fee", qty: 1, rate: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const tax = +((subtotal * form.taxRate) / 100).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const addItem = () =>
    setItems((prev) => [...prev, { description: "", qty: 1, rate: 0 }]);
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, val: any) =>
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) return toast.error("Select a student");
    if (!items.some((i) => i.description && i.rate > 0))
      return toast.error("Add at least one line item");
    setSaving(true);
    try {
      await studentInvoicesAPI.create({ ...form, lineItems: items });
      toast.success("Invoice created!");
      qc.invalidateQueries({ queryKey: ["student-invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-summary"] });
      onCreated?.();
      onClose();
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Invoice" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student + Batch */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Student *</label>
            <select
              className="input"
              value={form.studentId}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentId: e.target.value }))
              }
            >
              <option value="">— Select student —</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Batch (optional)</label>
            <select
              className="input"
              value={form.batchId}
              onChange={(e) =>
                setForm((f) => ({ ...f, batchId: e.target.value }))
              }
            >
              <option value="">— None —</option>
              {batches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Period + Due date */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Period From</label>
            <input
              type="date"
              className="input"
              value={form.periodFrom}
              onChange={(e) =>
                setForm((f) => ({ ...f, periodFrom: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Period To</label>
            <input
              type="date"
              className="input"
              value={form.periodTo}
              onChange={(e) =>
                setForm((f) => ({ ...f, periodTo: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, dueDate: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Line Items</label>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
            >
              <Plus size={11} />
              Add item
            </button>
          </div>
          <div className="space-y-2">
            <div
              className="grid grid-cols-[1fr_80px_100px_32px] gap-2 text-xs font-semibold px-1"
              style={{ color: "var(--text-muted)" }}
            >
              <span>Description</span>
              <span className="text-center">Qty</span>
              <span className="text-center">Rate (₹)</span>
              <span />
            </div>
            {items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center"
              >
                <input
                  className="input text-sm py-1.5"
                  placeholder="e.g. Monthly Fee"
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                />
                <input
                  type="number"
                  className="input text-sm py-1.5 text-center"
                  min={1}
                  value={item.qty}
                  onChange={(e) =>
                    updateItem(i, "qty", parseInt(e.target.value) || 1)
                  }
                />
                <input
                  type="number"
                  className="input text-sm py-1.5 text-center"
                  min={0}
                  value={item.rate}
                  onChange={(e) =>
                    updateItem(i, "rate", parseFloat(e.target.value) || 0)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  className="btn-icon w-7 h-7 text-red-400 disabled:opacity-30"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
            <span className="font-medium">{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--text-muted)" }}>GST</span>
              <input
                type="number"
                className="input py-0.5 px-2 text-xs w-16 text-center"
                min={0}
                max={30}
                value={form.taxRate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    taxRate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                %
              </span>
            </div>
            <span className="font-medium">{fmt(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-[var(--border)] pt-2">
            <span>Total</span>
            <span style={{ color: "var(--amber)" }}>{fmt(total)}</span>
          </div>
        </div>

        {/* Notes + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Payment instructions, bank details…"
            />
          </div>
          <div>
            <label className="label">Initial Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="draft">Draft</option>
              <option value="sent">Send immediately</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving ? (
              "Creating…"
            ) : (
              <>
                <Receipt size={14} />
                Create Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["student-invoices", statusFilter],
    queryFn: () =>
      studentInvoicesAPI
        .list(statusFilter !== "all" ? { status: statusFilter } : {})
        .then((r) => r.data.invoices),
  });

  const { data: summary } = useQuery({
    queryKey: ["invoice-summary", user?.academyId],
    queryFn: () =>
      studentInvoicesAPI.summary(user!.academyId!).then((r) => r.data.summary),
    enabled: !!user?.academyId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["academy-students-list"],
    queryFn: () =>
      api
        .get("/users", { params: { role: "student" } })
        .then((r) => r.data.users || []),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["batches-list"],
    queryFn: () => api.get("/batches").then((r) => r.data.batches || []),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      studentInvoicesAPI.update(id, { status }),
    onSuccess: () => {
      toast.success("Invoice updated");
      qc.invalidateQueries({ queryKey: ["student-invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-summary"] });
      setActionMenu(null);
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteInv = useMutation({
    mutationFn: (id: string) => studentInvoicesAPI.delete(id),
    onSuccess: () => {
      toast.success("Invoice deleted");
      qc.invalidateQueries({ queryKey: ["student-invoices"] });
      setActionMenu(null);
    },
    onError: () => toast.error("Only draft invoices can be deleted"),
  });

  const downloadPdf = (id: string, invNumber: string) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    fetch(studentInvoicesAPI.pdfUrl(id), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `invoice-${invNumber}.pdf`;
        a.click();
        toast.success("PDF downloaded!");
      })
      .catch(() => toast.error("Failed to download PDF"));
  };

  const filtered = invoices.filter(
    (inv: any) =>
      (inv.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) return <PageLoading />;

  return (
    <div
      className="space-y-5 animate-fade-in pb-32"
      onClick={() => setActionMenu(null)}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Receipt size={22} style={{ color: "var(--amber)" }} />
          Fee Invoices
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          New Invoice
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Collected",
              value: fmt(summary.total_collected),
              color: "#15803D",
              bg: "#DCFCE7",
            },
            {
              label: "Outstanding",
              value: fmt(summary.total_outstanding),
              color: "#9A6E00",
              bg: "rgba(200,150,30,0.12)",
            },
            {
              label: "Pending",
              value: String(summary.pending || 0),
              color: "#9A6E00",
              bg: "rgba(200,150,30,0.08)",
            },
            {
              label: "Overdue",
              value: String(summary.overdue || 0),
              color: "#DC2626",
              bg: "#FEE2E2",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="stat-card"
              style={{ borderTop: `3px solid ${s.color}` }}
            >
              <div
                className="font-display text-xl font-bold"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or invoice #…"
            className="input pl-9 py-2 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "draft", "sent", "paid", "overdue", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all"
              style={
                statusFilter === s
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
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt
              size={36}
              className="mx-auto"
              style={{ color: "var(--border-md)" }}
            />
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-mid)" }}
            >
              No invoices found
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {statusFilter !== "all"
                ? "Try a different filter"
                : 'Click "+ New Invoice" to create your first'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Invoice #</th>
                <th className="th">Student</th>
                <th className="th hidden sm:table-cell">Batch</th>
                <th className="th hidden md:table-cell">Period</th>
                <th className="th text-right">Amount</th>
                <th className="th text-center">Status</th>
                <th className="th hidden sm:table-cell text-center">Due</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv: any, idx: number) => (
                <tr key={inv.id} className="tr">
                  <td className="td">
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: "var(--amber)" }}
                    >
                      {inv.invoice_number}
                    </span>
                  </td>
                  <td className="td">
                    <div className="font-medium text-sm">
                      {inv.student_name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {inv.student_email}
                    </div>
                  </td>
                  <td
                    className="td hidden sm:table-cell text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {inv.batch_name || "—"}
                  </td>
                  <td
                    className="td hidden md:table-cell text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {inv.period_from
                      ? `${new Date(inv.period_from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                      : "—"}
                  </td>
                  <td className="td text-right">
                    <div
                      className="font-bold text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      {fmt(inv.total, inv.currency)}
                    </div>
                    {inv.amount_paid > 0 && inv.amount_paid < inv.total && (
                      <div className="text-[10px]" style={{ color: "#15803D" }}>
                        +{fmt(inv.amount_paid)} paid
                      </div>
                    )}
                  </td>
                  <td className="td text-center">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td
                    className="td hidden sm:table-cell text-center text-xs"
                    style={{
                      color:
                        inv.status === "overdue"
                          ? "#DC2626"
                          : "var(--text-muted)",
                    }}
                  >
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                  <td className="td text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* PDF download */}
                      <button
                        onClick={() => downloadPdf(inv.id, inv.invoice_number)}
                        title="Download PDF"
                        className="btn-icon w-7 h-7"
                        style={{ color: "var(--amber)" }}
                      >
                        <Download size={13} />
                      </button>
                      {/* Action menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenu(
                              actionMenu === inv.id ? null : inv.id,
                            );
                          }}
                          className="btn-icon w-7 h-7"
                        >
                          <MoreVertical size={13} />
                        </button>
                        {actionMenu === inv.id && (
                          <div
                            className={`absolute right-0 z-20 card p-1 shadow-xl min-w-40 ${
                              idx >= filtered.length - 2 && filtered.length > 3
                                ? "bottom-8"
                                : "top-8"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {inv.status === "draft" && (
                              <button
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: inv.id,
                                    status: "sent",
                                  })
                                }
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2"
                              >
                                <Send size={13} />
                                Mark as Sent
                              </button>
                            )}
                            {["sent", "overdue"].includes(inv.status) && (
                              <button
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: inv.id,
                                    status: "paid",
                                  })
                                }
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                style={{ color: "#15803D" }}
                              >
                                <CheckCircle2 size={13} />
                                Mark as Paid
                              </button>
                            )}
                            {["sent", "draft"].includes(inv.status) && (
                              <button
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: inv.id,
                                    status: "overdue",
                                  })
                                }
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                style={{ color: "#DC2626" }}
                              >
                                <AlertTriangle size={13} />
                                Mark Overdue
                              </button>
                            )}
                            {inv.status === "cancelled" && (
                              <button
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: inv.id,
                                    status: "draft",
                                  })
                                }
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2"
                              >
                                <Edit3 size={13} />
                                Restore to Draft
                              </button>
                            )}
                            {inv.status !== "cancelled" && (
                              <button
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: inv.id,
                                    status: "cancelled",
                                  })
                                }
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <X size={13} />
                                Cancel
                              </button>
                            )}
                            {["draft", "cancelled"].includes(inv.status) && (
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Delete this ${inv.status} invoice?`,
                                    )
                                  )
                                    deleteInv.mutate(inv.id);
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 flex items-center gap-2 border-t border-[var(--border)] mt-1 pt-2"
                                style={{ color: "#DC2626" }}
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateInvoiceModal
          students={students}
          batches={batches}
          onClose={() => setShowCreate(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}
