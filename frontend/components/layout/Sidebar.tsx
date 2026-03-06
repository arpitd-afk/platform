"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  LayoutDashboard,
  Users,
  BookOpen,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Building2,
  GraduationCap,
  Puzzle,
  MessageSquare,
  CreditCard,
  Shield,
  Globe,
  Swords,
  FileText,
  Calendar,
  Star,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useAuth, type UserRole } from "../../lib/auth-context";
import { useState } from "react";
import clsx from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string | number;
  children?: NavItem[];
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { label: "Academies", href: "/super-admin/academies", icon: Building2 },
    { label: "Users", href: "/super-admin/users", icon: Users },
    {
      label: "Billing & Plans",
      href: "/super-admin/billing",
      icon: CreditCard,
    },
    { label: "Content", href: "/super-admin/content", icon: FileText },
    { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
    { label: "Anti-Cheat", href: "/super-admin/anticheat", icon: Shield },
    { label: "Notifications", href: "/super-admin/notifications", icon: Bell },
    { label: "Settings", href: "/super-admin/settings", icon: Settings },
  ],
  academy_admin: [
    { label: "Dashboard", href: "/academy", icon: LayoutDashboard },
    { label: "Students", href: "/academy/students", icon: GraduationCap },
    { label: "Coaches", href: "/academy/coaches", icon: Users },
    { label: "Classes", href: "/academy/classes", icon: BookOpen },
    { label: "Tournaments", href: "/academy/tournaments", icon: Trophy },
    { label: "Analytics", href: "/academy/analytics", icon: BarChart3 },
    { label: "Billing", href: "/academy/billing", icon: CreditCard },
    { label: "Announcements", href: "/academy/announcements", icon: Bell },
    { label: "Settings", href: "/academy/settings", icon: Settings },
  ],
  coach: [
    { label: "Dashboard", href: "/coach", icon: LayoutDashboard },
    { label: "My Students", href: "/coach/students", icon: GraduationCap },
    { label: "Classroom", href: "/coach/classroom", icon: BookOpen },
    { label: "Assignments", href: "/coach/assignments", icon: FileText },
    { label: "Tournaments", href: "/coach/tournaments", icon: Trophy },
    { label: "Game Analysis", href: "/coach/analysis", icon: BarChart3 },
    { label: "Schedule", href: "/coach/schedule", icon: Calendar },
    { label: "Messages", href: "/coach/messages", icon: MessageSquare },
    { label: "Settings", href: "/coach/settings", icon: Settings },
  ],
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Play Chess", href: "/game", icon: Swords },
    { label: "Lessons", href: "/student/lessons", icon: BookOpen },
    { label: "Puzzles", href: "/student/puzzles", icon: Puzzle },
    { label: "Assignments", href: "/student/assignments", icon: FileText },
    { label: "Tournaments", href: "/student/tournaments", icon: Trophy },
    { label: "My Progress", href: "/student/progress", icon: BarChart3 },
    { label: "Leaderboard", href: "/student/leaderboard", icon: Star },
    { label: "Messages", href: "/student/messages", icon: MessageSquare },
  ],
  parent: [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { label: "My Children", href: "/parent/children", icon: Users },
    { label: "Progress", href: "/parent/progress", icon: BarChart3 },
    { label: "Attendance", href: "/parent/attendance", icon: Calendar },
    { label: "Homework", href: "/parent/homework", icon: FileText },
    { label: "Payments", href: "/parent/payments", icon: CreditCard },
    { label: "Messages", href: "/parent/messages", icon: MessageSquare },
    { label: "Settings", href: "/parent/settings", icon: Settings },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "#D4AF37",
  academy_admin: "#60A5FA",
  coach: "#4ADE80",
  student: "#F472B6",
  parent: "#A78BFA",
};

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  academy_admin: "Academy Admin",
  coach: "Coach",
  student: "Student",
  parent: "Parent",
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role] || [];
  const roleColor = ROLE_COLORS[user.role];

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen flex flex-col bg-[#0D0C09] border-r border-white/[0.06] sticky top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06] flex-shrink-0">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 flex-1"
            >
              <div
                className="w-7 h-7 rounded-lg flex-shrink-0"
                style={{ background: roleColor }}
              >
                <Crown
                  size={14}
                  className="w-full h-full p-[5px] text-[#0F0E0B]"
                />
              </div>
              <span className="font-display font-semibold text-sm truncate">
                ChessAcademy
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-7 h-7 rounded-lg flex-shrink-0"
              style={{ background: roleColor }}
            >
              <Crown
                size={14}
                className="w-full h-full p-[5px] text-[#0F0E0B]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/[0.05] text-[#6B6050] hover:text-[#A09880] transition-all flex-shrink-0"
        >
          {collapsed ? <Menu size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-[#0F0E0B] flex-shrink-0"
              style={{ background: roleColor }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: roleColor }}
                />
                <span className="text-[#6B6050] truncate">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 relative group",
                isActive
                  ? "text-[#F5F0E8]"
                  : "text-[#A09880] hover:text-[#F5F0E8] hover:bg-white/[0.04]",
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: `${roleColor}15` }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <item.icon
                size={17}
                className={clsx(
                  "flex-shrink-0 relative z-10",
                  isActive && "text-[#F5F0E8]",
                )}
                style={isActive ? { color: roleColor } : {}}
              />
              {!collapsed && (
                <span className="text-sm relative z-10 truncate">
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full relative z-10"
                  style={{ background: `${roleColor}20`, color: roleColor }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/[0.06]">
        {collapsed ? (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center p-2.5 rounded-lg text-[#6B6050] hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Logout"
          >
            <LogOut size={17} />
          </button>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#6B6050] hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
