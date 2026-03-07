'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAcademyAnalytics } from '@/lib/hooks'
import { useUsers } from '@/lib/hooks'
import { useGames } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import { BarChart3 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[var(--text-muted)] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.color || p.fill }}>{p.dataKey}: {p.value}</p>)}</div> : null

const PERIODS = ['7d', '30d', '90d']

export default function AcademyAnalyticsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('30d')
  const { data: analytics, isLoading } = useAcademyAnalytics(user?.academyId, period)
  const { data: students = [] } = useUsers({ role: 'student' })
  const { data: coaches = [] } = useUsers({ role: 'coach' })

  if (isLoading) return <PageLoading />

  const avgRating = students.length > 0 ? Math.round(students.reduce((s: number, x: any) => s + (x.rating || 1200), 0) / students.length) : 1200

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-[#F472B6]" />Analytics</h1>
        <div className="flex gap-1 card p-1 rounded-xl">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-[#F472B6]/15 text-[#F472B6]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Total Students', v: students.length, c: '#60A5FA' },
          { l: 'Avg Rating', v: avgRating, c: '#D4AF37' },
          { l: 'Active Coaches', v: coaches.filter((c: any) => c.is_active).length, c: '#4ADE80' },
          { l: 'Games This Period', v: analytics?.totalGames || 0, c: '#A78BFA' },
        ].map(s => (
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div><div className="text-xs text-[var(--text-muted)]">{s.l}</div></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Rating Distribution</h3>
          {students.length > 0 ? (() => {
            const buckets = [{ r: '<800', c: 0 }, { r: '800-1k', c: 0 }, { r: '1k-1.2k', c: 0 }, { r: '1.2k-1.4k', c: 0 }, { r: '>1.4k', c: 0 }]
            students.forEach((s: any) => {
              const r = s.rating || 1200
              if (r < 800) buckets[0].c++
              else if (r < 1000) buckets[1].c++
              else if (r < 1200) buckets[2].c++
              else if (r < 1400) buckets[3].c++
              else buckets[4].c++
            })
            return (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={buckets}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="r" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip content={<T />}/><Bar dataKey="c" fill="#D4AF37" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            )
          })() : <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">No student data yet</div>}
        </div>

        <div className="card p-6">
          <h3 className="section-title mb-4">Monthly Games</h3>
          {analytics?.gamesHistory ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={analytics.gamesHistory}>
                <defs><linearGradient id="gg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2}/><stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="m" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip content={<T />}/><Area type="monotone" dataKey="g" stroke="#60A5FA" strokeWidth={2} fill="url(#gg2)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">Analytics loading...</div>}
        </div>
      </div>
    </div>
  )
}
