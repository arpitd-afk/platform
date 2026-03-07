'use client'
import { useAuth } from '@/lib/auth-context'
import { useUserStats, useAssignments, useClassrooms, useTournaments } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import Avatar from '@/components/shared/Avatar'
import Link from 'next/link'
import { Swords, BookOpen, Puzzle, Trophy, TrendingUp, Star, Target, Zap, ArrowUpRight, Clock } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useUserStats(user?.id)
  const { data: assignments = [] } = useAssignments({ status: 'pending', limit: 3 })
  const { data: classrooms = [] } = useClassrooms()
  const { data: tournaments = [] } = useTournaments()

  if (isLoading) return <PageLoading />

  const upcomingClass = classrooms.find((c: any) => c.status === 'live' || c.status === 'scheduled')
  const pendingCount = assignments.filter((a: any) => a.status === 'pending').length
  const activeTournament = tournaments.find((t: any) => t.status === 'active')

  const quickActions = [
    { href: '/game', icon: Swords, label: 'Play Chess', desc: 'Find a game', color: '#1D4ED8', bg: '#DBEAFE' },
    { href: '/student/puzzles', icon: Puzzle, label: 'Puzzles', desc: `${stats?.puzzles_solved || 0} solved`, color: '#15803D', bg: '#DCFCE7' },
    { href: '/student/lessons', icon: BookOpen, label: 'Lessons', desc: 'Continue learning', color: '#9A6E00', bg: 'rgba(200,150,30,0.12)' },
    { href: '/student/tournaments', icon: Trophy, label: 'Tournaments', desc: activeTournament ? 'Active now' : 'Browse all', color: '#7C3AED', bg: '#EDE9FE' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card p-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #FFFCF8 0%, rgba(200,150,30,0.06) 100%)' }}>
        <Avatar user={user} size="lg" />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {pendingCount > 0 ? `You have ${pendingCount} pending assignment${pendingCount > 1 ? 's' : ''}` : 'All assignments complete — great work!'}
          </p>
        </div>
        {user?.rating && (
          <div className="text-center hidden sm:block">
            <div className="font-display text-3xl font-bold" style={{ color: 'var(--amber)' }}>{user.rating}</div>
            <div className="text-xs flex items-center gap-1 justify-center mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <Star size={11} style={{ color: 'var(--amber)' }} />ELO Rating
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Games Played', value: stats?.games_played || 0, icon: Swords, color: '#1D4ED8' },
          { label: 'Puzzles Solved', value: stats?.puzzles_solved || 0, icon: Puzzle, color: '#15803D' },
          { label: 'Win Rate', value: stats?.win_rate ? `${Math.round(stats.win_rate * 100)}%` : '—', icon: TrendingUp, color: '#9A6E00' },
          { label: 'Streak Days', value: stats?.streak || 0, icon: Zap, color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="section-title mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href} className="card-hover p-5 flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: a.bg }}>
                <a.icon size={20} style={{ color: a.color }} />
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{a.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upcoming Class */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Next Class</h3>
            <Link href="/student/lessons" className="text-xs flex items-center gap-1" style={{ color: 'var(--amber)' }}>View all <ArrowUpRight size={11} /></Link>
          </div>
          {upcomingClass ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,150,30,0.10)' }}>
                  <BookOpen size={18} style={{ color: 'var(--amber)' }} />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{upcomingClass.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>by {upcomingClass.coach_name || 'Your Coach'}</div>
                  {upcomingClass.scheduled_at && (
                    <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--text-mid)' }}>
                      <Clock size={11} />
                      {new Date(upcomingClass.scheduled_at).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
              <Link href={`/classroom/${upcomingClass.id}`}
                className={`block text-center text-sm py-2 rounded-xl font-medium transition-all ${upcomingClass.status === 'live' ? 'btn-primary' : 'btn-secondary'}`}>
                {upcomingClass.status === 'live' ? '🔴 Join Live Now' : 'View Class'}
              </Link>
            </div>
          ) : (
            <div className="py-6 text-center">
              <BookOpen size={28} className="mx-auto mb-2" style={{ color: 'var(--border-md)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming classes</p>
            </div>
          )}
        </div>

        {/* Pending Assignments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Assignments</h3>
            <Link href="/student/assignments" className="text-xs flex items-center gap-1" style={{ color: 'var(--amber)' }}>View all <ArrowUpRight size={11} /></Link>
          </div>
          {assignments.length === 0 ? (
            <div className="py-6 text-center">
              <Target size={28} className="mx-auto mb-2" style={{ color: 'var(--border-md)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending assignments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.slice(0, 3).map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7' }}>
                    <Target size={14} style={{ color: '#B45309' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Due: {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN') : 'No deadline'}
                    </div>
                  </div>
                  <span className="badge badge-orange text-xs">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
