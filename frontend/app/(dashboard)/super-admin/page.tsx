'use client'
import { useAcademies, useUsers } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import Link from 'next/link'
import { Building2, Users, Crown, TrendingUp, ArrowUpRight, CreditCard, Shield } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const T = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="card px-3 py-2 text-xs shadow-md">
    <p style={{ color: 'var(--text-muted)' }} className="mb-1">{label}</p>
    {payload.map((p: any) => <p key={p.name} style={{ color: p.color || 'var(--amber)' }}>{p.dataKey}: {p.value}</p>)}
  </div>
) : null

export default function SuperAdminDashboard() {
  const { data: academies = [], isLoading } = useAcademies({})
  const { data: users = [] } = useUsers({})

  if (isLoading) return <PageLoading />

  const active = academies.filter((a: any) => a.status === 'active').length
  const suspended = academies.filter((a: any) => a.status === 'suspended').length
  const enterprise = academies.filter((a: any) => a.plan === 'enterprise').length
  const totalStudents = users.filter((u: any) => u.role === 'student').length

  // Fake growth data based on academy count
  const growthData = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].map((m, i) => ({
    month: m,
    academies: Math.max(1, Math.round(academies.length * (0.5 + i * 0.1))),
    students: Math.max(1, Math.round(totalStudents * (0.5 + i * 0.1))),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Crown size={24} style={{ color: 'var(--amber)' }} />Super Admin
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Platform overview & management</p>
        </div>
        <Link href="/super-admin/academies" className="btn-primary flex items-center gap-2">
          <Building2 size={15} />Create Academy
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Academies', value: academies.length, icon: Building2, color: 'var(--amber)', href: '/super-admin/academies' },
          { label: 'Active Academies', value: active, icon: TrendingUp, color: '#15803D', href: '/super-admin/academies' },
          { label: 'Total Users', value: users.length, icon: Users, color: '#1D4ED8', href: '/super-admin/users' },
          { label: 'Enterprise', value: enterprise, icon: Crown, color: '#7C3AED', href: '/super-admin/billing' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="stat-card hover:shadow-md transition-all">
            <s.icon size={18} style={{ color: s.color }} />
            <div className="text-2xl font-display font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">Platform Growth</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={growthData}>
            <defs>
              <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C8961E" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#C8961E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<T />} />
            <Area type="monotone" dataKey="academies" stroke="#C8961E" strokeWidth={2} fill="url(#ga)" name="Academies" />
            <Area type="monotone" dataKey="students" stroke="#1D4ED8" strokeWidth={2} fill="url(#gs)" name="Students" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent academies */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Recent Academies</h3>
          <Link href="/super-admin/academies" className="text-xs flex items-center gap-1" style={{ color: 'var(--amber)' }}>
            View all <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="space-y-2">
          {academies.slice(0, 5).map((a: any) => (
            <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: 'rgba(200,150,30,0.12)', color: 'var(--amber)' }}>
                {a.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{a.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.owner_email}</div>
              </div>
              <span className={`badge text-xs capitalize ${a.status === 'active' ? 'badge-green' : 'badge-red'}`}>{a.status}</span>
              <span className="badge badge-gray text-xs capitalize">{a.plan}</span>
            </div>
          ))}
          {academies.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No academies yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
