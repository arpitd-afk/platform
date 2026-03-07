'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useUpdateUser } from '@/lib/hooks'
import { Settings, Save, Shield, Loader2 } from 'lucide-react'

export default function SuperAdminSettingsPage() {
  const { user, updateUser } = useAuth()
  const update = useUpdateUser()
  const [name, setName] = useState(user?.name || '')
  const handleSave = async () => {
    if (!user?.id) return
    await update.mutateAsync({ id: user.id, data: { name } })
    updateUser({ name })
  }
  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <h1 className="page-title flex items-center gap-2"><Settings size={22} className="text-[var(--text-mid)]" />Platform Settings</h1>
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Admin Profile</h3>
        <div><label className="label">Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="label">Email</label><input className="input" value={user?.email || ''} disabled /></div>
        <button onClick={handleSave} disabled={update.isPending} className="btn-primary flex items-center gap-2">
          {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {update.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2"><Shield size={16} className="text-[#60A5FA]" />Security</h3>
        <p className="text-sm text-[var(--text-mid)]">Super admin accounts have full platform access. Ensure your credentials are secure.</p>
        <button className="btn-secondary text-sm">Change Password</button>
        <button className="btn-danger text-sm">Enable 2FA</button>
      </div>
    </div>
  )
}
