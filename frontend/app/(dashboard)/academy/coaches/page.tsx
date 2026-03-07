'use client'
import { useState } from 'react'
import { useUsers } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import CreateUserModal from '@/components/shared/CreateUserModal'
import Avatar from '@/components/shared/Avatar'
import Modal from '@/components/shared/Modal'
import { UserCheck, Search, Plus, Trash2, Edit2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function EditCoachModal({ coach, onClose }: { coach: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(coach.name)
  const [phone, setPhone] = useState(coach.phone || '')
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => usersAPI.update(coach.id, { name, phone }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Coach updated'); onClose() },
    onError: () => toast.error('Update failed'),
  })
  return (
    <Modal title="Edit Coach" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="label">Full Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="label">Email</label><input className="input" value={coach.email} disabled /></div>
        <div><label className="label">Phone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutateAsync()} disabled={isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function CoachesPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const qc = useQueryClient()
  const { data: coaches = [], isLoading } = useUsers({ role: 'coach' })

  const filtered = coaches.filter((c: any) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove coach "${name}"? This will not delete their account.`)) return
    setDeleting(id)
    try {
      await usersAPI.update(id, { is_active: false })
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Coach removed')
    } catch { toast.error('Failed') } finally { setDeleting(null) }
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-5 animate-fade-in">
      {showCreate && <CreateUserModal role="coach" onClose={() => setShowCreate(false)} />}
      {editing && <EditCoachModal coach={editing} onClose={() => setEditing(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><UserCheck size={22} style={{ color: 'var(--amber)' }} />Coaches</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={15} />Add Coach</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search coaches..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="stat-card flex-row items-center gap-2 px-4 py-2.5">
          <span className="text-2xl font-display font-bold" style={{ color: 'var(--amber)' }}>{coaches.length}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Coaches</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No coaches yet" subtitle="Add your first coach to get started"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary text-sm"><Plus size={14} />Add Coach</button>} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((coach: any) => (
            <div key={coach.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar user={coach} size="md" />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{coach.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{coach.email}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(coach)} className="btn-icon w-8 h-8"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(coach.id, coach.name)} disabled={deleting === coach.id} className="btn-icon w-8 h-8 text-red-400 hover:bg-red-50">
                    {deleting === coach.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{coach.student_count || 0}</div>
                  <div>Students</div>
                </div>
                <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{coach.classes_count || 0}</div>
                  <div>Classes</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`badge text-xs ${coach.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                  {coach.is_active !== false ? 'Active' : 'Inactive'}
                </span>
                {coach.last_active_at && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Last active {new Date(coach.last_active_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
