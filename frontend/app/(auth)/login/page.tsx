'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Crown, Zap, Users, GraduationCap, BookOpen, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMOS = [
  { label: 'Super Admin', email: 'superadmin@demo.com', role: 'super_admin', color: '#7C3AED', icon: Shield, desc: 'Full platform control' },
  { label: 'Academy Admin', email: 'academy@demo.com', role: 'academy_admin', color: '#C8961E', icon: Crown, desc: 'Manage your academy' },
  { label: 'Coach', email: 'coach@demo.com', role: 'coach', color: '#15803D', icon: GraduationCap, desc: 'Train students' },
  { label: 'Student', email: 'student@demo.com', role: 'student', color: '#1D4ED8', icon: BookOpen, desc: 'Learn & compete' },
  { label: 'Parent', email: 'parent@demo.com', role: 'parent', color: '#BE185D', icon: Users, desc: 'Track progress' },
]

const CHESS_PIECES = ['♔', '♕', '♖', '♗', '♘', '♙']

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePass?: string) => {
    e?.preventDefault()
    const em = overrideEmail || email
    const pw = overridePass || password
    if (!em || !pw) return toast.error('Enter your credentials')
    if (overrideEmail) setDemoLoading(overrideEmail)
    else setLoading(true)
    try { await login(em, pw) }
    catch (err: any) { toast.error(err.response?.data?.message || 'Login failed') }
    finally { setLoading(false); setDemoLoading(null) }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Animated background chess pieces */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {mounted && CHESS_PIECES.map((piece, i) => (
          <div
            key={i}
            className="absolute select-none"
            style={{
              fontSize: `${40 + i * 18}px`,
              opacity: 0.04,
              left: `${10 + i * 15}%`,
              top: `${5 + (i % 3) * 30}%`,
              animation: `float${i % 3} ${8 + i * 2}s ease-in-out infinite`,
              color: 'var(--amber)',
            }}
          >
            {piece}
          </div>
        ))}
      </div>

      {/* Left panel — branding + demo accounts */}
      <div
        className="hidden lg:flex flex-col w-[420px] flex-shrink-0 relative"
        style={{
          background: 'linear-gradient(180deg, #1c1107 0%, #2a1a0e 50%, #1c1107 100%)',
          borderRight: '1px solid rgba(200,150,30,0.15)',
        }}
      >
        {/* Gold glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,150,30,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,150,30,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(200,150,30,0.15)', border: '1px solid rgba(200,150,30,0.3)' }}>
              <Crown size={20} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <div className="font-display font-bold text-sm" style={{ color: '#F5F0E8' }}>Chess Academy</div>
              <div className="text-[10px] font-medium tracking-wider uppercase" style={{ color: 'rgba(212,175,55,0.7)' }}>Pro Platform</div>
            </div>
          </div>

          {/* Hero section */}
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div>
              <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.3))' }}>♔</div>
              <h2 className="font-display text-2xl font-bold leading-tight mb-3" style={{ color: '#F5F0E8' }}>
                Master the art of chess education
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.5)' }}>
                The all-in-one platform for academies, coaches, and students to learn, play, and grow together.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['Live Classes', 'Tournaments', 'AI Analysis', 'Progress Tracking'].map(f => (
                <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(200,150,30,0.1)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(200,150,30,0.15)' }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Demo accounts */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={12} style={{ color: '#D4AF37' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.6)' }}>Quick Access — Demo Accounts</p>
            </div>
            {DEMOS.map(d => {
              const Icon = d.icon
              const isLoading = demoLoading === d.email
              return (
                <button
                  key={d.email}
                  onClick={() => handleLogin(undefined, d.email, 'demo1234')}
                  disabled={!!demoLoading}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-200 text-left group"
                  style={{
                    background: 'rgba(245,240,232,0.04)',
                    border: '1px solid rgba(245,240,232,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${d.color}15`
                    e.currentTarget.style.borderColor = `${d.color}40`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(245,240,232,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(245,240,232,0.06)'
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ background: `${d.color}18`, color: d.color }}>
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px]" style={{ color: '#F5F0E8' }}>{d.label}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(245,240,232,0.35)' }}>{d.desc}</div>
                  </div>
                  <div className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'rgba(245,240,232,0.3)' }}>→</div>
                </button>
              )
            })}
            <p className="text-[10px] text-center pt-1" style={{ color: 'rgba(245,240,232,0.25)' }}>
              Password: <span className="font-mono" style={{ color: 'rgba(212,175,55,0.5)' }}>demo1234</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[380px]" style={mounted ? { animation: 'fadeIn 0.4s ease-out both' } : { opacity: 0 }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(200,150,30,0.15)', border: '1px solid rgba(200,150,30,0.25)' }}>
              <Crown size={20} style={{ color: 'var(--amber)' }} />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>Chess Academy Pro</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Welcome back</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs hover:underline transition-colors" style={{ color: 'var(--amber)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  className="input pr-10"
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7">
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm mt-2"
              style={{ fontSize: '14px' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Mobile demo accounts */}
          <div className="lg:hidden mt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Demo Accounts</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map(d => {
                const Icon = d.icon
                const isLoading = demoLoading === d.email
                return (
                  <button
                    key={d.email}
                    onClick={() => handleLogin(undefined, d.email, 'demo1234')}
                    disabled={!!demoLoading}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: `${d.color}08`, color: d.color, border: `1px solid ${d.color}18` }}
                  >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                    {d.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>
              All demos use password: <strong className="font-mono">demo1234</strong>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
            © 2024 Chess Academy Pro. All rights reserved.
          </p>
        </div>
      </div>

      {/* Floating piece keyframes */}
      <style jsx>{`
        @keyframes float0 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(4deg); }
        }
      `}</style>
    </div>
  )
}
