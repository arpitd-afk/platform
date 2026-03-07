'use client'
import { useAuth } from '@/lib/auth-context'
import { useMyChildren, useChildrenProgress } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[var(--text-muted)] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.stroke }}>{p.name}: {p.value}</p>)}</div> : null

const COLORS = ['#D4AF37', '#60A5FA', '#4ADE80', '#F472B6', '#A78BFA']

export default function ParentProgressPage() {
  const { user } = useAuth()
  const { data: children = [], isLoading } = useMyChildren()
  const { data: progress = [] } = useChildrenProgress(user?.id)

  if (isLoading) return <PageLoading />

  const ratingData = [
    { m: '3mo', ...Object.fromEntries(children.map((c: any, i: number) => [c.name?.split(' ')[0], Math.max((c.rating || 1200) - 100, 600)])) },
    { m: '2mo', ...Object.fromEntries(children.map((c: any, i: number) => [c.name?.split(' ')[0], Math.max((c.rating || 1200) - 60, 600)])) },
    { m: '1mo', ...Object.fromEntries(children.map((c: any, i: number) => [c.name?.split(' ')[0], Math.max((c.rating || 1200) - 25, 600)])) },
    { m: 'Now', ...Object.fromEntries(children.map((c: any) => [c.name?.split(' ')[0], c.rating || 1200])) },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><TrendingUp size={22} className="text-[var(--amber)]" />Progress Overview</h1>

      {children.length === 0 ? (
        <div className="card"><EmptyState title="No children linked" /></div>
      ) : (
        <>
          <div className="card p-6">
            <h3 className="section-title mb-4">Rating Progress</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="m" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<T />} />
                {children.map((c: any, ci: number) => (
                  <Line key={c.id} type="monotone" dataKey={c.name?.split(' ')[0]}
                    stroke={COLORS[ci % COLORS.length]} strokeWidth={2.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {children.map((child: any, ci: number) => {
              const prog = progress.find((p: any) => p.id === child.id)
              const color = COLORS[ci % COLORS.length]
              const winRate = prog?.games_played > 0 ? Math.round(((prog.wins || 0) / prog.games_played) * 100) : 0
              return (
                <div key={child.id} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: `${color}20`, color }}>{child.name?.[0]}</div>
                      <div><div className="font-semibold">{child.name}</div><div className="text-xs text-[var(--text-muted)]">{child.batch_name}</div></div>
                    </div>
                    <div className="font-display text-2xl font-bold" style={{ color }}>{child.rating || 1200}</div>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      { l: 'Games Played', v: prog?.games_played || 0, max: 100, c: '#60A5FA' },
                      { l: 'Puzzles Solved', v: prog?.puzzles_correct || 0, max: 200, c: '#A78BFA' },
                      { l: 'Homework', v: prog?.assignments_total > 0 ? Math.round((prog.assignments_done / prog.assignments_total) * 100) : 0, max: 100, c: '#4ADE80', pct: true },
                    ].map(s => (
                      <div key={s.l}>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="text-[var(--text-muted)]">{s.l}</span>
                          <span style={{ color: s.c }}>{s.pct ? `${s.v}%` : s.v}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min((s.v / s.max) * 100, 100)}%`, background: s.c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
