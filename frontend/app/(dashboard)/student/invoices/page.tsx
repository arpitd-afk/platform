"use client";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { studentInvoicesAPI } from "@/lib/api";
import { PageLoading } from "@/components/shared/States";
import toast from "react-hot-toast";
import {
  Receipt,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  X,
  IndianRupee,
} from "lucide-react";

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> =
  {
    draft: {
      bg: "var(--bg-subtle)",
      color: "var(--text-muted)",
      label: "Draft",
    },
    sent: { bg: "rgba(200,150,30,0.12)", color: "#9A6E00", label: "Due" },
    paid: { bg: "#DCFCE7", color: "#15803D", label: "Paid" },
    overdue: { bg: "#FEE2E2", color: "#DC2626", label: "Overdue" },
    cancelled: { bg: "#F3F4F6", color: "#6B7280", label: "Cancelled" },
  };

function fmt(n: any, currency = "INR") {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function StudentInvoicesPage() {
  const { user } = useAuth();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["my-invoices", user?.id],
    queryFn: () =>
      studentInvoicesAPI
        .list({ studentId: user?.id })
        .then((r) => r.data.invoices),
    enabled: !!user?.id,
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
        toast.success("Invoice downloaded!");
      })
      .catch(() => toast.error("Failed to download"));
  };

  if (isLoading) return <PageLoading />;

  const totalDue = invoices
    .filter((i: any) => ["sent", "overdue"].includes(i.status))
    .reduce((s: number, i: any) => s + Number(i.total || 0), 0);

  const totalPaid = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((s: number, i: any) => s + Number(i.total || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <Receipt size={22} style={{ color: "var(--amber)" }} />
        My Invoices
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="stat-card" style={{ borderTop: "3px solid #DC2626" }}>
          <div
            className="font-display text-xl font-bold"
            style={{ color: "#DC2626" }}
          >
            {fmt(totalDue)}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Amount Due
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #15803D" }}>
          <div
            className="font-display text-xl font-bold"
            style={{ color: "#15803D" }}
          >
            {fmt(totalPaid)}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Total Paid
          </div>
        </div>
        <div
          className="stat-card hidden sm:block"
          style={{ borderTop: "3px solid var(--amber)" }}
        >
          <div
            className="font-display text-xl font-bold"
            style={{ color: "var(--amber)" }}
          >
            {invoices.length}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Total Invoices
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <Receipt
            size={36}
            className="mx-auto"
            style={{ color: "var(--border-md)" }}
          />
          <p
            className="font-semibold text-sm"
            style={{ color: "var(--text-mid)" }}
          >
            No invoices yet
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Your fee invoices will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv: any) => {
            const sc = STATUS_CFG[inv.status] || STATUS_CFG.sent;
            const isOverdue = inv.status === "overdue";
            const isDue = inv.status === "sent";
            return (
              <div
                key={inv.id}
                className="card p-5"
                style={{
                  borderLeft: `4px solid ${isOverdue ? "#DC2626" : isDue ? "#C8961E" : inv.status === "paid" ? "#15803D" : "var(--border)"}`,
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: "var(--amber)" }}
                      >
                        {inv.invoice_number}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {sc.label}
                      </span>
                      {isOverdue && (
                        <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          Overdue
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {inv.batch_name ? `${inv.batch_name} — ` : ""}Tuition Fee
                    </div>
                    <div
                      className="text-xs mt-1 flex items-center gap-3 flex-wrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {inv.period_from && (
                        <span>
                          {new Date(inv.period_from).toLocaleDateString(
                            "en-IN",
                            { month: "short", year: "numeric" },
                          )}
                          {inv.period_to
                            ? ` – ${new Date(inv.period_to).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                            : ""}
                        </span>
                      )}
                      {inv.due_date && (
                        <span
                          className={
                            isOverdue ? "text-red-500 font-semibold" : ""
                          }
                        >
                          Due:{" "}
                          {new Date(inv.due_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {inv.notes && (
                      <p
                        className="text-xs mt-2 p-2 rounded-lg"
                        style={{
                          background: "var(--bg-subtle)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {inv.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-2xl font-bold font-display"
                      style={{ color: "var(--text)" }}
                    >
                      {fmt(inv.total, inv.currency)}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      incl. GST {inv.tax_rate}%
                    </div>
                    <button
                      onClick={() => downloadPdf(inv.id, inv.invoice_number)}
                      className="mt-3 btn-primary text-xs flex items-center gap-1.5 ml-auto"
                    >
                      <Download size={12} />
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Line items preview */}
                {Array.isArray(inv.line_items) && inv.line_items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="space-y-1">
                      {inv.line_items.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span>
                            {item.description}{" "}
                            {item.qty > 1 ? `× ${item.qty}` : ""}
                          </span>
                          <span
                            className="font-medium"
                            style={{ color: "var(--text-mid)" }}
                          >
                            {fmt(item.qty * item.rate, inv.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
