'use client'
import { useAuth } from '@/lib/auth-context'
import { useUsers, useClassrooms, useAssignments } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import Avatar from '@/components/shared/Avatar'
import Link from 'next/link'
import { Users, Video, ClipboardList, BarChart3, ArrowUpRight, Star, TrendingUp, Clock } from 'lucide-react'

export default function CoachDashboard() {
  const { user } = useAuth()
  const { data: students = [], isLoading } = useUsers({ role: 'student' })
  const { data: classrooms = [] } = useClassrooms()
  const { data: assignments = [] } = useAssignments({})

  if (isLoading) return <PageLoading />

  const liveClass = classrooms.find((c: any) => c.status === 'live')
  const upcoming = classrooms.filter((c: any) => c.status === 'scheduled').slice(0, 3)
  const pendingReview = assignments.filter((a: any) => a.status === 'submitted').length
  const avgRating = students.length
    ? Math.round(students.reduce((s: number, u: any) => s + (u.rating || 1200), 0) / students.length)
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="card p-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #FFFCF8 0%, rgba(21,128,61,0.05) 100%)' }}>
        <Avatar user={user} size="lg" />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {pendingReview > 0 ? `${pendingReview} assignment${pendingReview > 1 ? 's' : ''} awaiting review` : 'All assignments reviewed'}
          </p>
        </div>
        {liveClass && (
          <Link href={`/classroom/${liveClass.id}`} className="btn-primary flex items-center gap-2">
            <Video size={15} />
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Join Live
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'My Students', value: students.length, icon: Users, color: '#1D4ED8', href: '/coach/students' },
          { label: 'Classes This Week', value: classrooms.filter((c: any) => c.status !== 'cancelled').length, icon: Video, color: '#15803D', href: '/coach/classroom' },
          { label: 'Avg. Student Rating', value: avgRating, icon: Star, color: '#9A6E00', href: '/coach/analysis' },
          { label: 'Pending Review', value: pendingReview, icon: ClipboardList, color: '#BE185D', href: '/coach/assignments' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="stat-card hover:shadow-md transition-all">
            <s.icon size={18} style={{ color: s.color }} />
            <div className="text-2xl font-display font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Students list */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Students</h3>
            <Link href="/coach/students" className="text-xs flex items-center gap-1" style={{ color: 'var(--amber)' }}>
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          {students.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No students yet</p>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                  <Avatar user={s} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{s.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.batch_name || 'No batch'}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--amber)' }}>
                    <Star size={11} />{s.rating || 1200}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming classes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Upcoming Classes</h3>
            <Link href="/coach/classroom" className="text-xs flex items-center gap-1" style={{ color: 'var(--amber)' }}>
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No upcoming classes</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,150,30,0.10)' }}>
                    <Video size={15} style={{ color: 'var(--amber)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{c.title}</div>
                    {c.scheduled_at && (
                      <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        {new Date(c.scheduled_at).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <Link href={`/classroom/${c.id}`} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(200,150,30,0.12)', color: '#9A6E00' }}>
                    Start
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
