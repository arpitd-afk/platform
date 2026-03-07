'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAssignments, useSubmitAssignment } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import { ClipboardList, Upload, Clock, CheckCircle2, BookOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TYPE_COLOR: Record<string, string> = { Opening: '#60A5FA', Tactics: '#A78BFA', Endgame: '#D4AF37', Analysis: '#4ADE80', puzzle: '#A78BFA', opening: '#60A5FA', endgame: '#D4AF37', analysis: '#4ADE80' }

export default function StudentAssignmentsPage() {
  const { user } = useAuth()
  const { data: assignments = [], isLoading } = useAssignments({ studentId: user?.id })
  const submit = useSubmitAssignment()
  const [filter, setFilter] = useState('all')
  const [submitModal, setSubmitModal] = useState<any>(null)
  const [note, setNote] = useState('')

  if (isLoading) return <PageLoading />

  const filtered = filter === 'all' ? assignments : assignments.filter((a: any) => {
    if (filter === 'pending') return !a.submitted_at && new Date(a.due_date) > new Date()
    if (filter === 'overdue') return !a.submitted_at && new Date(a.due_date) < new Date()
    if (filter === 'submitted') return !!a.submitted_at && !a.grade
    if (filter === 'graded') return !!a.grade
    return true
  })

  const counts = {
    pending:   assignments.filter((a: any) => !a.submitted_at && new Date(a.due_date) > new Date()).length,
    overdue:   assignments.filter((a: any) => !a.submitted_at && new Date(a.due_date) < new Date()).length,
    submitted: assignments.filter((a: any) => a.submitted_at && !a.grade).length,
    graded:    assignments.filter((a: any) => !!a.grade).length,
  }

  const handleSubmit = async () => {
    if (!submitModal) return
    await submit.mutateAsync({ id: submitModal.id, submission: { note, submittedAt: new Date() } })
    setSubmitModal(null); setNote('')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-[#7C3AED]" />Assignments</h1>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Pending',   v: counts.pending,   c: '#D4AF37' },
          { l: 'Overdue',   v: counts.overdue,   c: '#F87171' },
          { l: 'Submitted', v: counts.submitted, c: '#60A5FA' },
          { l: 'Graded',    v: counts.graded,    c: '#4ADE80' },
        ].map(s => (
          <div key={s.l} className="stat-card cursor-pointer" onClick={() => setFilter(s.l.toLowerCase())}>
            <div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-xs text-[var(--text-muted)]">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 card p-1 rounded-xl w-fit">
        {['all', 'pending', 'overdue', 'submitted', 'graded'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#EDE9FE]/15 text-[#7C3AED]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No assignments" subtitle="Nothing here for this filter" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a: any) => {
            const overdue = !a.submitted_at && new Date(a.due_date) < new Date()
            const color = TYPE_COLOR[a.type] || 'var(--text-mid)'
            return (
              <div key={a.id} className={`card p-5 ${overdue ? 'border-red-400/30' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="badge text-xs" style={{ background: `${color}15`, color }}>{a.type}</span>
                      {overdue && <span className="badge-red text-xs">Overdue</span>}
                      {a.submitted_at && !a.grade && <span className="badge-blue text-xs">Submitted</span>}
                      {a.grade && <span className="badge-green text-xs">Graded</span>}
                    </div>
                    <h3 className="font-semibold">{a.title}</h3>
                    {a.description && <p className="text-sm text-[var(--text-mid)] mt-1">{a.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                      {a.coach_name && <span className="flex items-center gap-1"><BookOpen size={11} />Coach: {a.coach_name}</span>}
                      {a.due_date && <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}><Clock size={11} />Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {a.grade && (
                    <div className="text-center bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex-shrink-0">
                      <div className="font-display text-2xl font-bold text-green-400">{a.grade}</div>
                      <div className="text-xs text-[var(--text-muted)]">/ 100</div>
                    </div>
                  )}
                </div>
                {a.feedback && (
                  <div className="mt-4 p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)]">
                    <div className="text-xs font-semibold text-[var(--amber)] mb-1">Coach Feedback</div>
                    <p className="text-sm text-[var(--text-mid)]">{a.feedback}</p>
                  </div>
                )}
                {!a.submitted_at && (
                  <button onClick={() => setSubmitModal(a)} className="btn-primary text-sm mt-4 flex items-center gap-2">
                    <Upload size={14} />Submit Assignment
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!!submitModal && <Modal onClose={() => setSubmitModal(null)} title="Submit Assignment" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-mid)]">{submitModal?.title}</p>
          <div>
            <label className="label">Notes for coach</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              className="input resize-none h-24" placeholder="Add any notes about your submission..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSubmitModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={submit.isPending} className="btn-primary flex-1">
              {submit.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </Modal>}
    </div>
  )
}
