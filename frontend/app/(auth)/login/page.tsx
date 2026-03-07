'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Crown } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMOS = [
  { label: 'Super Admin', email: 'superadmin@demo.com', role: 'super_admin', color: '#7C3AED' },
  { label: 'Academy Admin', email: 'academy@demo.com', role: 'academy_admin', color: '#9A6E00' },
  { label: 'Coach', email: 'coach@demo.com', role: 'coach', color: '#15803D' },
  { label: 'Student', email: 'student@demo.com', role: 'student', color: '#1D4ED8' },
  { label: 'Parent', email: 'parent@demo.com', role: 'parent', color: '#BE185D' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePass?: string) => {
    e?.preventDefault()
    const em = overrideEmail || email
    const pw = overridePass || password
    if (!em || !pw) return toast.error('Enter your credentials')
    setLoading(true)
    try { await login(em, pw) }
    catch (err: any) { toast.error(err.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-10 flex-shrink-0"
        style={{ background: '#FFFCF8', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(200,150,30,0.15)', border: '1px solid rgba(200,150,30,0.25)' }}>
            <Crown size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <span className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Chess Academy Pro</span>
        </div>

        <div className="space-y-6">
          <div className="text-5xl">♔</div>
          <h2 className="font-display text-3xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
            The complete platform for chess education
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Manage students, run live classes, host tournaments, and track every player's growth — all in one place.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Demo Accounts</p>
          {DEMOS.map(d => (
            <button key={d.email} onClick={() => handleLogin(undefined, d.email, 'demo1234')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
              onMouseEnter={e => { (e.currentTarget as any).style.borderColor = d.color; (e.currentTarget as any).style.background = `${d.color}08` }}
              onMouseLeave={e => { (e.currentTarget as any).style.borderColor = 'var(--border)'; (e.currentTarget as any).style.background = 'var(--bg-card)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: `${d.color}15`, color: d.color }}>
                {d.label[0]}
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{d.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.email}</div>
              </div>
            </button>
          ))}
          <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>All demos use password: <strong>demo1234</strong></p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Welcome back</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--amber)' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input className="input pr-10" type={show ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7">
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--amber)' }}>Sign up</Link>
          </p>

          {/* Mobile demos */}
          <div className="lg:hidden mt-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-center mb-2" style={{ color: 'var(--text-muted)' }}>Try a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.slice(0, 4).map(d => (
                <button key={d.email} onClick={() => handleLogin(undefined, d.email, 'demo1234')}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{ background: `${d.color}10`, color: d.color, border: `1px solid ${d.color}25` }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
