'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, type UserRole } from '@/lib/auth-context'
import { Eye, EyeOff, ChevronRight, UserPlus } from 'lucide-react'

const ROLES = [
  { id: 'academy_admin', label: 'Academy Owner',  desc: 'Manage your chess academy',    icon: '🏛️' },
  { id: 'coach',         label: 'Coach',          desc: 'Teach and track students',     icon: '🎓' },
  { id: 'student',       label: 'Student',        desc: 'Learn and improve at chess',   icon: '♟️' },
  { id: 'parent',        label: 'Parent',         desc: "Monitor your child's progress", icon: '👨‍👩‍👧' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const [step, setStep] = useState(1)
  const [role, setRole]   = useState<UserRole>('student')
  const [form, setForm]   = useState({ name: '', email: '', password: '', academyName: '', academySubdomain: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleRoleNext = () => {
    setStep(2)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        ...form,
        role,
        academyName: role === 'academy_admin' ? form.academyName : undefined,
        academySubdomain: role === 'academy_admin' ? form.academySubdomain : undefined,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0E0B] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-[#0F0E0B] font-display font-bold text-xl mx-auto mb-4">♟</div>
          <h1 className="font-display text-2xl font-bold">Create Account</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-[#D4AF37] w-8' : 'bg-white/[0.10] w-6'}`} />
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <p className="text-center text-[#A09880] text-sm mb-5">Select your role to get started</p>
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id as UserRole)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                  ${role === r.id
                    ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#F5F0E8]'
                    : 'border-white/[0.08] bg-[#1A1710] text-[#A09880] hover:border-white/[0.15]'
                  }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{r.label}</div>
                  <div className="text-xs opacity-70">{r.desc}</div>
                </div>
                {role === r.id && <div className="ml-auto w-2 h-2 rounded-full bg-[#D4AF37]" />}
              </button>
            ))}
            <button onClick={handleRoleNext} className="btn-primary w-full h-11 mt-4">
              Continue <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" className="input" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className="input" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className="input pr-11"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6050]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {role === 'academy_admin' && (
              <>
                <div>
                  <label className="label">Academy Name</label>
                  <input value={form.academyName} onChange={e => {
                    const v = e.target.value
                    set('academyName', v)
                    set('academySubdomain', v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                  }} placeholder="My Chess Academy" className="input" required />
                </div>
                <div>
                  <label className="label">Subdomain</label>
                  <div className="flex items-center gap-0">
                    <input value={form.academySubdomain} onChange={e => set('academySubdomain', e.target.value)} placeholder="my-academy" className="input rounded-r-none border-r-0 flex-1" required />
                    <span className="input rounded-l-none border-l-0 text-[#6B6050] whitespace-nowrap">.chessacademy.pro</span>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 h-11">
                {loading ? <div className="w-4 h-4 border-2 border-[#0F0E0B]/30 border-t-[#0F0E0B] rounded-full animate-spin" /> : <><UserPlus size={16} /> Create Account</>}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-[#6B6050] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#D4AF37] hover:text-[#F0D060]">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
