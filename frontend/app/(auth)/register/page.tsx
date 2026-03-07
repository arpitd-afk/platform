'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Crown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'academy_admin', academyName: '' })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('All fields required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try { await register(form) }
    catch (err: any) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,150,30,0.15)', border: '1px solid rgba(200,150,30,0.25)' }}>
              <Crown size={20} style={{ color: 'var(--amber)' }} />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>Chess Academy Pro</span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>Create account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start your 14-day free trial</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">I am a</label>
            <select className="input" value={form.role} onChange={e => up('role', e.target.value)}>
              <option value="academy_admin">Academy Owner / Admin</option>
              <option value="coach">Coach</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Viswanathan Anand" value={form.name} onChange={e => up('name', e.target.value)} autoFocus />
          </div>
          {form.role === 'academy_admin' && (
            <div>
              <label className="label">Academy Name *</label>
              <input className="input" placeholder="Anand Chess Academy" value={form.academyName} onChange={e => up('academyName', e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => up('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input className="input pr-10" type={show ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => up('password', e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create Account</span><ChevronRight size={15} /></>}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--amber)' }}>Sign in</Link>
        </p>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
