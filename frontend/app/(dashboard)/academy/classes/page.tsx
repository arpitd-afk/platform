'use client'
import { useState } from 'react'
import { useClassrooms, useBatches, useUsers } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { classroomsAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import Avatar from '@/components/shared/Avatar'
import { BookOpen, Plus, Edit2, Trash2, Loader2, Search, Video, Play, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

function ClassroomModal({ classroom, onClose }: { classroom?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: coaches = [] } = useUsers({ role: 'coach' })
  const { data: batches = [] } = useBatches({})
  const isEdit = !!classroom
  const [form, setForm] = useState({
    title: classroom?.title || '',
    coachId: classroom?.coach_id || '',
    batchId: classroom?.batch_id || '',
    scheduledAt: classroom?.scheduled_at ? new Date(classroom.scheduled_at).toISOString().slice(0, 16) : '',
    duration: classroom?.duration_minutes || 60,
    description: classroom?.description || '',
  })
  const up = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => isEdit
      ? classroomsAPI.update(classroom.id, { title: form.title, coachId: form.coachId, batchId: form.batchId, scheduledAt: form.scheduledAt, durationMinutes: form.duration, description: form.description })
      : classroomsAPI.create({ title: form.title, coachId: form.coachId, batchId: form.batchId, scheduledAt: form.scheduledAt, durationMinutes: form.duration, description: form.description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classrooms'] }); toast.success(isEdit ? 'Class updated!' : 'Class created!'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  return (
    <Modal title={isEdit ? 'Edit Class' : 'Schedule New Class'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Class Title *</label>
          <input className="input" placeholder="e.g. Introduction to Openings" value={form.title} onChange={e => up('title', e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Coach</label>
            <select className="input" value={form.coachId} onChange={e => up('coachId', e.target.value)}>
              <option value="">Select coach...</option>
              {coaches.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch</label>
            <select className="input" value={form.batchId} onChange={e => up('batchId', e.target.value)}>
              <option value="">Select batch...</option>
              {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Scheduled Date & Time</label>
            <input className="input" type="datetime-local" value={form.scheduledAt} onChange={e => up('scheduledAt', e.target.value)} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input className="input" type="number" min={15} max={180} step={15} value={form.duration} onChange={e => up('duration', Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <textarea className="input min-h-[72px] resize-none" placeholder="Topics to cover, materials needed..." value={form.description} onChange={e => up('description', e.target.value)} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutateAsync()} disabled={isPending || !form.title} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Save Changes' : 'Create Class'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ClassesPage() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const qc = useQueryClient()
  const router = useRouter()
  const { data: classrooms = [], isLoading } = useClassrooms({})

  const filtered = classrooms.filter((c: any) => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.batch_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete class "${title}"?`)) return
    setDeleting(id)
    try { await classroomsAPI.update(id, { status: 'cancelled' }); qc.invalidateQueries({ queryKey: ['classrooms'] }); toast.success('Class cancelled') }
    catch { toast.error('Failed') }
    finally { setDeleting(null) }
  }

  const handleStart = async (id: string) => {
    try { await classroomsAPI.start(id); router.push(`/classroom/${id}`) }
    catch { router.push(`/classroom/${id}`) }
  }

  if (isLoading) return <PageLoading />

  const STATUS_COLOR: Record<string,any> = {
    scheduled: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Scheduled' },
    active: { bg: '#DCFCE7', color: '#15803D', label: 'Live' },
    completed: { bg: '#F3F4F6', color: '#6B7280', label: 'Completed' },
    cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {showModal && <ClassroomModal onClose={() => setShowModal(false)} />}
      {editing && <ClassroomModal classroom={editing} onClose={() => setEditing(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2"><BookOpen size={22} style={{ color: 'var(--amber)' }} />Classes</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={15} />Schedule Class</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option><option value="active">Live</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No classes scheduled" subtitle="Schedule your first live class"
          action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm"><Plus size={14} />Schedule Class</button>} /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="th">Class</th><th className="th">Coach</th><th className="th">Batch</th>
              <th className="th">Schedule</th><th className="th text-center">Status</th><th className="th text-center">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((c: any) => {
                const sc = STATUS_COLOR[c.status] || STATUS_COLOR.scheduled
                return (
                  <tr key={c.id} className="tr">
                    <td className="td">
                      <div className="font-medium text-sm">{c.title}</div>
                      {c.description && <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{c.description}</div>}
                    </td>
                    <td className="td">
                      {c.coach_name
                        ? <div className="flex items-center gap-2"><Avatar user={{ name: c.coach_name, role: 'coach' }} size="xs" /><span className="text-sm">{c.coach_name}</span></div>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="td"><span className="badge badge-gray text-xs">{c.batch_name || '—'}</span></td>
                    <td className="td">
                      {c.scheduled_at ? (
                        <div className="text-sm">
                          <div>{new Date(c.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(c.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {c.duration_minutes || 60}min</div>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="td text-center">
                      <span className="badge text-xs" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-center gap-1">
                        {c.status !== 'completed' && c.status !== 'cancelled' && (
                          <button onClick={() => handleStart(c.id)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                            <Play size={11} />{c.status === 'active' ? 'Join' : 'Start'}
                          </button>
                        )}
                        {c.status !== 'active' && (
                          <>
                            <button onClick={() => setEditing(c)} className="btn-icon w-8 h-8"><Edit2 size={13} /></button>
                            {c.status !== 'completed' && (
                              <button onClick={() => handleDelete(c.id, c.title)} disabled={deleting === c.id} className="btn-icon w-8 h-8" style={{ color: '#DC2626' }}>
                                {deleting === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
