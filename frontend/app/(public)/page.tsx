"use client";

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
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const features = [
  {
    icon: BookOpen,
    color: "var(--amber)",
    title: "Live Classrooms",
    desc: "Coach-controlled shared board with real-time annotations and student hand-raising.",
    image: "/images/classroom_mockup.png",
  },
  {
    icon: Trophy,
    color: "#60A5FA",
    title: "Tournaments",
    desc: "Swiss, Round Robin & Knockout with auto-pairing and live ELO updates.",
    image: "/images/tournament_mockup.png",
  },
  {
    icon: Users,
    color: "#F472B6",
    title: "Parent Dashboard",
    desc: "Parents monitor progress, attendance, and homework completion in real time.",
    image: "/images/parent_mockup.png",
  },
];

const plans = [
  {
    name: "Starter",
    Icon: Zap,
    price: "₹999",
    students: "50 students",
    color: "#60A5FA",
    bg: "#60A5FA15",
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
    color: "#A78BFA",
    bg: "#A78BFA15",
    features: [
      "White Label",
      "Custom Domain",
      "API Access",
      "SLA",
      "24/7 Support",
    ],
  },
];

const testimonials = [
  {
    quote: "This platform has revolutionized how we manage our chess academy. The tournament module is a game-changer.",
    author: "GM Praggnanandhaa R",
    role: "International Coach",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pragg",
  },
  {
    quote: "The parent dashboard has significantly reduced our administrative overhead. Parents love the real-time updates.",
    author: "Sarah Johnson",
    role: "Elite Chess Academy Director",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    quote: "The anti-cheat system gives us peace of mind during online tournaments. Truly a professional tool.",
    author: "Vikram Mehta",
    role: "National Arbiter",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
  },
];

const faqs = [
  {
    question: "Is there a free trial?",
    answer: "Yes, we offer a 14-day free trial on all plans. No credit card is required to start.",
  },
  {
    question: "Can I upgrade or downgrade my plan at any time?",
    answer: "Absolutely! You can change your plan whenever you need from your academy settings.",
  },
  {
    question: "Does the platform support multiple coaches?",
    answer: "Yes, even our Starter plan supports up to 3 coaches, and higher plans support more or unlimited coaches.",
  },
  {
    question: "How does the anti-cheat system work?",
    answer: "It uses an automated engine detection system that flags suspicious moves for review by your academy's coaches.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-surface-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none group"
      >
        <span className="text-lg font-bold text-surface-900 group-hover:text-gold transition-colors">{question}</span>
        <ChevronDown
          size={20}
          className={`transition-transform duration-300 text-surface-400 ${isOpen ? "rotate-180 text-gold" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-2 pb-4 text-surface-500 font-medium leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-surface-50">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-20 lg:pt-32 lg:pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 blur-3xl pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/20 rounded-full" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-10 bg-gold-dim border border-gold-light/10 text-gold shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            Empowering 500+ academies worldwide
          </motion.div>
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="relative w-24 h-24 mx-auto mb-8 group"
          >
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gold/20 blur-2xl rounded-full" />
            <Image src="/images/logo.svg" alt="Logo" fill className="object-contain group-hover:scale-110 transition-transform duration-700" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-8 tracking-tight text-surface-900"
          >
            The master system
            <br />
            for <span className="text-gold-gradient">chess education</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg lg:text-xl max-w-2xl mx-auto mb-12 text-surface-500 leading-relaxed font-medium"
          >
            A unified professional platform for managing live classrooms, 
            tournaments, parent communication, and student growth.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
          >
            <Link
              href="/onboarding"
              className="btn-primary text-base px-12 py-4 w-full sm:w-auto shadow-2xl shadow-gold/20 font-extrabold"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary text-base px-12 py-4 w-full sm:w-auto font-extrabold"
            >
              View Pricing
            </Link>
          </motion.div>
          
          <motion.div
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="relative max-w-6xl mx-auto"
          >
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-50 to-transparent z-10" />
            <div className="rounded-[2.5rem] border border-surface-200 shadow-premium overflow-hidden bg-white/50 backdrop-blur p-2">
               <Image 
                src="/images/hero_chess.png" 
                alt="Chess Academy Pro Interface" 
                width={1400} 
                height={800} 
                className="w-full h-auto rounded-[2rem]"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features List */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
        <div className="text-center mb-20">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight text-surface-900">
            Professional tools, professional results
          </h2>
          <p className="text-surface-500 max-w-xl mx-auto text-lg font-medium">
            We've digitized every aspect of the physical chess academy experience, 
            making it accessible from anywhere in the world.
          </p>
        </div>
        
        <div className="space-y-20 lg:space-y-32">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-col lg:items-center gap-16 ${idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"}`}
            >
              <div className="flex-1 space-y-8">
                <div
                  className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-premium"
                  style={{ background: `${f.color}15` }}
                >
                  <f.icon size={32} style={{ color: f.color }} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900">{f.title}</h3>
                <p className="text-surface-500 leading-relaxed text-lg font-medium">{f.desc}</p>
                <Link href="/features" className="group inline-flex items-center gap-2 text-gold font-bold text-lg hover:gap-3 transition-all">
                  See how it works <Zap size={20} className="fill-gold" />
                </Link>
              </div>
              <div className="flex-1 rounded-[2.5rem] border border-surface-200 shadow-premium overflow-hidden bg-white hover:border-gold/30 transition-colors group">
                <Image 
                  src={f.image} 
                  alt={f.title} 
                  width={800} 
                  height={500} 
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700" 
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface-900 text-white py-20 lg:py-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold opacity-5 blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
              Trusted by Grandmasters
            </h2>
            <p className="text-surface-400 max-w-xl mx-auto text-lg font-medium">
              Join the elite circle of academies that choose perfection over compromise.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {testimonials.map((t) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-surface-800 p-10 rounded-[2.5rem] border border-white/5 hover:border-gold/30 transition-all flex flex-col"
              >
                <p className="text-white text-lg font-medium leading-relaxed italic mb-8">"{t.quote}"</p>
                <div className="mt-auto flex items-center gap-4">
                  <Image src={t.avatar} alt={t.author} width={56} height={56} className="rounded-2xl bg-surface-700 p-1" />
                  <div>
                    <h4 className="font-bold text-base">{t.author}</h4>
                    <p className="text-[10px] text-gold uppercase tracking-[0.2em] font-black">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="bg-surface-50 py-20 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight text-surface-900">
            Ready to scale up?
          </h2>
          <p className="text-surface-500 mb-16 text-lg font-medium">Transparent, performance-based pricing for every stage of your growth.</p>
          
          <div className="grid lg:grid-cols-3 gap-10 items-stretch">
            {plans.map((p) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`relative p-12 rounded-[2.5rem] bg-white border flex flex-col transition-all duration-300 hover:shadow-premium ${p.popular ? "border-gold shadow-xl lg:scale-105 z-10" : "border-surface-200"}`}
              >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-black tracking-[0.2em] px-5 py-2 rounded-full uppercase shadow-lg">
                    Most Popular
                  </div>
                )}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm"
                  style={{ background: p.bg }}
                >
                  <p.Icon size={28} style={{ color: p.color }} />
                </div>
                <h3 className="font-display text-3xl font-bold mb-2 text-surface-900">
                  {p.name}
                </h3>
                <p className="text-sm text-surface-400 mb-8 font-bold uppercase tracking-wider">{p.students}</p>
                
                <div className="mb-10 text-left">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-surface-900">{p.price}</span>
                    {p.price !== "Custom" && <span className="text-surface-400 text-lg font-bold">/mo</span>}
                  </div>
                </div>

                <ul className="space-y-5 mb-12 flex-1 text-left">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-4 text-surface-600 font-bold text-sm">
                      <Check size={20} className="flex-shrink-0 text-gold" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`block text-center py-5 rounded-2xl text-base font-black transition-all shadow-md ${p.popular ? "btn-primary hover:shadow-gold/20" : "btn-secondary"}`}
                >
                  {p.price === "Custom" ? "Contact Support" : "Get Started Now"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-6 py-24 lg:py-32">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight text-surface-900">
            Frequently Asked Questions
          </h2>
          <p className="text-surface-500 text-lg font-medium">Everything you need to know about Chess Academy Pro.</p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-surface-200 p-8 lg:p-12 shadow-premium">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto bg-surface-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-gold opacity-10 blur-[120px]" />
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold opacity-10 blur-[120px]" />
           <h2 className="text-white text-3xl lg:text-6xl font-extrabold mb-8 tracking-tight leading-[1.1]">
             Ready to revolutionize your academy?
           </h2>
           <p className="text-surface-400 text-xl lg:text-2xl mb-14 max-w-2xl mx-auto font-medium">
             Join the world's most advanced chess teaching community and start growing today.
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/onboarding" className="btn-primary px-12 py-5 text-xl font-black shadow-2xl shadow-gold/30 w-full sm:w-auto">Start Free Trial</Link>
              <Link href="/contact" className="btn-secondary border-surface-700 text-white hover:bg-surface-800 px-12 py-5 text-xl font-black w-full sm:w-auto">Book a Demo</Link>
           </div>
        </div>
      </section>
    </div>
  );
}
