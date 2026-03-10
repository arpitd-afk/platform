"use client";
import { useAuth } from "@/lib/auth-context";
import { useUsers } from "@/lib/hooks";
import { PageLoading } from "@/components/shared/States";
import Avatar from "@/components/shared/Avatar";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Calendar,
  ClipboardList,
  ArrowUpRight,
  Star,
  UserPlus,
} from "lucide-react";

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useUsers({
    role: "student",
    parentId: user?.id,
  });

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className="card p-6 flex items-center gap-5"
        style={{
          background:
            "linear-gradient(135deg, #FFFCF8 0%, rgba(190,24,93,0.04) 100%)",
        }}
      >
        <Avatar user={user} size="lg" />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">
            Hello, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {children.length > 0
              ? `Monitoring ${children.length} child${children.length > 1 ? "ren" : ""}'s chess journey`
              : "Contact your academy to link your children to your account"}
          </p>
        </div>
      </div>

      {children.length > 0 && (
        <div>
          <h2 className="section-title mb-3">My Children</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child: any) => (
              <div key={child.id} className="card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar user={child} size="md" />
                  <div>
                    <div
                      className="font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {child.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {child.batch_name || "No batch assigned"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div
                    className="rounded-lg p-2.5"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <div
                      className="flex items-center justify-center gap-1 font-bold"
                      style={{ color: "var(--amber)" }}
                    >
                      <Star size={12} />
                      {child.rating || 1200}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ELO Rating
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-2.5"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <div
                      className="font-bold text-sm"
                      style={{ color: "#1D4ED8" }}
                    >
                      {child.games_played || 0}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Games
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/parent/progress"
                    className="text-center text-xs py-2 rounded-xl font-medium transition-all btn-secondary"
                  >
                    <TrendingUp size={12} className="mx-auto mb-0.5" />
                    Progress
                  </Link>
                  <Link
                    href="/parent/attendance"
                    className="text-center text-xs py-2 rounded-xl font-medium transition-all btn-secondary"
                  >
                    <Calendar size={12} className="mx-auto mb-0.5" />
                    Attend.
                  </Link>
                  <Link
                    href="/parent/homework"
                    className="text-center text-xs py-2 rounded-xl font-medium transition-all btn-secondary"
                  >
                    <ClipboardList size={12} className="mx-auto mb-0.5" />
                    Work
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Children",
            value: children.length,
            icon: Users,
            color: "#BE185D",
            href: "/parent/children",
          },
          {
            label: "Upcoming Classes",
            value: 0,
            icon: Calendar,
            color: "#1D4ED8",
            href: "/parent/attendance",
          },
          {
            label: "Pending Homework",
            value: 0,
            icon: ClipboardList,
            color: "#9A6E00",
            href: "/parent/homework",
          },
          {
            label: "Monthly Progress",
            value: "+0%",
            icon: TrendingUp,
            color: "#15803D",
            href: "/parent/progress",
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="stat-card hover:shadow-md transition-all"
          >
            <s.icon size={18} style={{ color: s.color }} />
            <div
              className="text-2xl font-display font-bold mt-1"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {children.length === 0 && (
        <div className="card p-10 text-center">
          <UserPlus
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--border-md)" }}
          />
          <h3 className="font-semibold mb-2">No children linked</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Ask your academy admin or coach to link your child's account to this
            parent profile.
          </p>
        </div>
      )}
    </div>
  );
}
