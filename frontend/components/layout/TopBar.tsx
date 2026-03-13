"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications, useMarkAllRead, useUnreadCount } from "@/lib/hooks";
import Avatar from "@/components/shared/Avatar";
import Link from "next/link";
import {
  Bell,
  Search,
  LogOut,
  X,
  ChevronDown,
  Star,
  Command,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function TopBar() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: notifications = [] } = useNotifications({ limit: 6 });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAll = useMarkAllRead();
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const ROLE_COLORS: Record<string, string> = {
    super_admin: "text-purple-600",
    academy_admin: "text-gold",
    coach: "text-green-600",
    student: "text-blue-600",
    parent: "text-pink-600",
  };
  const roleColorClass = ROLE_COLORS[user?.role || ""] || "text-gold";

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 glass border-b border-surface-200 z-20">
      {/* Search */}
      <div className="relative hidden md:flex items-center group">
        <div className="absolute left-3 p-1 rounded-md text-surface-400 group-focus-within:text-gold transition-colors">
          <Search size={15} />
        </div>
        <input
          placeholder="Search..."
          className="bg-surface-50 border border-surface-200 rounded-xl pl-10 pr-12 py-2 text-sm w-64 focus:w-80 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all duration-300"
        />
        <div className="absolute right-3 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-surface-200 bg-white text-[10px] text-surface-400 font-medium">
          <Command size={10} />K
        </div>
      </div>

      {/* Mobile Spacer (for menu toggle) */}
      <div className="lg:hidden w-10 h-10" />

      <div className="flex items-center gap-2 sm:gap-4">
        {/* ELO badge */}
        {user?.rating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold-dim border border-gold-light/10"
          >
            <Star size={12} className="text-gold fill-gold" />
            <span className="text-xs font-bold font-mono text-gold leading-none">
              {user.rating}
            </span>
          </motion.div>
        )}

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={`
              relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
              ${notifOpen ? "bg-surface-100 text-gold" : "text-surface-500 hover:bg-surface-50 hover:text-surface-900"}
            `}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#FFFCF8]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-surface-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
                  <span className="font-bold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAll.mutate()}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[min(32rem,70vh)] overflow-y-auto overscroll-contain">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center text-surface-300">
                        <Bell size={24} />
                      </div>
                      <p className="text-sm text-surface-400">
                        No new notifications
                      </p>
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`
                          px-5 py-4 transition-colors cursor-pointer border-b border-surface-50 last:border-0
                          ${!n.is_read ? "bg-gold-dim/30" : "hover:bg-surface-50"}
                        `}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${!n.is_read ? "font-bold" : "text-surface-700"}`}
                            >
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-xs mt-1 text-surface-500 line-clamp-2 leading-relaxed">
                                {n.body}
                              </p>
                            )}
                            <p className="text-[10px] mt-2 font-medium text-surface-400">
                              {formatDistanceToNow(new Date(n.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          {!n.is_read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-gold shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block px-5 py-3 text-center text-xs font-bold text-gold hover:bg-gold-dim border-t border-surface-100 transition-colors"
                >
                  See all notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`
              flex items-center gap-3 pl-1.5 pr-2 sm:pr-4 py-1.5 rounded-xl transition-all duration-200
              ${profileOpen ? "bg-surface-100" : "hover:bg-surface-50"}
            `}
          >
            <Avatar
              user={user}
              size="sm"
              className="ring-2 ring-transparent group-hover:ring-gold/20 transition-all"
            />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-bold leading-tight group-hover:text-gold transition-colors">
                {user?.name?.split(" ")[0]}
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-tighter ${roleColorClass}`}
              >
                {user?.role?.replace("_", " ")}
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-surface-400 transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-56 bg-white border border-surface-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-surface-100 mb-1">
                  <div className="font-bold text-sm truncate">{user?.name}</div>
                  <div className="text-[10px] text-surface-400 truncate">
                    {user?.email}
                  </div>
                </div>

                {[
                  { href: "/profile", label: "My Profile" },
                  { href: "/notifications", label: "Notifications" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center px-5 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 hover:text-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="mt-2 pt-2 border-t border-surface-100 px-2 space-y-1">
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-surface-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
