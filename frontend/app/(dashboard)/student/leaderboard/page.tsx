'use client'
import { useUsers } from '@/lib/hooks'
import { useAuth } from '@/lib/auth-context'
import { PageLoading } from '@/components/shared/States'
import Avatar from '@/components/shared/Avatar'
import { Award, Crown, Star, TrendingUp } from 'lucide-react'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { data: students = [], isLoading } = useUsers({ role: 'student' })

  if (isLoading) return <PageLoading />

  const ranked = [...students].sort((a: any, b: any) => (b.rating || 1200) - (a.rating || 1200))

  const MEDAL = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Award size={22} style={{ color: 'var(--amber)' }} />Leaderboard</h1>

      {ranked.length > 2 && (
        <div className="grid grid-cols-3 gap-4">
          {[ranked[1], ranked[0], ranked[2]].map((s: any, i) => {
            const podium = [1, 0, 2]
            const heights = ['h-28', 'h-36', 'h-24']
            const colors = ['#C0C0C0', '#C8961E', '#CD7F32']
            return (
              <div key={s?.id} className="card p-4 flex flex-col items-center gap-2 text-center">
                <span className="text-2xl">{MEDAL[podium[i]]}</span>
                <Avatar user={s} size="md" />
                <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{s?.name}</div>
                <div className="flex items-center gap-1 text-sm font-bold" style={{ color: colors[podium[i]] }}>
                  <Star size={12} />{s?.rating || 1200}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <h3 className="section-title">Full Rankings</h3>
        </div>
        <table className="w-full">
          <thead><tr>
            <th className="th w-12">#</th>
            <th className="th">Student</th>
            <th className="th text-center">Rating</th>
            <th className="th text-center hidden sm:table-cell">Games</th>
            <th className="th text-center hidden sm:table-cell">Win Rate</th>
          </tr></thead>
          <tbody>
            {ranked.map((s: any, i) => (
              <tr key={s.id} className="tr" style={s.id === user?.id ? { background: 'rgba(200,150,30,0.05)' } : {}}>
                <td className="td text-center">
                  {i < 3
                    ? <span className="text-lg">{MEDAL[i]}</span>
                    : <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>}
                </td>
                <td className="td">
                  <div className="flex items-center gap-3">
                    <Avatar user={s} size="sm" />
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                        {s.name}{s.id === user?.id && <span className="ml-2 badge badge-gold text-[10px]">You</span>}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.batch_name || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="td text-center">
                  <span className="font-bold font-mono" style={{ color: 'var(--amber)' }}>{s.rating || 1200}</span>
                </td>
                <td className="td text-center text-sm hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{s.games_played || 0}</td>
                <td className="td text-center text-sm hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {s.win_rate ? `${Math.round(s.win_rate * 100)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
