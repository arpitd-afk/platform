'use client'
import { useGlobalAnalytics } from '@/lib/hooks'
import { useAcademies } from '@/lib/hooks'
import { useUsers } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import { BarChart3, Building2, Users, Swords, TrendingUp } from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[var(--text-muted)] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.fill || p.color }}>{p.dataKey}: {p.value}</p>)}</div> : null

export default function SuperAdminAnalyticsPage() {
  const { data: analytics, isLoading } = useGlobalAnalytics()
  const { data: academies = [] } = useAcademies({})
  const { data: users = [] } = useUsers({})

  if (isLoading) return <PageLoading />

  const planDist = ['trial', 'starter', 'academy', 'enterprise'].map(p => ({
    plan: p, count: academies.filter((a: any) => a.plan === p).length
  }))
  const roleDist = ['student', 'coach', 'academy_admin', 'parent'].map(r => ({
    role: r.replace('_', ' '), count: users.filter((u: any) => u.role === r).length
  }))

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-[#F472B6]" />Platform Analytics</h1>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Total Academies', v: analytics?.academies?.total || academies.length, c: '#D4AF37', icon: Building2 },
          { l: 'Active Users', v: analytics?.users?.total || users.length, c: '#60A5FA', icon: Users },
          { l: 'Games Played', v: analytics?.games?.total || 0, c: '#4ADE80', icon: Swords },
          { l: 'Revenue MTD', v: `₹${((analytics?.revenue?.thisMonth || 0) / 1000).toFixed(0)}K`, c: '#A78BFA', icon: TrendingUp },
        ].map(s => (
          <div key={s.l} className="stat-card"><s.icon size={18} style={{ color: s.c }} className="mb-2" /><div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div><div className="text-xs text-[var(--text-muted)]">{s.l}</div></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Academies by Plan</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={planDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="plan" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">Users by Role</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={roleDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="role" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Bar dataKey="count" fill="#60A5FA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Total Revenue', v: `₹${(analytics?.revenue?.total || 0).toLocaleString()}`, c: '#4ADE80' },
          { l: 'Games Today', v: analytics?.games?.today || 0, c: '#60A5FA' },
          { l: 'Games This Week', v: analytics?.games?.thisWeek || 0, c: '#A78BFA' },
        ].map(s => (
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div><div className="text-xs text-[var(--text-muted)]">{s.l}</div></div>
        ))}
      </div>
    </div>
  )
}
