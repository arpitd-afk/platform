import Link from 'next/link'
import { Check, Zap, Building2, Crown, Users, BookOpen, Trophy, Shield, BarChart3, MessageSquare } from 'lucide-react'

const features = [
  { icon: BookOpen,   color: '#C8961E', title: 'Live Classrooms',   desc: 'Coach-controlled shared board with real-time annotations and student hand-raising.' },
  { icon: Trophy,     color: '#1D4ED8', title: 'Tournaments',        desc: 'Swiss, Round Robin & Knockout with auto-pairing and live ELO updates.' },
  { icon: BarChart3,  color: '#15803D', title: 'Deep Analytics',     desc: 'Track every student\'s rating, accuracy, and attendance with coach dashboards.' },
  { icon: Users,      color: '#BE185D', title: 'Parent Dashboard',   desc: 'Parents monitor progress, attendance, and homework completion in real time.' },
  { icon: Shield,     color: '#7C3AED', title: 'Anti-Cheat System',  desc: 'Automated engine detection flags suspicious games for coach review.' },
  { icon: MessageSquare, color: '#C8961E', title: 'Integrated Chat', desc: 'Students, coaches, and parents message each other without leaving the platform.' },
]

const plans = [
  { name: 'Starter', Icon: Zap, price: '₹999', students: '50 students', color: '#1D4ED8', bg: '#DBEAFE', features: ['3 Coaches', 'Live Classrooms', 'Puzzle Trainer', 'Email Support'] },
  { name: 'Academy', Icon: Building2, price: '₹2,499', students: '200 students', color: '#9A6E00', bg: 'rgba(200,150,30,0.12)', popular: true, features: ['Unlimited Coaches', 'Tournaments', 'Parent Dashboard', 'Anti-Cheat', 'Priority Support'] },
  { name: 'Enterprise', Icon: Crown, price: 'Custom', students: 'Unlimited', color: '#7C3AED', bg: '#EDE9FE', features: ['White Label', 'Custom Domain', 'API Access', 'SLA', '24/7 Support'] },
]

export default function Home() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: '#FFFCF8', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,150,30,0.15)', border: '1px solid rgba(200,150,30,0.25)' }}>
              <Crown size={18} style={{ color: 'var(--amber)' }} />
            </div>
            <span className="font-display text-base font-bold">Chess Academy Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Link href="/features" className="hover:text-[var(--text)] transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-[var(--text)] transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-[var(--text)] transition-colors">Blog</Link>
            <Link href="/contact" className="hover:text-[var(--text)] transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Login</Link>
            <Link href="/onboarding" className="btn-primary text-sm">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-6" style={{ background: 'rgba(200,150,30,0.10)', border: '1px solid rgba(200,150,30,0.20)', color: 'var(--amber)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--amber)' }} />
          Trusted by 500+ chess academies across India
        </div>
        <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: 'var(--text)' }}>
          The complete platform<br />for <span className="text-gold-gradient">chess education</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-muted)' }}>
          Live classrooms, tournament hosting, student analytics, parent dashboards, and anti-cheat — everything your academy needs in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/onboarding" className="btn-primary text-base px-8 py-3">Start Free Trial</Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3">View Demo</Link>
        </div>
        <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>14-day free trial · No credit card required · Cancel anytime</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="font-display text-3xl font-bold text-center mb-3">Everything your academy needs</h2>
        <p className="text-center text-sm mb-12" style={{ color: 'var(--text-muted)' }}>Built specifically for chess coaching, not a generic tool</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}12` }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: '#FFFCF8', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center mb-3">Simple pricing</h2>
          <p className="text-center text-sm mb-12" style={{ color: 'var(--text-muted)' }}>Start free, grow at your pace</p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.name} className={`card p-7 relative ${p.popular ? 'shadow-lg' : ''}`} style={p.popular ? { border: '2px solid var(--amber)' } : {}}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full" style={{ background: 'var(--amber)' }}>
                    MOST POPULAR
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: p.bg }}>
                  <p.Icon size={18} style={{ color: p.color }} />
                </div>
                <h3 className="font-display text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{p.students}</p>
                <div className="mb-6">
                  <span className="font-display text-3xl font-bold" style={{ color: p.color }}>{p.price}</span>
                  {p.price !== 'Custom' && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/mo</span>}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
                      <Check size={14} style={{ color: p.color, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${p.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  {p.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-4xl font-bold mb-4">Ready to elevate your academy?</h2>
        <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>Join 500+ academies already using Chess Academy Pro</p>
        <Link href="/onboarding" className="btn-primary text-base px-10 py-3">Get Started Free</Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: '#FFFCF8' }} className="py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown size={16} style={{ color: 'var(--amber)' }} />
            <span className="font-display font-bold text-sm">Chess Academy Pro</span>
          </div>
          <div className="flex gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            {['Features', 'Pricing', 'Blog', 'Contact'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:underline">{l}</Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2025 Chess Academy Pro</p>
        </div>
      </footer>
    </div>
  )
}
