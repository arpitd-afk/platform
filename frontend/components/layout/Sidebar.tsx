"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUnreadCount } from "@/lib/hooks";
import Avatar from "@/components/shared/Avatar";
import {
  Brain,
  LayoutDashboard,
  Users,
  BookOpen,
  Trophy,
  BarChart3,
  CreditCard,
  Settings,
  Megaphone,
  Puzzle as PuzzleIcon,
  ChevronLeft,
  ChevronRight,
  Puzzle,
  ClipboardList,
  Calendar,
  MessageSquare,
  CheckSquare,
  Swords,
  Award,
  TrendingUp,
  Building2,
  Shield,
  Crown,
  LogOut,
  Bell,
  Video,
  GraduationCap,
  Layers,
  Wallet,
  UserCheck,
  Activity,
  Menu,
  X,
  Receipt,
  FileText,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: any;
}
interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV: Record<string, NavGroup[]> = {
  student: [
    {
      group: "Learn",
      items: [
        { label: "Dashboard", href: "/student", icon: LayoutDashboard },
        { label: "Lessons", href: "/student/lessons", icon: BookOpen },
        { label: "Puzzles", href: "/student/puzzles", icon: Puzzle },
        {
          label: "Assignments",
          href: "/student/assignments",
          icon: ClipboardList,
        },
        { label: "Attendance", href: "/student/attendance", icon: Calendar },
      ],
    },
    {
      group: "Play",
      items: [
        { label: "Play Chess", href: "/game", icon: Swords },
        { label: "Game History", href: "/student/games", icon: Trophy },
        { label: "My Invoices", href: "/student/invoices", icon: Receipt },
        // { label: "Analysis", href: "/student/analysis", icon: Brain },
        { label: "Tournaments", href: "/student/tournaments", icon: Award },
      ],
    },
    {
      group: "Track",
      items: [
        { label: "My Progress", href: "/student/progress", icon: TrendingUp },
        { label: "Leaderboard", href: "/student/leaderboard", icon: Award },
        { label: "Messages", href: "/student/messages", icon: MessageSquare },
      ],
    },
  ],
  coach: [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", href: "/coach", icon: LayoutDashboard },
        { label: "My Students", href: "/coach/students", icon: Users },
      ],
    },
    {
      group: "Teaching",
      items: [
        { label: "Classrooms", href: "/coach/classroom", icon: Video },
        {
          label: "Assignments",
          href: "/coach/assignments",
          icon: ClipboardList,
        },
        { label: "PGN Library", href: "/coach/library", icon: BookOpen },
        { label: "Puzzles & MCQ", href: "/coach/puzzles", icon: PuzzleIcon },
        { label: "Schedule", href: "/coach/schedule", icon: Calendar },
        { label: "Attendance", href: "/coach/attendance", icon: CheckSquare },
      ],
    },
    {
      group: "Insights",
      items: [
        { label: "Analysis", href: "/coach/analysis", icon: BarChart3 },
        { label: "Reports", href: "/coach/reports", icon: FileText },
        { label: "Messages", href: "/coach/messages", icon: MessageSquare },
        { label: "Settings", href: "/coach/settings", icon: Settings },
      ],
    },
  ],
  academy_admin: [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", href: "/academy", icon: LayoutDashboard },
        { label: "Analytics", href: "/academy/analytics", icon: BarChart3 },
      ],
    },
    {
      group: "People",
      items: [
        { label: "Students", href: "/academy/students", icon: GraduationCap },
        { label: "Coaches", href: "/academy/coaches", icon: UserCheck },
        { label: "Batches", href: "/academy/batches", icon: Layers },
      ],
    },
    {
      group: "Operations",
      items: [
        { label: "Classes", href: "/academy/classes", icon: BookOpen },
        {
          label: "Announcements",
          href: "/academy/announcements",
          icon: Megaphone,
        },
        { label: "Tournaments", href: "/academy/tournaments", icon: Trophy },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Billing", href: "/academy/billing", icon: CreditCard },
        { label: "Fee Invoices", href: "/academy/invoices", icon: Receipt },
        { label: "Settings", href: "/academy/settings", icon: Settings },
      ],
    },
  ],
  parent: [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
        { label: "My Children", href: "/parent/children", icon: Users },
      ],
    },
    {
      group: "Monitor",
      items: [
        { label: "Progress", href: "/parent/progress", icon: TrendingUp },
        { label: "Attendance", href: "/parent/attendance", icon: Calendar },
        { label: "Homework", href: "/parent/homework", icon: ClipboardList },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Payments", href: "/parent/payments", icon: Wallet },
        { label: "Messages", href: "/parent/messages", icon: MessageSquare },
        { label: "Settings", href: "/parent/settings", icon: Settings },
      ],
    },
  ],
  super_admin: [
    {
      group: "Platform",
      items: [
        { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
        { label: "Academies", href: "/super-admin/academies", icon: Building2 },
        { label: "Users", href: "/super-admin/users", icon: Users },
      ],
    },
    {
      group: "Insights",
      items: [
        { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
        { label: "Billing", href: "/super-admin/billing", icon: CreditCard },
      ],
    },
    {
      group: "Moderation",
      items: [
        { label: "Anti-Cheat", href: "/super-admin/anticheat", icon: Shield },
        { label: "Activity Logs", href: "/super-admin/logs", icon: Activity },
        { label: "Settings", href: "/super-admin/settings", icon: Settings },
      ],
    },
  ],
};
const ROLE_COLOR: Record<string, string> = {
  super_admin: "#7C3AED",
  academy_admin: "#9A6E00",
  coach: "#15803D",
  student: "#1D4ED8",
  parent: "#BE185D",
};

function NavLink({ href, icon: Icon, label, collapsed, unread }: any) {
  const pathname = usePathname();
  const active =
    href === pathname || (href.length > 10 && pathname.startsWith(href));
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${collapsed ? "justify-center" : ""}`}
      style={{
        background: active ? "rgba(200,150,30,0.10)" : "",
        color: active ? "var(--amber)" : "var(--text-muted)",
        fontWeight: active ? 600 : 500,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as any).style.background = "var(--bg-hover)";
          (e.currentTarget as any).style.color = "var(--text-mid)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as any).style.background = "";
          (e.currentTarget as any).style.color = "var(--text-muted)";
        }
      }}
    >
      <Icon size={17} className="flex-shrink-0" />
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && unread > 0 && (
        <span
          className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
          style={{ background: "var(--amber)" }}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

function SidebarBody({
  collapsed,
  onNav,
}: {
  collapsed: boolean;
  onNav?: () => void;
}) {
  const { user, logout } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const navGroups = NAV[user?.role || ""] || [];
  const roleColor = ROLE_COLOR[user?.role || ""] || "#9A6E00";

  return (
    <div
      className={`flex flex-col h-full ${collapsed ? "w-[68px]" : "w-[240px]"} transition-all duration-300 relative`}
      style={{ background: "#FFFCF8", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 py-5 ${collapsed ? "px-3 justify-center" : "px-4"}`}
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(200,150,30,0.15)",
            border: "1px solid rgba(200,150,30,0.25)",
          }}
        >
          <Crown size={16} style={{ color: "var(--amber)" }} />
        </div>
        {!collapsed && (
          <div>
            <div
              className="font-display font-bold text-sm"
              style={{ color: "var(--text)" }}
            >
              Chess Academy
            </div>
            <div
              className="text-[10px] capitalize font-medium"
              style={{ color: roleColor }}
            >
              {user?.role?.replace("_", " ")}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none px-2">
        <NavLink
          href="/notifications"
          icon={Bell}
          label="Notifications"
          collapsed={collapsed}
          unread={unreadCount}
        />
        {navGroups.map((g) => (
          <div key={g.group} className="mb-1">
            {!collapsed && (
              <p
                className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-1 mt-3"
                style={{ color: "var(--text-muted)" }}
              >
                {g.group}
              </p>
            )}
            {g.items.map((item) => (
              <div key={item.href} onClick={onNav}>
                <NavLink
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  unread={0}
                />
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Profile + Logout */}
      <div
        className="p-3 space-y-1"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <Link
          href="/profile"
          onClick={onNav}
          className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${collapsed ? "justify-center" : ""}`}
          onMouseEnter={(e) =>
            ((e.currentTarget as any).style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) => ((e.currentTarget as any).style.background = "")}
        >
          <Avatar user={user} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold truncate"
                style={{ color: "var(--text)" }}
              >
                {user?.name}
              </div>
              <div className="text-[10px]" style={{ color: roleColor }}>
                {user?.email}
              </div>
            </div>
          )}
        </Link>
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full transition-all ${collapsed ? "justify-center" : ""}`}
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as any).style.background = "#FEE2E2";
            (e.currentTarget as any).style.color = "#DC2626";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as any).style.background = "";
            (e.currentTarget as any).style.color = "var(--text-muted)";
          }}
        >
          <LogOut size={15} className="flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex relative h-screen flex-shrink-0">
        <SidebarBody collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3.5 top-20 w-7 h-7 rounded-full flex items-center justify-center z-10 shadow"
          style={{ background: "#FFFCF8", border: "1px solid var(--border)" }}
        >
          {collapsed ? (
            <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronLeft size={13} style={{ color: "var(--text-muted)" }} />
          )}
        </button>
      </div>

      {/* Mobile button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-40 w-9 h-9 rounded-xl flex items-center justify-center shadow btn-icon"
        style={{ background: "#FFFCF8", border: "1px solid var(--border)" }}
      >
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(28,17,7,0.35)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full shadow-xl">
            <SidebarBody collapsed={false} onNav={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 btn-icon w-8 h-8"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
