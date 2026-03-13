"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUnreadCount } from "@/lib/hooks";
import Avatar from "@/components/shared/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
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
  Activity,
  LogOut,
  Bell,
  Video,
  GraduationCap,
  Layers,
  Wallet,
  UserCheck,
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

const ROLE_INFO: Record<string, { color: string; label: string }> = {
  super_admin: { color: "text-purple-600", label: "Super Admin" },
  academy_admin: { color: "text-gold", label: "Academy Admin" },
  coach: { color: "text-green-600", label: "Coach" },
  student: { color: "text-blue-600", label: "Student" },
  parent: { color: "text-pink-600", label: "Parent" },
};

function NavLink({ href, icon: Icon, label, collapsed, unread }: any) {
  const pathname = usePathname();
  const active =
    href === pathname || (href.length > 10 && pathname.startsWith(href));

  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 mb-0.5
          ${collapsed ? "justify-center" : ""}
          ${
            active
              ? "bg-gold-dim text-gold shadow-sm shadow-gold/5 border border-gold/10"
              : "text-surface-500 hover:bg-surface-100/50 hover:text-surface-900"
          }
        `}
      >
        <Icon size={18} className={`flex-shrink-0 ${active ? "animate-pulse" : ""}`} />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
        {!collapsed && unread > 0 && (
          <span className="min-w-[20px] h-5 px-1 rounded-full bg-gold text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </motion.div>
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
  const roleInfo = ROLE_INFO[user?.role || ""] || {
    color: "text-gold",
    label: user?.role,
  };

  return (
    <div
      className={`
        flex flex-col h-full glass border-r border-surface-200 transition-all duration-300
        ${collapsed ? "w-[72px]" : "w-[260px]"}
      `}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 py-6 h-16 border-b border-surface-100 ${collapsed ? "px-3 justify-center" : "px-4"}`}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gold-dim border border-gold-light/10 flex-shrink-0">
          <Crown size={18} className="text-gold" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="font-display font-bold text-sm leading-tight">
              Chess Academy
            </div>
            <div
              className={`text-[10px] uppercase font-bold tracking-wider ${roleInfo.color}`}
            >
              {roleInfo.label}
            </div>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none space-y-1">
        <NavLink
          href="/notifications"
          icon={Bell}
          label="Notifications"
          collapsed={collapsed}
          unread={unreadCount}
        />
        {navGroups.map((group) => (
          <div key={group.group} className="pt-2">
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 px-3 py-2">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <div key={item.href} onClick={onNav}>
                  <NavLink
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    collapsed={collapsed}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + Logout */}
      <div className="p-3 border-t border-surface-100/50 z-10">
        <Link
          href="/profile"
          onClick={onNav}
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <Avatar user={user} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user?.name}</div>
              <div className="text-[10px] text-surface-400 truncate">
                {user?.email}
              </div>
            </div>
          )}
        </Link>
        <button
          onClick={logout}
          className={`
            flex items-center gap-3 mt-2 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all
            text-surface-500 hover:bg-red-50 hover:text-red-600
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
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
      <div className="hidden lg:flex relative h-screen flex-shrink-0 z-30">
        <SidebarBody collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3.5 top-8 w-7 h-7 rounded-full flex items-center justify-center bg-white border border-surface-200 shadow-sm z-40 hover:bg-gold hover:border-gold hover:text-white transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Mobile button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-surface-200 shadow-md text-surface-600"
      >
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative h-full shadow-2xl"
            >
              <SidebarBody
                collapsed={false}
                onNav={() => setMobileOpen(false)}
              />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
