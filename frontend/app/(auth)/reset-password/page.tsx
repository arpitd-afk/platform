'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Crown, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      // await authAPI.resetPassword(token!, password)
      toast.success('Password reset successfully!')
      router.push('/login')
    } catch { toast.error('Reset failed. Link may have expired.') }
    finally { setLoading(false) }
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="card p-8 text-center max-w-sm">
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Invalid or expired reset link.</p>
        <Link href="/forgot-password" className="btn-primary">Request new link</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Set new password</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your new password below</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input className="input pr-10" type={show ? 'text' : 'password'} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7">
                {show ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input className="input" type="password" placeholder="Same as above" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
