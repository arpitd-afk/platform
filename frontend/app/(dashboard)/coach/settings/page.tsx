'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useUpdateUser } from '@/lib/hooks'
import Avatar from '@/components/shared/Avatar'
import { Settings, Save, Loader2, Bell, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CoachSettingsPage() {
  const { user, updateUser } = useAuth()
  const update = useUpdateUser()
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState('')
  const [notifyAssignment, setNotifyAssignment] = useState(true)
  const [notifyMessage, setNotifyMessage] = useState(true)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await update.mutateAsync({ id: user.id, data: { name, bio } })
      updateUser({ name })
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Settings size={22} style={{ color: 'var(--amber)' }} />Settings</h1>

      <div className="card p-6 space-y-5">
        <h3 className="section-title">Profile</h3>
        <div className="flex items-center gap-5">
          <Avatar user={user} size="lg" editable onUpdate={avatar => updateUser({ avatar })} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Profile Photo</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Click the photo to upload a new image</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input" value={user?.email || ''} disabled /></div>
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input resize-none h-20" placeholder="Tell students about yourself..." value={bio} onChange={e => setBio(e.target.value)} />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><Bell size={16} style={{ color: 'var(--amber)' }} />Notifications</h3>
        {[
          { label: 'New assignment submissions', value: notifyAssignment, set: setNotifyAssignment },
          { label: 'New messages', value: notifyMessage, set: setNotifyMessage },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text-mid)' }}>{item.label}</span>
            <button onClick={() => item.set(!item.value)}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: item.value ? 'var(--amber)' : 'var(--border-md)' }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: item.value ? 22 : 2 }} />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="section-title">Change Password</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Current Password</label>
            <input className="input" type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7">
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </div>
        <button className="btn-secondary text-sm">Update Password</button>
      </div>
    </div>
  )
}
