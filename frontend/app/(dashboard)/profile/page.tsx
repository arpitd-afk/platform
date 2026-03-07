'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useUpdateUser } from '@/lib/hooks'
import Avatar from '@/components/shared/Avatar'
import { Save, Loader2, Shield, Star, Swords, Puzzle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const update = useUpdateUser()
  const [name, setName]     = useState(user?.name || '')
  const [phone, setPhone]   = useState('')
  const [bio, setBio]       = useState('')
  const [saving, setSaving] = useState(false)

  const ROLE_COLOR: Record<string,string> = { super_admin:'#7C3AED', academy_admin:'#9A6E00', coach:'#15803D', student:'#1D4ED8', parent:'#BE185D' }
  const roleColor = ROLE_COLOR[user?.role || ''] || '#9A6E00'

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await update.mutateAsync({ id: user.id, data: { name } })
      updateUser({ name })
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="page-title">My Profile</h1>

      {/* Avatar card */}
      <div className="card p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <Avatar user={user} size="xl" editable onUpdate={avatar => updateUser({ avatar })} />
          <span className="absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30` }}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{user?.name}</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click the photo to change your profile picture</p>
        </div>
        {user?.rating && (
          <div className="ml-auto text-center hidden sm:block">
            <div className="text-3xl font-display font-bold" style={{ color: 'var(--amber)' }}>{user.rating}</div>
            <div className="text-xs mt-0.5 flex items-center gap-1 justify-center" style={{ color: 'var(--text-muted)' }}>
              <Star size={11} style={{ color: 'var(--amber)' }} />ELO Rating
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      {user?.rating && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { l: 'ELO Rating', v: user.rating, icon: Star, c: 'var(--amber)' },
            { l: 'Games Played', v: '—', icon: Swords, c: '#1D4ED8' },
            { l: 'Puzzles Solved', v: '—', icon: Puzzle, c: '#15803D' },
          ].map(s => (
            <div key={s.l} className="stat-card items-center text-center">
              <s.icon size={18} style={{ color: s.c }} />
              <div className="text-2xl font-display font-bold" style={{ color: s.c }}>{s.v}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edit form */}
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Academy</label>
            <input className="input" value={user?.academyName || '—'} disabled />
          </div>
        </div>
        <div>
          <label className="label">Bio (optional)</label>
          <textarea className="input min-h-[80px] resize-none" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us a bit about yourself..." />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Security */}
      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><Shield size={16} style={{ color: 'var(--amber)' }} />Security</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">New Password</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>
        </div>
        <button className="btn-secondary text-sm">Update Password</button>
      </div>
    </div>
  )
}
