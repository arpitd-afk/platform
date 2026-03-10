"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAcademy,
  usePlans,
  useInvoices,
  useSubscription,
} from "@/lib/hooks";
import { billingExtAPI } from "@/lib/api";
import { PageLoading } from "@/components/shared/States";
import toast from "react-hot-toast";
import {
  CreditCard,
  CheckCircle2,
  Crown,
  Loader2,
  Download,
  Zap,
  Users,
  Shield,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// ─── Razorpay script loader ────────────────────────────────────
function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if ((window as any).Razorpay) {
      setLoaded(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => setLoaded(true);
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);
  return loaded;
}

// ─── Status badge ──────────────────────────────────────────────
function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    paid: { bg: "#DCFCE7", color: "#15803D", label: "Paid" },
    pending: {
      bg: "rgba(200,150,30,0.12)",
      color: "#9A6E00",
      label: "Pending",
    },
    failed: { bg: "#FEE2E2", color: "#DC2626", label: "Failed" },
    refunded: { bg: "#EDE9FE", color: "#7C3AED", label: "Refunded" },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span
      className="badge text-xs px-2.5 py-1 font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

// ─── Plan features ─────────────────────────────────────────────
const PLAN_ICONS: Record<string, any> = {
  starter: Zap,
  growth: Users,
  pro: Crown,
  enterprise: Shield,
};

// ─── Main page ─────────────────────────────────────────────────
export default function BillingPage() {
  const { user } = useAuth();
  const razorpayLoaded = useRazorpayScript();
  const { data: academy, isLoading: aLoading } = useAcademy(user?.academy_id);
  const { data: plans = [], isLoading: pLoading } = usePlans();
  const {
    data: invoices = [],
    isLoading: iLoading,
    refetch: refetchInvoices,
  } = useInvoices(user?.academy_id);
  const { data: subscription } = useSubscription(user?.academy_id);

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"plans" | "invoices">("plans");

  if (aLoading || pLoading) return <PageLoading />;

  const currentPlan = academy?.plan || subscription?.plan || "free";
  const isActive = academy?.is_active !== false;
  const usedPct =
    academy?.max_students > 0
      ? Math.min(
          100,
          Math.round(
            ((academy?.student_count || 0) / academy.max_students) * 100,
          ),
        )
      : 0;

  // ─── Initiate Razorpay payment ────────────────────────────────
  const handleUpgrade = async (planName: string, planPrice: number) => {
    if (!user?.academy_id) return;
    setProcessingPlan(planName);
    try {
      // 1. Create order on server
      const orderRes = await billingExtAPI.createOrder({
        planName,
        academyId: user.academy_id,
      });
      const { orderId, amount, currency, keyId } = orderRes.data;

      if (!keyId || keyId === "your_key_here") {
        toast.error(
          "Razorpay not configured. Add RAZORPAY_KEY_ID to your .env file.",
        );
        setProcessingPlan(null);
        return;
      }

      if (!(window as any).Razorpay) {
        toast.error(
          "Payment script failed to load. Check your internet connection.",
        );
        setProcessingPlan(null);
        return;
      }

      // 2. Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Chess Academy Pro",
        description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan — Monthly`,
        order_id: orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: { color: "#C8961E" },
        handler: async (response: any) => {
          // 3. Verify payment on server
          try {
            await billingExtAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              academyId: user.academy_id,
              planName,
            });
            toast.success(`🎉 Upgraded to ${planName} plan!`);
            refetchInvoices();
            window.location.reload(); // refresh academy data
          } catch (e: any) {
            toast.error(
              e.response?.data?.message || "Payment verification failed",
            );
          }
        },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (r: any) => {
        toast.error(`Payment failed: ${r.error.description}`);
        setProcessingPlan(null);
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to initiate payment");
      setProcessingPlan(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <CreditCard size={22} style={{ color: "#7C3AED" }} />
        Billing &amp; Plans
      </h1>

      {/* Current plan summary */}
      {academy && (
        <div className="card p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div
                className="text-xs font-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                CURRENT PLAN
              </div>
              <div
                className="font-display text-2xl font-bold capitalize"
                style={{ color: "var(--amber)" }}
              >
                {currentPlan}
              </div>
              <div
                className="flex items-center gap-1.5 mt-1 text-sm"
                style={{ color: isActive ? "#15803D" : "#DC2626" }}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400" : "bg-red-400"}`}
                />
                {isActive ? "Active" : "Inactive"}
                {academy.trial_ends_at && (
                  <span
                    className="ml-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    · renews{" "}
                    {new Date(academy.trial_ends_at).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-[160px]">
              <div
                className="flex items-center justify-between text-xs mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <span>Students</span>
                <span className="font-medium" style={{ color: "var(--text)" }}>
                  {academy.student_count || 0} /{" "}
                  {academy.max_students === -1 ? "∞" : academy.max_students}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-subtle)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${usedPct}%`,
                    background:
                      usedPct > 90
                        ? "#DC2626"
                        : usedPct > 70
                          ? "#9A6E00"
                          : "#15803D",
                  }}
                />
              </div>
              {usedPct > 80 && (
                <div
                  className="flex items-center gap-1 mt-1 text-[10px]"
                  style={{ color: "#DC2626" }}
                >
                  <AlertTriangle size={10} />
                  Approaching limit — consider upgrading
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 card p-1 rounded-xl w-fit">
        {(["plans", "invoices"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={
              activeTab === t
                ? { background: "rgba(124,58,237,0.12)", color: "#7C3AED" }
                : { color: "var(--text-muted)" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── PLANS TAB ── */}
      {activeTab === "plans" && (
        <div className="grid md:grid-cols-3 gap-4">
          {(plans as any[]).map((p) => {
            const isCurrent = currentPlan === (p.slug || p.name?.toLowerCase());
            const Icon = PLAN_ICONS[p.slug || p.name?.toLowerCase()] || Zap;
            const isProcessing = processingPlan === (p.slug || p.name);
            const isFree = !p.price_monthly || p.price_monthly <= 0;
            const isPremium =
              (p.slug || p.name) === "pro" ||
              (p.slug || p.name) === "enterprise";

            return (
              <div
                key={p.id}
                className="card p-6 flex flex-col relative overflow-hidden"
                style={
                  isCurrent
                    ? {
                        borderColor: "rgba(200,150,30,0.5)",
                        background: "rgba(200,150,30,0.03)",
                      }
                    : isPremium
                      ? { borderColor: "rgba(124,58,237,0.3)" }
                      : {}
                }
              >
                {isPremium && !isCurrent && (
                  <div
                    className="absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-xl"
                    style={{ background: "#7C3AED", color: "white" }}
                  >
                    POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div
                    className="absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-xl"
                    style={{ background: "var(--amber)", color: "white" }}
                  >
                    CURRENT
                  </div>
                )}

                <Icon
                  size={22}
                  className="mb-3"
                  style={{ color: isCurrent ? "var(--amber)" : "#7C3AED" }}
                />
                <h3
                  className="font-display text-lg font-bold capitalize"
                  style={{ color: "var(--text)" }}
                >
                  {p.name}
                </h3>
                <div className="mt-1.5 mb-1">
                  <span
                    className="font-display text-3xl font-bold"
                    style={{ color: "var(--amber)" }}
                  >
                    {isFree ? "Free" : `₹${p.price_monthly}`}
                  </span>
                  {!isFree && (
                    <span
                      className="text-sm ml-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      /month
                    </span>
                  )}
                </div>
                <div
                  className="text-xs mb-5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {p.max_students === -1
                    ? "Unlimited students"
                    : `Up to ${p.max_students} students`}
                </div>

                {Array.isArray(p.features) && (
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {p.features.map((f: string) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-xs"
                        style={{ color: "var(--text-mid)" }}
                      >
                        <CheckCircle2
                          size={13}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: "#15803D" }}
                        />
                        {f.replace(/_/g, " ")}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  disabled={isCurrent || !!processingPlan}
                  onClick={() =>
                    !isFree
                      ? handleUpgrade(p.slug || p.name, p.price_monthly)
                      : undefined
                  }
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isCurrent
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
                  style={
                    isCurrent
                      ? {
                          background: "var(--bg-subtle)",
                          color: "var(--text-muted)",
                        }
                      : isFree
                        ? {
                            background: "var(--bg-subtle)",
                            color: "var(--text-mid)",
                          }
                        : { background: "#7C3AED", color: "white" }
                  }
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    <>
                      <CheckCircle2 size={14} />
                      Current Plan
                    </>
                  ) : isFree ? (
                    "Free Plan"
                  ) : (
                    <>Upgrade — ₹{p.price_monthly}/mo</>
                  )}
                </button>

                {!isFree && !isCurrent && !razorpayLoaded && (
                  <p
                    className="text-[10px] mt-2 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading payment gateway...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {activeTab === "invoices" && (
        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-subtle)",
            }}
          >
            <h3 className="section-title">Invoice History</h3>
            <button
              onClick={() => refetchInvoices()}
              className="btn-icon w-8 h-8"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>
          {iLoading ? (
            <div className="p-10 text-center">
              <Loader2
                size={24}
                className="animate-spin mx-auto"
                style={{ color: "var(--amber)" }}
              />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard
                size={36}
                className="mx-auto mb-3"
                style={{ color: "var(--border-md)" }}
              />
              <p className="font-medium" style={{ color: "var(--text)" }}>
                No invoices yet
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Invoices will appear here after your first payment
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Description</th>
                  <th className="th text-center">Amount</th>
                  <th className="th text-center">Status</th>
                  <th className="th text-center hidden sm:table-cell">Date</th>
                  <th className="th text-center hidden sm:table-cell">
                    Payment ID
                  </th>
                  <th className="th text-center">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {(invoices as any[]).map((inv) => (
                  <tr key={inv.id} className="tr">
                    <td className="td">
                      <div
                        className="font-medium text-sm"
                        style={{ color: "var(--text)" }}
                      >
                        {inv.description || inv.plan || "Subscription"}
                      </div>
                    </td>
                    <td
                      className="td text-center font-semibold text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      ₹{parseFloat(inv.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="td text-center">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td
                      className="td text-center text-xs hidden sm:table-cell"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(inv.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="td text-center hidden sm:table-cell">
                      {inv.razorpay_payment_id ? (
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {inv.razorpay_payment_id.slice(0, 16)}...
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="td text-center">
                      {inv.invoice_url ? (
                        <a
                          href={inv.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon w-7 h-7 inline-flex"
                          title="Download"
                        >
                          <Download size={12} />
                        </a>
                      ) : inv.status === "paid" ? (
                        <button
                          onClick={() => {
                            const rows = [
                              ["Chess Academy Pro — Receipt"],
                              [""],
                              ["Invoice ID", inv.id],
                              [
                                "Description",
                                inv.description || "Subscription",
                              ],
                              ["Amount", `INR ${inv.amount}`],
                              ["Status", inv.status],
                              [
                                "Date",
                                new Date(inv.created_at).toLocaleDateString(),
                              ],
                              inv.razorpay_payment_id
                                ? ["Payment ID", inv.razorpay_payment_id]
                                : [],
                            ].filter((r) => r.length);
                            const csv = rows.map((r) => r.join(",")).join("\n");
                            const blob = new Blob([csv], { type: "text/csv" });
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = `invoice-${inv.id.slice(0, 8)}.csv`;
                            a.click();
                          }}
                          className="btn-icon w-7 h-7 inline-flex"
                          title="Download CSV"
                        >
                          <Download size={12} />
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Razorpay notice */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl text-sm"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
        }}
      >
        <Shield
          size={16}
          className="flex-shrink-0 mt-0.5"
          style={{ color: "#15803D" }}
        />
        <div style={{ color: "var(--text-muted)" }}>
          Payments are processed securely via{" "}
          <strong style={{ color: "var(--text)" }}>Razorpay</strong>. Your card
          details are never stored on our servers. To configure live payments,
          add your
          <code
            className="mx-1 px-1.5 py-0.5 rounded text-xs"
            style={{ background: "var(--bg-hover)", color: "var(--amber)" }}
          >
            RAZORPAY_KEY_ID
          </code>
          and
          <code
            className="mx-1 px-1.5 py-0.5 rounded text-xs"
            style={{ background: "var(--bg-hover)", color: "var(--amber)" }}
          >
            RAZORPAY_KEY_SECRET
          </code>
          to your{" "}
          <code className="text-xs" style={{ color: "var(--amber)" }}>
            .env
          </code>{" "}
          file.
        </div>
      </div>
    </div>
  );
}
