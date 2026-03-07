'use client'
import { useState } from 'react'
import { useClassrooms, useCreateClassroom, useBatches } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import Link from 'next/link'
import { BookOpen, Plus, Video, Clock, Users, Calendar, Play, Check } from 'lucide-react'

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  live:      { bg: '#FEE2E2', color: '#DC2626', label: 'LIVE' },
  scheduled: { bg: 'rgba(200,150,30,0.12)', color: '#9A6E00', label: 'Scheduled' },
  completed: { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
}

export default function CoachClassroomPage() {
  const { data: classrooms = [], isLoading } = useClassrooms()
  const { data: batches = [] } = useBatches()
  const create = useCreateClassroom()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', batchId: '', scheduledAt: '', durationMin: 60, description: '' })

  if (isLoading) return <PageLoading />

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setShowModal(false)
    setForm({ title: '', batchId: '', scheduledAt: '', durationMin: 60, description: '' })
  }

  const upcoming = classrooms.filter((c: any) => ['scheduled', 'live'].includes(c.status))
  const past = classrooms.filter((c: any) => c.status === 'completed')

  return (
    <div className="space-y-6 animate-fade-in">
      {showModal && (
        <Modal title="Schedule New Class" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Class Title *</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="input" placeholder="e.g. Sicilian Defense Workshop" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Batch</label>
                <select value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })} className="input">
                  <option value="">Select batch...</option>
                  {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input type="number" min={15} max={180} step={15} value={form.durationMin}
                  onChange={e => setForm({ ...form, durationMin: parseInt(e.target.value) })} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Scheduled At *</label>
              <input required type="datetime-local" value={form.scheduledAt}
                onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="input resize-none h-16" placeholder="Topics to cover, materials needed..." />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={create.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {create.isPending ? 'Scheduling...' : <><Check size={14} />Schedule Class</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <BookOpen size={22} style={{ color: 'var(--amber)' }} />My Classrooms
        </h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} />Schedule Class
        </button>
      </div>

      {classrooms.length === 0 ? (
        <div className="card">
          <EmptyState title="No classes yet" subtitle="Schedule your first class to get started"
            action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2"><Plus size={14} />Schedule Class</button>} />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="section-title mb-3">Upcoming</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcoming.map((c: any) => {
                  const cfg = STATUS_CFG[c.status] || STATUS_CFG.scheduled
                  return (
                    <div key={c.id} className="card p-5 flex flex-col gap-3"
                      style={c.status === 'live' ? { borderColor: '#FCA5A5' } : {}}>
                      <div className="flex items-start justify-between">
                        <span className="badge text-xs" style={{ background: cfg.bg, color: cfg.color }}>
                          {c.status === 'live' && <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 animate-pulse" style={{ background: '#DC2626' }} />}
                          {cfg.label}
                        </span>
                        {c.duration_minutes && (
                          <span className="badge badge-gray text-xs flex items-center gap-1">
                            <Clock size={10} />{c.duration_minutes}min
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{c.title}</h3>
                        {c.batch_name && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.batch_name}</p>}
                      </div>
                      {c.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{c.description}</p>}
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-mid)' }}>
                        {c.scheduled_at && (
                          <>
                            <span className="flex items-center gap-1"><Calendar size={11} />
                              {new Date(c.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="flex items-center gap-1"><Clock size={11} />
                              {new Date(c.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                        {c.student_count > 0 && <span className="flex items-center gap-1"><Users size={11} />{c.student_count}</span>}
                      </div>
                      <Link href={`/classroom/${c.id}`}
                        className={`text-sm flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all ${c.status === 'live' ? 'btn-primary' : 'btn-secondary'}`}>
                        <Video size={14} />{c.status === 'live' ? 'Join Live Class' : 'Start Session'}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="section-title mb-3">Past Classes</h2>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead><tr>
                    <th className="th">Title</th><th className="th">Batch</th>
                    <th className="th">Date</th><th className="th text-center">Duration</th><th className="th text-center">Students</th>
                  </tr></thead>
                  <tbody>
                    {past.slice(0, 10).map((c: any) => (
                      <tr key={c.id} className="tr">
                        <td className="td font-medium text-sm">{c.title}</td>
                        <td className="td"><span className="badge badge-gray text-xs">{c.batch_name || '—'}</span></td>
                        <td className="td text-sm" style={{ color: 'var(--text-muted)' }}>
                          {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="td text-center text-sm" style={{ color: 'var(--text-muted)' }}>{c.duration_minutes || 60}min</td>
                        <td className="td text-center text-sm">{c.student_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
