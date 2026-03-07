'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAssignments, useCreateAssignment } from '@/lib/hooks'
import { useBatches } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import { ClipboardList, Plus, Users, Clock, CheckCircle2 } from 'lucide-react'

const TYPES = ['tactics', 'opening', 'endgame', 'analysis', 'game_review']
const TYPE_COLOR: Record<string, string> = { tactics: '#A78BFA', opening: '#60A5FA', endgame: '#D4AF37', analysis: '#4ADE80', game_review: '#F472B6' }

export default function CoachAssignmentsPage() {
  const { user } = useAuth()
  const { data: assignments = [], isLoading } = useAssignments({})
  const { data: batches = [] } = useBatches()
  const create = useCreateAssignment()

  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'tactics', batchId: '', dueDate: '' })

  if (isLoading) return <PageLoading />

  const filtered = filter === 'all' ? assignments : assignments.filter((a: any) => a.status === filter)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync({ ...form, coachId: user?.id })
    setShowModal(false)
    setForm({ title: '', description: '', type: 'tactics', batchId: '', dueDate: '' })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-[#A78BFA]" />Assignments</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm"><Plus size={15} />Create Assignment</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[#A78BFA]">{assignments.length}</div><div className="text-xs text-[var(--text-muted)]">Total</div></div>
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[var(--amber)]">{assignments.filter((a: any) => !a.submissions_count).length}</div><div className="text-xs text-[var(--text-muted)]">Active</div></div>
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[#4ADE80]">{assignments.filter((a: any) => a.submissions_count > 0).length}</div><div className="text-xs text-[var(--text-muted)]">With Submissions</div></div>
      </div>

      <div className="flex gap-1 card p-1 rounded-xl w-fit">
        {['all', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#A78BFA]/15 text-[#A78BFA]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No assignments yet" subtitle="Create your first assignment for your students"
          action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm">Create Assignment</button>} /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => {
            const color = TYPE_COLOR[a.type] || 'var(--text-mid)'
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge text-xs" style={{ background: `${color}15`, color }}>{a.type}</span>
                    </div>
                    <h3 className="font-semibold">{a.title}</h3>
                    {a.description && <p className="text-sm text-[var(--text-mid)] mt-1 line-clamp-2">{a.description}</p>}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                      {a.batch_name && <span className="flex items-center gap-1"><Users size={11} />{a.batch_name}</span>}
                      {a.due_date && <span className="flex items-center gap-1"><Clock size={11} />Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                      {a.submissions_count !== undefined && <span className="flex items-center gap-1"><CheckCircle2 size={11} />{a.submissions_count} submitted</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} title="Create Assignment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Title</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Assignment title" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input resize-none h-20" placeholder="Instructions for students..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input capitalize">
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Batch</label>
            <select value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })} className="input">
              <option value="">All my students</option>
              {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>}
    </div>
  )
}
