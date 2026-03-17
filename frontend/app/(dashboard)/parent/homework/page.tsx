"use client";
import { useState } from 'react'
import { useAuth } from '@/src/lib/auth-context'
import { useMyChildren } from '@/src/lib/hooks'
import { useQuery } from '@tanstack/react-query'
import { assignmentsAPI } from '@/src/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, MessageSquare, TrendingUp, Target, BookOpen, Award, Swords, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#D4AF37', '#60A5FA', '#4ADE80', '#F472B6']

const TYPE_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  tactics: { color: "#7C3AED", bg: "#EDE9FE", icon: Target },
  opening: { color: "#1D4ED8", bg: "#DBEAFE", icon: BookOpen },
  endgame: { color: "#9A6E00", bg: "rgba(200,150,30,0.12)", icon: Award },
  analysis: { color: "#15803D", bg: "#DCFCE7", icon: Swords },
  game_review: { color: "#BE185D", bg: "#FCE7F3", icon: Eye },
  custom: { color: "var(--text-mid)", bg: "var(--bg-subtle)", icon: ClipboardList },
};

export default function ParentHomeworkPage() {
  const { data: children = [], isLoading: isChildrenLoading } = useMyChildren()
  const [filter, setFilter] = useState('all')

  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['parent-assignments'],
    queryFn: () => Promise.all(children.map((c: any) =>
      assignmentsAPI.list({ studentId: c.id }).then((r: any) => r.data.assignments.map((a: any) => ({ ...a, childName: c.name, childId: c.id })))
    )).then(results => results.flat()),
    enabled: children.length > 0,
    staleTime: 30000,
  })

  if (isChildrenLoading || (children.length > 0 && isAssignmentsLoading)) return <PageLoading />

  const now = new Date()

  const counts = {
    pending: assignments.filter((a: any) => !a.submitted_at && (!a.due_date || new Date(a.due_date) > now)).length,
    overdue: assignments.filter((a: any) => !a.submitted_at && a.due_date && new Date(a.due_date) < now).length,
    submitted: assignments.filter((a: any) => a.submitted_at && !a.graded_at).length,
    graded: assignments.filter((a: any) => !!a.graded_at).length,
  }

  const filtered = filter === 'all' ? assignments : assignments.filter((a: any) => {
    if (filter === 'pending') return !a.submitted_at && (!a.due_date || new Date(a.due_date) > now)
    if (filter === 'overdue') return !a.submitted_at && a.due_date && new Date(a.due_date) < now
    if (filter === 'submitted') return a.submitted_at && !a.graded_at
    if (filter === 'graded') return !!a.graded_at
    return true
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-[#A78BFA]" />Homework</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'pending', label: 'Pending', value: counts.pending, color: '#9A6E00', bg: 'rgba(200,150,30,0.08)' },
          { key: 'overdue', label: 'Overdue', value: counts.overdue, color: '#DC2626', bg: '#FEF2F2' },
          { key: 'submitted', label: 'Submitted', value: counts.submitted, color: '#1D4ED8', bg: '#EFF6FF' },
          { key: 'graded', label: 'Graded', value: counts.graded, color: '#15803D', bg: '#F0FDF4' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
            className="stat-card text-left transition-all"
            style={filter === s.key ? { borderColor: s.color, background: s.bg } : {}}
          >
            <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'graded', label: 'Graded' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={
              filter === f.key
                ? { background: "#7C3AED", color: "white", borderColor: "#7C3AED" }
                : { background: "var(--bg-subtle)", color: "var(--text-muted)", borderColor: "var(--border)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No assignments found" subtitle="Nothing here for this filter" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a: any) => {
            const ci = children.findIndex((c: any) => c.id === a.childId)
            const color = COLORS[ci % COLORS.length]
            const cfg = TYPE_CFG[a.type] || TYPE_CFG.custom
            const Icon = cfg.icon
            const isOverdue = !a.submitted_at && a.due_date && new Date(a.due_date) < now
            const isSubmitted = !!a.submitted_at
            const isGraded = !!a.graded_at

            return (
              <div key={a.id} className="card p-5" style={isOverdue ? { borderColor: '#FCA5A5' } : isGraded ? { borderColor: '#BBF7D0' } : {}}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="badge text-xs capitalize" style={{ background: `${color}15`, color }}>{a.childName?.split(' ')[0]}</span>
                      <span className="badge text-xs" style={{ background: cfg.bg, color: cfg.color }}>{a.type?.replace("_", " ")}</span>
                      {isOverdue && <span className="badge text-xs flex items-center gap-1" style={{ background: "#FEE2E2", color: "#DC2626" }}><AlertTriangle size={9} />Overdue</span>}
                      {isGraded && <span className="badge text-xs" style={{ background: "#DCFCE7", color: "#15803D" }}>✅ Graded: {a.grade}/100</span>}
                      {isSubmitted && !isGraded && <span className="badge text-xs" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>⏳ Submitted</span>}
                    </div>

                    <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{a.title}</h3>
                    {a.description && <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{a.description}</p>}

                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {a.coach_name && <span className="flex items-center gap-1"><BookOpen size={10} />{a.coach_name}</span>}
                      {a.due_date && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'font-medium' : ''}`} style={{ color: isOverdue ? '#DC2626' : 'var(--text-muted)' }}>
                          <Clock size={10} />Due {new Date(a.due_date).toLocaleDateString()}
                          {!isSubmitted && !isOverdue && ` · ${formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}`}
                        </span>
                      )}
                      {a.submitted_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={10} />Submitted {formatDistanceToNow(new Date(a.submitted_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {isGraded && a.feedback && (
                      <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(200,150,30,0.06)", border: "1px solid rgba(200,150,30,0.15)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--amber)" }}><MessageSquare size={10} className="inline mr-1" />Coach Feedback</p>
                        <p className="text-sm line-clamp-2" style={{ color: "var(--text)" }}>{a.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
