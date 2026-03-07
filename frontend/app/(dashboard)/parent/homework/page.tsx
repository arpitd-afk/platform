'use client'
import { useAuth } from '@/lib/auth-context'
import { useMyChildren } from '@/lib/hooks'
import { useQuery } from '@tanstack/react-query'
import { assignmentsAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react'

const COLORS = ['#D4AF37', '#60A5FA', '#4ADE80', '#F472B6']

export default function ParentHomeworkPage() {
  const { data: children = [], isLoading } = useMyChildren()
  const { data: assignments = [] } = useQuery({
    queryKey: ['parent-assignments'],
    queryFn: () => Promise.all(children.map((c: any) =>
      assignmentsAPI.list({ studentId: c.id }).then((r: any) => r.data.assignments.map((a: any) => ({ ...a, childName: c.name, childId: c.id })))
    )).then(results => results.flat()),
    enabled: children.length > 0,
    staleTime: 30000,
  })

  if (isLoading) return <PageLoading />

  const pending = assignments.filter((a: any) => !a.submitted_at)
  const submitted = assignments.filter((a: any) => a.submitted_at && !a.grade)
  const graded = assignments.filter((a: any) => a.grade)

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-[#A78BFA]" />Homework</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Pending', v: pending.length, c: '#D4AF37' },
          { l: 'Submitted', v: submitted.length, c: '#60A5FA' },
          { l: 'Graded', v: graded.length, c: '#4ADE80' },
        ].map(s => (
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div><div className="text-xs text-[var(--text-muted)]">{s.l}</div></div>
        ))}
      </div>

      {assignments.length === 0 ? (
        <div className="card"><EmptyState title="No assignments yet" subtitle="Your children's assignments will appear here" /></div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any, i: number) => {
            const ci = children.findIndex((c: any) => c.id === a.childId)
            const color = COLORS[ci % COLORS.length]
            const overdue = !a.submitted_at && a.due_date && new Date(a.due_date) < new Date()
            return (
              <div key={a.id} className={`card p-5 ${overdue ? 'border-red-400/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="badge text-xs capitalize" style={{ background: `${color}15`, color }}>{a.childName?.split(' ')[0]}</span>
                      <span className="badge-gray text-xs capitalize">{a.type}</span>
                      {a.grade && <span className="badge-green text-xs">Graded: {a.grade}/100</span>}
                      {a.submitted_at && !a.grade && <span className="badge-blue text-xs">Submitted</span>}
                      {overdue && <span className="badge-red text-xs">Overdue</span>}
                    </div>
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    {a.due_date && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)]">
                        <Clock size={11} />Due: {new Date(a.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {a.grade && (
                    <div className="text-center bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                      <div className="font-display text-xl font-bold text-green-400">{a.grade}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">/ 100</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
