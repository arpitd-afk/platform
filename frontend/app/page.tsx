"use client";

import Link from "next/link";
import {
  Check,
  Zap,
  Building2,
  Crown,
  Users,
  BookOpen,
  Trophy,
  Shield,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    color: "var(--amber)",
    title: "Live Classrooms",
    desc: "Coach-controlled shared board with real-time annotations and student hand-raising.",
  },
  {
    icon: Trophy,
    color: "#1D4ED8",
    title: "Tournaments",
    desc: "Swiss, Round Robin & Knockout with auto-pairing and live ELO updates.",
  },
  {
    icon: BarChart3,
    color: "#15803D",
    title: "Deep Analytics",
    desc: "Track every student's rating, accuracy, and attendance with coach dashboards.",
  },
  {
    icon: Users,
    color: "#BE185D",
    title: "Parent Dashboard",
    desc: "Parents monitor progress, attendance, and homework completion in real time.",
  },
  {
    icon: Shield,
    color: "#7C3AED",
    title: "Anti-Cheat System",
    desc: "Automated engine detection flags suspicious games for coach review.",
  },
  {
    icon: MessageSquare,
    color: "var(--amber)",
    title: "Integrated Chat",
    desc: "Students, coaches, and parents message each other without leaving the platform.",
  },
];

const plans = [
  {
    name: "Starter",
    Icon: Zap,
    price: "₹999",
    students: "50 students",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    features: [
      "3 Coaches",
      "Live Classrooms",
      "Puzzle Trainer",
      "Email Support",
    ],
  },
  {
    name: "Academy",
    Icon: Building2,
    price: "₹2,499",
    students: "200 students",
    color: "var(--amber)",
    bg: "var(--amber-dim)",
    popular: true,
    features: [
      "Unlimited Coaches",
      "Tournaments",
      "Parent Dashboard",
      "Anti-Cheat",
      "Priority Support",
    ],
  },
  {
    name: "Enterprise",
    Icon: Crown,
    price: "Custom",
    students: "Unlimited",
    color: "#7C3AED",
    bg: "#EDE9FE",
    features: [
      "White Label",
      "Custom Domain",
      "API Access",
      "SLA",
      "24/7 Support",
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="bg-surface-50 text-surface-900 min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gold-dim border border-gold-light/20 shadow-sm">
              <Crown size={18} className="text-gold" />
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight">
              Chess Academy Pro
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-surface-500">
            {["Features", "Pricing", "Blog", "Contact"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="hover:text-gold transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm px-4">
              Login
            </Link>
            <Link href="/onboarding" className="btn-primary text-sm px-5 py-2">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 lg:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm mb-8 bg-gold-dim border border-gold-light/10 text-gold"
        >
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          Trusted by 500+ chess academies across India
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-8"
        >
          The complete platform
          <br />
          for <span className="text-gold-gradient">chess education</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-12 text-surface-500 leading-relaxed"
        >
          Live classrooms, tournament hosting, student analytics, parent
          dashboards, and anti-cheat — everything your academy needs in one
          place.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/onboarding"
            className="btn-primary text-base px-10 py-3.5 w-full sm:w-auto shadow-lg shadow-gold/20"
          >
            Start Free Trial
          </Link>
          <Link
            href="/login"
            className="btn-secondary text-base px-10 py-3.5 w-full sm:w-auto"
          >
            View Demo
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs sm:text-sm mt-6 text-surface-400"
        >
          14-day free trial · No credit card required · Cancel anytime
        </motion.p>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Everything your academy needs
          </h2>
          <p className="text-surface-500 max-w-xl mx-auto">
            Built specifically for chess coaching, with tools that understand
            the nuances of the royal game.
          </p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              whileHover={{ 
                y: -8, 
                transition: { duration: 0.3, ease: "easeOut" } 
              }}
              className="group p-8 rounded-3xl bg-white border border-surface-200 hover:border-gold/30 hover:shadow-premium transition-all duration-300"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300"
                style={{ background: `${f.color}10` }}
              >
                <f.icon size={26} style={{ color: f.color }} />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">{f.title}</h3>
              <p className="text-surface-500 leading-relaxed text-sm lg:text-base">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="bg-surface-100 border-y border-surface-200 py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-surface-500">Start free, grow at your pace</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((p) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`relative p-8 sm:p-10 rounded-3xl bg-white border ${p.popular ? "border-gold shadow-2xl scale-105 z-10" : "border-surface-200"}`}
              >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full uppercase">
                    Most Popular
                  </div>
                )}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: p.bg }}
                >
                  <p.Icon size={24} style={{ color: p.color }} />
                </div>
                <h3 className="font-display text-2xl font-bold mb-1">
                  {p.name}
                </h3>
                <p className="text-sm text-surface-400 mb-6">{p.students}</p>
                <div className="mb-8">
                  <span
                    className="text-4xl font-bold font-display"
                    style={{ color: p.color }}
                  >
                    {p.price}
                  </span>
                  {p.price !== "Custom" && (
                    <span className="text-surface-400 ml-1 text-sm font-medium">
                      /mo
                    </span>
                  )}
                </div>
                <ul className="space-y-4 mb-10">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-sm text-surface-600"
                    >
                      <Check
                        size={16}
                        className="flex-shrink-0"
                        style={{ color: p.color }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3.5 rounded-2xl text-sm font-bold transition-all ${p.popular ? "btn-primary" : "btn-secondary"}`}
                >
                  {p.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
          Ready to elevate your academy?
        </h2>
        <p className="text-lg sm:text-xl text-surface-500 mb-12 max-w-2xl mx-auto">
          Join 500+ academies already using Chess Academy Pro to deliver a
          world-class learning experience.
        </p>
        <Link
          href="/onboarding"
          className="btn-primary text-lg px-12 py-4 shadow-xl shadow-gold/20"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <Crown size={20} className="text-gold" />
            <span className="font-display font-bold text-lg">
              Chess Academy Pro
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-surface-400">
            {["Features", "Pricing", "Blog", "Contact"].map((l) => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="hover:text-gold transition-colors"
              >
                {l}
              </Link>
            ))}
          </div>
          <p className="text-sm text-surface-400">
            © 2025 Chess Academy Pro · All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
