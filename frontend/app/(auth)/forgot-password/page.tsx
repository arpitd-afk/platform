'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Crown, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Enter your email')
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch (err: any) {
      // Still show success for security
      setSent(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,150,30,0.15)', border: '1px solid rgba(200,150,30,0.25)' }}>
              <Crown size={16} style={{ color: 'var(--amber)' }} />
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold mb-1">Reset password</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your email and we'll send a reset link</p>
        </div>

        {sent ? (
          <div className="card p-8 text-center space-y-4">
            <CheckCircle2 size={40} className="mx-auto" style={{ color: '#15803D' }} />
            <h3 className="font-semibold">Check your email</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
            <Link href="/login" className="btn-primary w-full block text-center">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center mt-5">
          <Link href="/login" className="text-sm flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
