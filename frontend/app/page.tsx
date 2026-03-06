"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Crown,
  BookOpen,
  Trophy,
  Users,
  Brain,
  BarChart3,
  ChevronRight,
  Star,
  Shield,
  Zap,
  Globe,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Live Classrooms",
    desc: "Real-time synchronized boards with voice, video, and annotation tools.",
    color: "#D4AF37",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    desc: "Stockfish-powered evaluation with natural language coaching insights.",
    color: "#60A5FA",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    desc: "Swiss, Round Robin, Arena & Knockout with automatic pairing.",
    color: "#4ADE80",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Deep metrics on openings, tactics, endgames, and time management.",
    color: "#F472B6",
  },
  {
    icon: Users,
    title: "Academy Management",
    desc: "Full student enrollment, attendance, billing, and parent dashboards.",
    color: "#A78BFA",
  },
  {
    icon: Shield,
    title: "Anti-Cheat System",
    desc: "Engine similarity detection and move timing analysis keeps games fair.",
    color: "#FB923C",
  },
];

const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "1,200+", label: "Academies" },
  { value: "2M+", label: "Games Played" },
  { value: "98%", label: "Satisfaction Rate" },
];

const plans = [
  {
    name: "Starter",
    price: "₹2,999",
    period: "/month",
    desc: "Perfect for individual coaches",
    features: [
      "Up to 50 students",
      "Live classroom boards",
      "Basic analytics",
      "Puzzle trainer",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Academy",
    price: "₹9,999",
    period: "/month",
    desc: "For growing chess academies",
    features: [
      "Up to 500 students",
      "Multiple coaches",
      "Tournament management",
      "AI analysis engine",
      "Parent dashboard",
      "Custom subdomain",
      "Priority support",
    ],
    cta: "Get Started",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large organizations",
    features: [
      "Unlimited students",
      "White-label branding",
      "Custom domain",
      "API access",
      "Dedicated server",
      "SLA guarantee",
      "24/7 support",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F0E0B] text-[#F5F0E8] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#0F0E0B]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center">
              <Crown size={18} className="text-[#0F0E0B]" />
            </div>
            <span className="font-display font-semibold text-lg">
              ChessAcademy <span className="text-[#D4AF37]">Pro</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-[#A09880]">
            <Link
              href="#features"
              className="hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link href="#about" className="hover:text-white transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Background chess pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-conic-gradient(#D4AF37 0% 25%, transparent 0% 50%)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0E0B]/50 to-[#0F0E0B]" />

        {/* Glow */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/5 rounded-full blur-[80px]" />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 text-sm text-[#D4AF37] mb-8">
              <Zap size={14} />
              <span>The Future of Chess Education</span>
            </div>

            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-8">
              Train Smarter.
              <br />
              <span className="text-gradient-gold">Teach Better.</span>
              <br />
              Win More.
            </h1>

            <p className="text-xl text-[#A09880] max-w-2xl mx-auto mb-10 leading-relaxed">
              The complete SaaS platform for chess academies — live classrooms,
              AI coaching, tournament management, and deep performance analytics
              in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-[#D4AF37] text-[#0F0E0B] font-semibold px-8 py-4 rounded-xl hover:bg-[#F0D060] transition-all text-base"
              >
                Start Free 14-Day Trial
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/demo"
                className="flex items-center gap-2 btn-secondary text-base px-8 py-4 rounded-xl"
              >
                Watch Demo
                <ChevronRight size={18} />
              </Link>
            </div>

            <p className="text-sm text-[#6B6050] mt-5">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-display font-bold text-gradient-gold">
                  {s.value}
                </div>
                <div className="text-sm text-[#6B6050] mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything Your Academy Needs
          </h2>
          <p className="text-[#A09880] text-lg max-w-xl mx-auto">
            From live teaching to AI-powered analysis — all in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card p-7 group hover:border-white/[0.12] transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: `${f.color}15`,
                  border: `1px solid ${f.color}25`,
                }}
              >
                <f.icon size={22} style={{ color: f.color }} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-[#A09880] text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 bg-[#0D0C09] border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">
              Built for Every Role
            </h2>
            <p className="text-[#A09880]">
              Separate dashboards optimized for Super Admins, Academy Owners,
              Coaches, Students, and Parents.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {["Super Admin", "Academy", "Coach", "Student", "Parent"].map(
              (role, i) => (
                <div
                  key={i}
                  className="card p-4 text-center hover:border-[#D4AF37]/30 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4AF37]/20 transition-colors">
                    <Crown size={18} className="text-[#D4AF37]" />
                  </div>
                  <div className="text-sm font-medium">{role}</div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-[#A09880] text-lg">
            GST-ready billing with monthly and yearly options.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                p.highlight
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/5 shadow-glow-gold"
                  : "card"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#D4AF37] text-[#0F0E0B] text-xs font-bold px-4 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <div className="text-sm font-medium text-[#A09880] mb-1">
                  {p.name}
                </div>
                <div className="font-display text-4xl font-bold">
                  {p.price}
                  {p.period && (
                    <span className="text-lg font-normal text-[#A09880]">
                      {p.period}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#6B6050] mt-1">{p.desc}</div>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2.5 text-sm">
                    <Star size={13} className="text-[#D4AF37] flex-shrink-0" />
                    <span className="text-[#A09880]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-3 px-5 rounded-xl font-semibold text-sm transition-all ${
                  p.highlight
                    ? "bg-[#D4AF37] text-[#0F0E0B] hover:bg-[#F0D060]"
                    : "btn-secondary"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 via-[#D4AF37]/10 to-[#D4AF37]/5" />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <Globe size={48} className="text-[#D4AF37] mx-auto mb-6 opacity-60" />
          <h2 className="font-display text-5xl font-bold mb-6">
            Ready to Transform Your Academy?
          </h2>
          <p className="text-[#A09880] text-lg mb-10">
            Join 1,200+ chess academies already using ChessAcademy Pro to
            deliver world-class online chess education.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#0F0E0B] font-semibold px-10 py-4 rounded-xl hover:bg-[#F0D060] transition-all text-lg"
          >
            Get Started Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center">
                <Crown size={15} className="text-[#0F0E0B]" />
              </div>
              <span className="font-display font-semibold">
                ChessAcademy Pro
              </span>
            </div>
            <div className="text-sm text-[#6B6050]">
              © 2024 ChessAcademy Pro. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-[#6B6050]">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
