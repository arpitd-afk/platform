"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    text: "New student enrolled in your class",
    time: "2m ago",
    unread: true,
  },
  {
    id: 2,
    text: 'Tournament "Spring Open" starts in 1 hour',
    time: "58m ago",
    unread: true,
  },
  {
    id: 3,
    text: "Assignment submitted by Arjun Sharma",
    time: "2h ago",
    unread: false,
  },
  {
    id: 4,
    text: "Monthly performance report is ready",
    time: "1d ago",
    unread: false,
  },
];

export function TopBar() {
  const { user, logout } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-14 flex items-center px-6 border-b border-white/[0.06] bg-[#0F0E0B] gap-4 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050]"
          />
          <input
            type="text"
            placeholder="Search students, games, tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F5F0E8] placeholder:text-[#6B6050] focus:outline-none focus:border-[#D4AF37]/30 transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6050] text-xs bg-white/[0.05] px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => {
              setShowNotifs((v) => !v);
              setShowProfile(false);
            }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[#6B6050] hover:text-[#A09880] hover:bg-white/[0.05] transition-all"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 card shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                  <span className="text-sm font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge-gold text-xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${
                        n.unread ? "bg-[#D4AF37]/3" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.unread && (
                          <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className={n.unread ? "" : "ml-3.5"}>
                          <p className="text-xs text-[#F5F0E8]">{n.text}</p>
                          <p className="text-xs text-[#6B6050] mt-0.5">
                            {n.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 text-center">
                  <Link
                    href="/notifications"
                    className="text-xs text-[#D4AF37] hover:text-[#F0D060]"
                  >
                    View all notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile((v) => !v);
              setShowNotifs(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center text-xs font-semibold text-[#0F0E0B]">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium leading-none">
                {user?.name}
              </div>
            </div>
            <ChevronDown size={13} className="text-[#6B6050]" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 card shadow-2xl z-50 py-1 overflow-hidden"
              >
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#A09880] hover:text-[#F5F0E8] hover:bg-white/[0.05] transition-colors"
                >
                  <User size={15} />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#A09880] hover:text-[#F5F0E8] hover:bg-white/[0.05] transition-colors"
                >
                  <Settings size={15} />
                  Settings
                </Link>
                <div className="border-t border-white/[0.07] my-1" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
