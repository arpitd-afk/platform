"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/src/lib/auth-context";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  Crown,
  Zap,
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const DEMOS = [
  {
    label: "Super Admin",
    email: "superadmin@demo.com",
    role: "super_admin",
    color: "#60A5FA",
    icon: Shield,
    desc: "Complete system control",
  },
  {
    label: "Academy Admin",
    email: "academy@demo.com",
    role: "academy_admin",
    color: "var(--amber)",
    icon: Crown,
    desc: "Growth & management",
  },
  {
    label: "Coach",
    email: "coach@demo.com",
    role: "coach",
    color: "#4ADE80",
    icon: GraduationCap,
    desc: "Teaching & training",
  },
  {
    label: "Student",
    email: "student@demo.com",
    role: "student",
    color: "#F472B6",
    icon: BookOpen,
    desc: "Learning journey",
  },
  {
    label: "Parent",
    email: "parent@demo.com",
    role: "parent",
    color: "#A78BFA",
    icon: Users,
    desc: "Progress monitoring",
  },
];

const CHESS_PIECES = ["♔", "♕", "♖", "♗", "♘", "♙"];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (
    e?: React.FormEvent,
    overrideEmail?: string,
    overridePass?: string,
  ) => {
    e?.preventDefault();
    const em = overrideEmail || email;
    const pw = overridePass || password;
    if (!em || !pw) return toast.error("Enter your credentials");
    if (overrideEmail) setDemoLoading(overrideEmail);
    else setLoading(true);
    try {
      await login(em, pw);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex overflow-hidden selection:bg-gold/30">
      {/* Background Motifs */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        {mounted &&
          CHESS_PIECES.map((piece, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute text-surface-900 select-none font-serif"
              style={{
                fontSize: `${120 + i * 40}px`,
                left: `${(i * 18) % 100}%`,
                top: `${(i * 24) % 100}%`,
              }}
            >
              {piece}
            </motion.div>
          ))}
      </div>

      {/* Left Wall: Branding & Teasers */}
      <div className="hidden lg:flex flex-col w-[450px] bg-surface-900 relative p-12 overflow-hidden border-r border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold opacity-10 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold opacity-5 blur-[100px]" />

        {/* Top Branding */}
        <Link href="/" className="relative z-10 flex items-center gap-4 group">
          <div className="relative w-12 h-12 group-hover:scale-110 transition-transform duration-500 shadow-premium rounded-2xl overflow-hidden bg-gold p-2">
            <Image src="/images/logo.svg" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <div className="font-display font-black text-xl text-white tracking-tight">
              Chess Academy Pro
            </div>
            <div className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">
              Master System
            </div>
          </div>
        </Link>

        {/* Middle content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center space-y-12">
          <div className="space-y-6">
            <h2 className="text-white text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
              Empowering the <br />
              <span className="text-gold-gradient">world&apos;s best</span>{" "}
              academies.
            </h2>
            <p className="text-surface-400 text-lg font-medium leading-relaxed max-w-sm">
              Join the professional standard for chess education, management,
              and global competition.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {["Tournaments", "Live Classrooms", "Analytics", "Anti-Cheat"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-surface-400 text-xs font-bold uppercase tracking-widest"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Bottom Demo Accounts */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Zap size={14} className="text-gold" />
            <span className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em]">
              Quick Demo Access
            </span>
          </div>
          <div className="grid gap-3">
            {DEMOS.map((d) => {
              const Icon = d.icon;
              const isLoading = demoLoading === d.email;
              return (
                <button
                  key={d.email}
                  onClick={() => handleLogin(undefined, d.email, "demo1234")}
                  disabled={!!demoLoading}
                  className="w-full bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/[0.08] p-4 rounded-2xl flex items-center gap-4 transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-premium"
                    style={{ background: `${d.color}15`, color: d.color }}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-black text-white">
                      {d.label}
                    </div>
                    <div className="text-[10px] text-surface-500 font-bold">
                      {d.desc}
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-surface-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  />
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-center text-surface-600 font-bold uppercase tracking-widest">
            Demo Password: <span className="text-white">demo1234</span>
          </p>
        </div>
      </div>

      {/* Right Wall: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50 relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold opacity-[0.02] blur-[150px] pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-12 relative z-10">
          {/* Mobile Branding */}
          <Link
            href="/"
            className="lg:hidden flex items-center justify-center gap-4 group mb-12"
          >
            <div className="relative w-12 h-12 shadow-xl rounded-xl overflow-hidden bg-gold p-2">
              <Image src="/images/logo.svg" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-display font-black text-xl text-surface-900 tracking-tight">
              Chess Academy Pro
            </span>
          </Link>

          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-surface-900 lg:text-5xl">
              Welcome back.
            </h1>
            <p className="text-surface-500 text-lg font-medium">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] ml-1">
                Email address
              </label>
              <div className="relative">
                <input
                  className="input h-14 bg-white border-surface-200 font-bold text-surface-900 shadow-sm focus:shadow-premium transition-all"
                  type="email"
                  placeholder="you@academy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-black text-gold uppercase tracking-[0.1em] hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  className="input h-14 bg-white border-surface-200 font-bold text-surface-900 shadow-sm focus:shadow-premium transition-all pr-12"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-300 hover:text-gold transition-colors"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-2xl shadow-gold/20 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="pt-8 border-t border-surface-200/60 lg:hidden">
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest text-center mb-6">
              Quick Demo Login
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  onClick={() => handleLogin(undefined, d.email, "demo1234")}
                  disabled={!!demoLoading}
                  className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 bg-white hover:border-gold/30 transition-all shadow-sm"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${d.color}10`, color: d.color }}
                  >
                    {demoLoading === d.email ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <d.icon size={14} />
                    )}
                  </div>
                  <span className="text-[10px] font-black text-surface-900">
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] font-black text-surface-300 uppercase tracking-[0.3em] pt-12">
            © 2025 Chess Academy Pro · Premium Enterprise Standard
          </p>
        </div>
      </div>
    </div>
  );
}
