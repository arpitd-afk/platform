'use client'
import { useAuth } from '@/lib/auth-context'
import { useAcademy } from '@/lib/hooks'
import { useUsers } from '@/lib/hooks'
import { useClassrooms } from '@/lib/hooks'
import { useTournaments } from '@/lib/hooks'
import { useAcademyAnalytics } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import Link from 'next/link'
import { Users, BookOpen, Trophy, TrendingUp, ArrowUpRight, Video } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[var(--text-muted)] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.fill || p.color }}>{p.dataKey}: {p.value}</p>)}</div> : null

export default function AcademyDashboard() {
  const { user } = useAuth()
  const { data: academy, isLoading: aLoading } = useAcademy(user?.academyId)
  const { data: students = [] } = useUsers({ role: 'student' })
  const { data: coaches = [] } = useUsers({ role: 'coach' })
  const { data: classrooms = [] } = useClassrooms()
  const { data: tournaments = [] } = useTournaments()
  const { data: analytics } = useAcademyAnalytics(user?.academyId)

  if (aLoading) return <PageLoading />

  const liveClasses = classrooms.filter((c: any) => c.status === 'live')
  const upcomingClasses = classrooms.filter((c: any) => c.status === 'scheduled').slice(0, 3)
  const enrollData = analytics?.enrollmentTrend || [
    { m: '4mo', v: Math.max(students.length - 30, 0) },
    { m: '3mo', v: Math.max(students.length - 20, 0) },
    { m: '2mo', v: Math.max(students.length - 10, 0) },
    { m: '1mo', v: Math.max(students.length - 5, 0) },
    { m: 'Now', v: students.length },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            <span className="text-gold-gradient">{academy?.name || user?.academyName || 'Your Academy'}</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1 capitalize">{academy?.plan || 'trial'} plan · {academy?.subdomain}.chessacademy.pro</p>
        </div>
        {liveClasses.length > 0 && (
          <Link href={`/classroom/${liveClasses[0].id}`} className="btn-primary">
            <Video size={15} /><span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />Join Live Class
          </Link>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Students', value: students.length, icon: Users, color: '#60A5FA', href: '/academy/students' },
          { label: 'Coaches', value: coaches.length, icon: Users, color: 'var(--amber)', href: '/academy/coaches' },
          { label: 'Classes', value: classrooms.length, icon: BookOpen, color: '#4ADE80', href: '/academy/classes' },
          { label: 'Tournaments', value: tournaments.length, icon: Trophy, color: '#A78BFA', href: '/academy/tournaments' },
        ].map((s, i) => (
          <Link key={i} href={s.href} className="stat-card hover:border-[var(--border)] transition-colors">
            <s.icon size={18} style={{ color: s.color }} className="mb-2" />
            <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Student Growth</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={enrollData}>
              <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2} /><stop offset="95%" stopColor="#60A5FA" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Area type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2} fill="url(#eg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h3 className="section-title">Upcoming Classes</h3>
            <Link href="/academy/classes" className="text-xs text-[var(--amber)] flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          {upcomingClasses.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">No upcoming classes</div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {upcomingClasses.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{c.coach_name} · {c.batch_name}</div>
                  </div>
                  <span className="text-xs text-[var(--text-mid)]">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
