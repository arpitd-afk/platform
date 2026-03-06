'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, LogIn } from 'lucide-react'

const DEMOS = [
  { role: 'Super Admin',   email: 'superadmin@demo.com', color: '#D4AF37' },
  { role: 'Academy Admin', email: 'academy@demo.com',    color: '#60A5FA' },
  { role: 'Coach',         email: 'coach@demo.com',      color: '#4ADE80' },
  { role: 'Student',       email: 'student@demo.com',    color: '#A78BFA' },
  { role: 'Parent',        email: 'parent@demo.com',     color: '#F472B6' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo1234')
  }

  return (
    <div className="min-h-screen bg-[#0F0E0B] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#141210] flex-col justify-between p-12 border-r border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0F0E0B] font-display font-bold text-lg">
            ♟
          </div>
          <span className="font-display text-xl font-bold">ChessAcademy Pro</span>
        </div>

        <div>
          <blockquote className="font-display text-3xl font-bold text-[#F5F0E8] leading-tight mb-4">
            "Chess is not just a game,<br />it is art, science, and sport."
          </blockquote>
          <p className="text-[#6B6050]">— Garry Kasparov</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { n: '10K+', l: 'Students' },
            { n: '500+', l: 'Academies' },
            { n: '99.9%', l: 'Uptime' },
          ].map(s => (
            <div key={s.l} className="card p-4 text-center">
              <div className="font-display text-2xl font-bold text-[#D4AF37]">{s.n}</div>
              <div className="text-xs text-[#6B6050] mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-[#0F0E0B] font-display font-bold text-xl mx-auto mb-4 lg:hidden">
              ♟
            </div>
            <h1 className="font-display text-2xl font-bold">Welcome back</h1>
            <p className="text-[#6B6050] text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Demo accounts */}
          <div className="card p-4 mb-6">
            <p className="text-xs text-[#6B6050] mb-3">Quick demo — click to fill credentials:</p>
            <div className="flex flex-wrap gap-2">
              {DEMOS.map(d => (
                <button
                  key={d.email}
                  onClick={() => demoLogin(d.email)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.10] hover:border-white/[0.20] transition-colors"
                  style={{ color: d.color }}
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6050] hover:text-[#A09880]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full h-11">
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#0F0E0B]/30 border-t-[#0F0E0B] rounded-full animate-spin" />
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B6050] mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#D4AF37] hover:text-[#F0D060]">
              Register your academy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
