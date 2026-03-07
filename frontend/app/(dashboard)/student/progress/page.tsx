'use client'
import { useAuth } from '@/lib/auth-context'
import { useUserStats } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import { TrendingUp, Star, Swords, Puzzle, Target, Zap } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const T = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="card px-3 py-2 text-xs shadow-md">
    <p style={{ color: 'var(--text-muted)' }} className="mb-1">{label}</p>
    {payload.map((p: any) => <p key={p.name} style={{ color: p.color || 'var(--amber)' }}>{p.dataKey}: {p.value}</p>)}
  </div>
) : null

export default function StudentProgressPage() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useUserStats(user?.id)

  if (isLoading) return <PageLoading />

  const ratingHistory = stats?.ratingHistory || Array.from({ length: 8 }, (_, i) => ({
    date: `W${i + 1}`, rating: (user?.rating || 1200) - (7 - i) * 15 + Math.floor(Math.random() * 20)
  }))

  const activityData = stats?.activityData || Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    puzzles: Math.floor(Math.random() * 15),
    games: Math.floor(Math.random() * 5),
  }))

  const statCards = [
    { label: 'Current Rating', value: user?.rating || 1200, icon: Star, color: 'var(--amber)', change: '+25 this week' },
    { label: 'Games Played', value: stats?.games_played || 0, icon: Swords, color: '#1D4ED8', change: '+3 this week' },
    { label: 'Puzzles Solved', value: stats?.puzzles_solved || 0, icon: Puzzle, color: '#15803D', change: '+12 this week' },
    { label: 'Study Streak', value: `${stats?.streak || 0} days`, icon: Zap, color: '#7C3AED', change: 'Keep going!' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><TrendingUp size={22} style={{ color: 'var(--amber)' }} />My Progress</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
            <div className="text-2xl font-display font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-5">Rating History</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={ratingHistory}>
            <defs>
              <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C8961E" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#C8961E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<T />} />
            <Area type="monotone" dataKey="rating" stroke="#C8961E" strokeWidth={2} fill="url(#gr)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-5">Weekly Activity</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<T />} />
            <Area type="monotone" dataKey="puzzles" stroke="#15803D" fill="rgba(21,128,61,0.10)" strokeWidth={2} name="Puzzles" />
            <Area type="monotone" dataKey="games" stroke="#1D4ED8" fill="rgba(29,78,216,0.10)" strokeWidth={2} name="Games" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {stats?.openingStats && (
        <div className="card p-6">
          <h3 className="section-title mb-4">Opening Performance</h3>
          <div className="space-y-3">
            {stats.openingStats.slice(0, 5).map((o: any) => (
              <div key={o.name} className="flex items-center gap-3">
                <div className="w-32 text-sm truncate" style={{ color: 'var(--text-mid)' }}>{o.name}</div>
                <div className="flex-1 progress-bar">
                  <div className="progress-fill" style={{ width: `${o.win_rate * 100}%` }} />
                </div>
                <div className="w-12 text-xs text-right" style={{ color: 'var(--text-muted)' }}>{Math.round(o.win_rate * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
