'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useUpdateUser } from '@/lib/hooks'
import Avatar from '@/components/shared/Avatar'
import { Settings, Save, Loader2, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ParentSettingsPage() {
  const { user, updateUser } = useAuth()
  const update = useUpdateUser()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [classReminders, setClassReminders] = useState(true)
  const [progressReports, setProgressReports] = useState(true)

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await update.mutateAsync({ id: user.id, data: { name } })
      updateUser({ name })
    } catch { toast.error('Failed') }
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
            <p className="font-medium text-sm">Profile Photo</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Click to upload</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input" value={user?.email || ''} disabled /></div>
          <div><label className="label">Phone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><Bell size={16} style={{ color: 'var(--amber)' }} />Notifications</h3>
        {[
          { label: 'Class reminders (1 hour before)', value: classReminders, set: setClassReminders },
          { label: 'Weekly progress reports', value: progressReports, set: setProgressReports },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text-mid)' }}>{item.label}</span>
            <button onClick={() => item.set(!item.value)}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: item.value ? 'var(--amber)' : 'var(--border-md)' }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: item.value ? 22 : 2 }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
