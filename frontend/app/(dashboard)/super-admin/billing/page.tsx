"use client";
import { useState } from "react";
import { useAcademies } from "@/lib/hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingAPI } from "@/lib/api";
import { PageLoading } from "@/components/shared/States";
import Modal from "@/components/shared/Modal";
import {
  CreditCard,
  Crown,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  Users,
  UserCheck,
  X,
  ToggleLeft,
  ToggleRight,
  IndianRupee,
} from "lucide-react";
import toast from "react-hot-toast";

const PLAN_COLOR: Record<string, string> = {
  trial: "#6B7280",
  starter: "#1D4ED8",
  academy: "#9A6E00",
  enterprise: "#7C3AED",
};
const PLAN_BG: Record<string, string> = {
  trial: "#F3F4F6",
  starter: "#DBEAFE",
  academy: "rgba(200,150,30,0.12)",
  enterprise: "#EDE9FE",
};

const ALL_FEATURES = [
  "live_classroom",
  "basic_analytics",
  "advanced_analytics",
  "puzzle_trainer",
  "ai_analysis",
  "tournaments",
  "parent_dashboard",
  "custom_subdomain",
  "email_support",
  "priority_support",
  "24x7_support",
  "white_label",
  "custom_domain",
  "api_access",
  "dedicated_server",
  "sla",
  "all_features",
];

// ─── Plan Modal ──────────────────────────────────────────────────────────────
function PlanModal({ plan, onClose }: { plan?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!plan;
  const [form, setForm] = useState({
    name: plan?.name || "",
    slug: plan?.slug || "",
    price_monthly: plan?.price_monthly || "",
    price_yearly: plan?.price_yearly || "",
    max_students: plan?.max_students ?? 50,
    max_coaches: plan?.max_coaches ?? 5,
    features: (plan?.features || []) as string[],
    is_active: plan?.is_active ?? true,
  });

  const up = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggleFeature = (f: string) =>
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      isEdit
        ? billingAPI.updatePlan(plan.id, form)
        : billingAPI.createPlan({
            ...form,
            slug:
              form.slug ||
              form.name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, ""),
            price_monthly: form.price_monthly
              ? Number(form.price_monthly)
              : null,
            price_yearly: form.price_yearly ? Number(form.price_yearly) : null,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans-all"] });
      toast.success(isEdit ? "Plan updated!" : "Plan created!");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Plan name is required");
    mutateAsync();
  };

  return (
    <Modal
      title={isEdit ? `Edit Plan — ${plan.name}` : "Create Subscription Plan"}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Plan Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => up("name", e.target.value)}
              placeholder="e.g. Academy Pro"
              autoFocus
            />
          </div>
          <div>
            <label className="label">
              Slug{" "}
              {isEdit && (
                <span style={{ color: "var(--text-muted)" }}>(read-only)</span>
              )}
            </label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) =>
                !isEdit &&
                up(
                  "slug",
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
              placeholder="auto-generated"
              disabled={isEdit}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Monthly Price (₹)</label>
            <div className="relative">
              <IndianRupee
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                className="input pl-8"
                type="number"
                value={form.price_monthly}
                onChange={(e) => up("price_monthly", e.target.value)}
                placeholder="Leave blank for Custom"
              />
            </div>
          </div>
          <div>
            <label className="label">Yearly Price (₹)</label>
            <div className="relative">
              <IndianRupee
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                className="input pl-8"
                type="number"
                value={form.price_yearly}
                onChange={(e) => up("price_yearly", e.target.value)}
                placeholder="Leave blank for Custom"
              />
            </div>
          </div>
          <div>
            <label className="label">Max Students</label>
            <input
              className="input"
              type="number"
              value={form.max_students}
              onChange={(e) => up("max_students", Number(e.target.value))}
              placeholder="-1 for unlimited"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Use -1 for unlimited
            </p>
          </div>
          <div>
            <label className="label">Max Coaches</label>
            <input
              className="input"
              type="number"
              value={form.max_coaches}
              onChange={(e) => up("max_coaches", Number(e.target.value))}
              placeholder="-1 for unlimited"
            />
          </div>
        </div>

        <div>
          <label className="label mb-2 block">Features Included</label>
          <div className="flex flex-wrap gap-2">
            {ALL_FEATURES.map((f) => {
              const active = form.features.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFeature(f)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={
                    active
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
                  {active ? <Check size={10} /> : <Plus size={10} />}
                  {f.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>

        {isEdit && (
          <div
            className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: "var(--bg-subtle)" }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Plan Active
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Inactive plans won't appear in the academy billing page
              </p>
            </div>
            <button onClick={() => up("is_active", !form.is_active)}>
              {form.is_active ? (
                <ToggleRight size={28} style={{ color: "var(--amber)" }} />
              ) : (
                <ToggleLeft size={28} style={{ color: "var(--border-md)" }} />
              )}
            </button>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isEdit ? (
              <Check size={14} />
            ) : (
              <Plus size={14} />
            )}
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Plan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SuperAdminBillingPage() {
  const qc = useQueryClient();
  const [modalPlan, setModalPlan] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: academies = [], isLoading: aLoad } = useAcademies({});
  const { data: plans = [], isLoading: pLoad } = useQuery({
    queryKey: ["plans-all"],
    queryFn: () => billingAPI.plansAll().then((r) => r.data.plans),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => billingAPI.deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans-all"] });
      toast.success("Plan deactivated");
    },
    onError: () => toast.error("Failed"),
  });

  if (aLoad || pLoad) return <PageLoading />;

  const activePlans = plans.filter((p: any) => p.is_active);
  const paid = academies.filter((a: any) => a.plan !== "trial" && a.is_active);
  const totalMRR = paid.reduce((s: number, a: any) => {
    const plan = plans.find(
      (p: any) => p.slug === a.plan || p.name.toLowerCase() === a.plan,
    );
    return s + (Number(plan?.price_monthly) || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {showCreate && <PlanModal onClose={() => setShowCreate(false)} />}
      {modalPlan && (
        <PlanModal plan={modalPlan} onClose={() => setModalPlan(null)} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <CreditCard size={22} style={{ color: "#7C3AED" }} />
          Billing & Plans
        </h1>
      </div>

      {/* MRR Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            l: "Est. MRR",
            v: `₹${totalMRR.toLocaleString("en-IN")}`,
            c: "#15803D",
          },
          { l: "Paid Accounts", v: paid.length, c: "#9A6E00" },
          {
            l: "Trial Accounts",
            v: academies.filter((a: any) => a.plan === "trial").length,
            c: "#1D4ED8",
          },
          { l: "Active Plans", v: activePlans.length, c: "#7C3AED" },
        ].map((s) => (
          <div key={s.l} className="stat-card">
            <div
              className="text-2xl font-display font-bold"
              style={{ color: s.c }}
            >
              {s.v}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Plans management */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Subscription Plans</h3>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={14} />
            Create Plan
          </button>
        </div>

        <div className="space-y-3">
          {plans.map((p: any) => {
            const color = PLAN_COLOR[p.slug] || "#6B7280";
            const bg = PLAN_BG[p.slug] || "#F3F4F6";
            const academyCount = academies.filter(
              (a: any) =>
                a.plan === p.slug ||
                a.plan?.toLowerCase() === p.name?.toLowerCase(),
            ).length;
            const features = Array.isArray(p.features) ? p.features : [];

            return (
              <div
                key={p.id}
                className="rounded-xl p-5 border transition-all"
                style={{
                  background: p.is_active
                    ? "var(--bg-card)"
                    : "var(--bg-subtle)",
                  borderColor: p.is_active ? "var(--border)" : "var(--border)",
                  opacity: p.is_active ? 1 : 0.6,
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {p.slug === "enterprise" && (
                        <Crown size={14} style={{ color: "var(--amber)" }} />
                      )}
                      <h4
                        className="font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {p.name}
                      </h4>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: bg, color }}
                      >
                        {p.slug}
                      </span>
                      {!p.is_active && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#FEE2E2", color: "#DC2626" }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <span
                          className="font-bold text-lg"
                          style={{ color: "var(--amber)" }}
                        >
                          {p.price_monthly
                            ? `₹${Number(p.price_monthly).toLocaleString("en-IN")}`
                            : "Custom"}
                        </span>
                        {p.price_monthly && (
                          <span
                            className="text-xs ml-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            /mo
                          </span>
                        )}
                        {p.price_yearly && (
                          <span
                            className="text-xs ml-2"
                            style={{ color: "var(--text-muted)" }}
                          >
                            · ₹{Number(p.price_yearly).toLocaleString("en-IN")}
                            /yr
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Users size={11} />
                        {p.max_students === -1
                          ? "Unlimited"
                          : p.max_students}{" "}
                        students
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <UserCheck size={11} />
                        {p.max_coaches === -1
                          ? "Unlimited"
                          : p.max_coaches}{" "}
                        coaches
                      </div>
                      <div className="text-xs font-semibold" style={{ color }}>
                        {academyCount}{" "}
                        {academyCount === 1 ? "academy" : "academies"}
                      </div>
                    </div>

                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {features.map((f: string) => (
                          <span
                            key={f}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-muted)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setModalPlan(p)}
                      className="btn-icon w-8 h-8"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    {p.is_active && (
                      <button
                        onClick={() => {
                          if (academyCount > 0)
                            return toast.error(
                              `${academyCount} academies are on this plan — deactivate them first`,
                            );
                          deleteMutation.mutate(p.id);
                        }}
                        className="btn-icon w-8 h-8"
                        title="Deactivate"
                        style={{ color: "#DC2626" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscribed academies table */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3 className="section-title">Subscribed Academies</h3>
        </div>
        {paid.length === 0 ? (
          <div
            className="p-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No paid academies yet
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Academy</th>
                <th className="th">Owner</th>
                <th className="th text-center">Students</th>
                <th className="th text-center">Plan</th>
                <th className="th text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((a: any) => {
                const plan = plans.find(
                  (p: any) =>
                    p.slug === a.plan || p.name.toLowerCase() === a.plan,
                );
                return (
                  <tr key={a.id} className="tr">
                    <td className="td font-medium text-sm">{a.name}</td>
                    <td className="td">
                      <div className="text-sm">{a.owner_name || "—"}</div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {a.owner_email}
                      </div>
                    </td>
                    <td className="td text-center text-sm">
                      {a.student_count || 0}
                    </td>
                    <td className="td text-center">
                      <span
                        className="badge capitalize text-xs"
                        style={{
                          background: PLAN_BG[a.plan] || "#F3F4F6",
                          color: PLAN_COLOR[a.plan] || "#6B7280",
                        }}
                      >
                        {a.plan}
                      </span>
                    </td>
                    <td
                      className="td text-right font-semibold"
                      style={{ color: "#15803D" }}
                    >
                      {plan?.price_monthly
                        ? `₹${Number(plan.price_monthly).toLocaleString("en-IN")}/mo`
                        : "Custom"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
