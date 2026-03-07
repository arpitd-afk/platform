'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useUsers, useAcademyAnalytics } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[var(--text-muted)] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.fill || p.color }}>{p.name || p.dataKey}: {p.value}</p>)}</div> : null

export default function CoachAnalysisPage() {
  const { user } = useAuth()
  const { data: students = [], isLoading: sLoading } = useUsers({ role: 'student' })
  const { data: analytics, isLoading: aLoading } = useAcademyAnalytics(user?.academyId)

  if (sLoading) return <PageLoading />

  const ratingData = students.map((s: any) => ({ name: s.name.split(' ')[0], rating: s.rating || 1200 }))
  const scatterData = students.map((s: any) => ({ x: s.rating || 1200, y: Math.floor(Math.random() * 40 + 50), z: 10, name: s.name }))
  const cohortRadar = [
    { s: 'Tactics',   v: analytics?.avgTactics || 68 },
    { s: 'Endgame',   v: analytics?.avgEndgame || 58 },
    { s: 'Opening',   v: analytics?.avgOpening || 75 },
    { s: 'Strategy',  v: analytics?.avgStrategy || 62 },
    { s: 'Speed',     v: analytics?.avgSpeed || 71 },
    { s: 'Accuracy',  v: analytics?.avgAccuracy || 66 },
  ]

  const topStudents = analytics?.topStudents || students.slice(0, 5)
  const avgRating = students.length > 0 ? Math.round(students.reduce((s: number, x: any) => s + (x.rating || 1200), 0) / students.length) : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-[#F472B6]" />Student Analysis</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[#60A5FA]">{students.length}</div><div className="text-xs text-[var(--text-muted)]">My Students</div></div>
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[var(--amber)]">{avgRating || 1200}</div><div className="text-xs text-[var(--text-muted)]">Avg Rating</div></div>
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[#4ADE80]">{students.filter((s: any) => s.is_active).length}</div><div className="text-xs text-[var(--text-muted)]">Active Students</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Student Ratings</h3>
          {ratingData.length === 0 ? (
            <EmptyState title="No students yet" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[600, 'auto']} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<T />} />
                <Bar dataKey="rating" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">Cohort Skill Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={cohortRadar}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="s" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Radar dataKey="v" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]"><h3 className="section-title">Student Rankings</h3></div>
        {students.length === 0 ? (
          <EmptyState title="No students to analyze" />
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border)]"><th className="th">Student</th><th className="th text-center">Rating</th><th className="th text-center">Status</th><th className="th text-right">Last Active</th></tr></thead>
            <tbody>
              {[...students].sort((a: any, b: any) => (b.rating || 1200) - (a.rating || 1200)).map((s: any, i: number) => (
                <tr key={s.id} className="tr">
                  <td className="td"><div className="flex items-center gap-3"><span className="text-[var(--text-muted)] text-sm w-5">#{i + 1}</span><div className="w-8 h-8 rounded-full bg-[#60A5FA]/15 flex items-center justify-center text-[#60A5FA] font-bold text-sm">{s.name[0]}</div><span className="font-medium text-sm">{s.name}</span></div></td>
                  <td className="td text-center font-mono font-bold text-[var(--amber)]">{s.rating || 1200}</td>
                  <td className="td text-center"><span className={`badge text-xs ${s.is_active ? 'badge-green' : 'badge-gray'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="td text-right text-sm text-[var(--text-muted)]">{s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
