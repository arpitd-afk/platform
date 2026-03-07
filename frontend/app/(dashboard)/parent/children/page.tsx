'use client'
import { useAuth } from '@/lib/auth-context'
import { useMyChildren, useChildrenProgress } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { Users, Star, TrendingUp, Puzzle, Swords } from 'lucide-react'

const COLORS = ['#D4AF37', '#60A5FA', '#4ADE80', '#F472B6', '#A78BFA']

export default function ParentChildrenPage() {
  const { user } = useAuth()
  const { data: children = [], isLoading } = useMyChildren()
  const { data: progress = [] } = useChildrenProgress(user?.id)

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Users size={22} className="text-[#A78BFA]" />My Children</h1>

      {children.length === 0 ? (
        <div className="card">
          <EmptyState title="No children linked" subtitle="Contact your academy admin to link your children's accounts" />
        </div>
      ) : children.map((child: any, ci: number) => {
        const prog = progress.find((p: any) => p.id === child.id)
        const color = COLORS[ci % COLORS.length]
        const assignPct = prog?.assignments_total > 0 ? Math.round((prog.assignments_done / prog.assignments_total) * 100) : 0
        return (
          <div key={child.id} className="card p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-display"
                  style={{ background: `${color}20`, color }}>{child.name?.[0]}</div>
                <div>
                  <h2 className="text-xl font-semibold">{child.name}</h2>
                  <div className="text-sm text-[var(--text-muted)] mt-0.5">{child.academy_name}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="badge-gray">{child.batch_name || 'No batch'}</span>
                    {child.coach_name && <span className="text-[var(--text-muted)]">Coach: {child.coach_name}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold" style={{ color }}>{child.rating || 1200}</div>
                <div className="text-xs text-[var(--text-muted)]">ELO Rating</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: 'Games Played', v: prog?.games_played || 0, icon: Swords, c: '#60A5FA' },
                { l: 'Puzzles Solved', v: prog?.puzzles_correct || 0, icon: Puzzle, c: '#A78BFA' },
                { l: 'Homework Done', v: `${assignPct}%`, icon: TrendingUp, c: '#4ADE80' },
                { l: 'Current Rating', v: child.rating || 1200, icon: Star, c: color },
              ].map(s => (
                <div key={s.l} className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                  <s.icon size={16} style={{ color: s.c }} className="mx-auto mb-1.5" />
                  <div className="font-bold text-base" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {prog?.assignments_total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-muted)]">Homework completion</span>
                  <span style={{ color }}>{prog.assignments_done}/{prog.assignments_total}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${assignPct}%`, background: color }} /></div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
