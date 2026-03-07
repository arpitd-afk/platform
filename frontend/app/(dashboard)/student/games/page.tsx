'use client'
import { useAuth } from '@/lib/auth-context'
import { useGames } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Avatar from '@/components/shared/Avatar'
import { Trophy, Swords, Star, TrendingUp, Circle } from 'lucide-react'
import Link from 'next/link'

export default function StudentGamesPage() {
  const { user } = useAuth()
  const { data: games = [], isLoading } = useGames({ playerId: user?.id })

  if (isLoading) return <PageLoading />

  const wins = games.filter((g: any) => g.result_winner_id === user?.id).length
  const losses = games.filter((g: any) => g.result_winner_id && g.result_winner_id !== user?.id).length
  const draws = games.filter((g: any) => g.result === 'draw').length

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Trophy size={22} style={{ color: 'var(--amber)' }} />Game History</h1>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: games.length, color: 'var(--text)' },
          { label: 'Wins', value: wins, color: '#15803D' },
          { label: 'Draws', value: draws, color: '#9A6E00' },
          { label: 'Losses', value: losses, color: '#DC2626' },
        ].map(s => (
          <div key={s.label} className="stat-card items-center text-center">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {games.length === 0 ? (
        <div className="card">
          <EmptyState title="No games yet" subtitle="Play your first game to see history here"
            action={<Link href="/game" className="btn-primary text-sm flex items-center gap-2"><Swords size={14} />Play Now</Link>} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="th">Opponent</th>
              <th className="th text-center">Result</th>
              <th className="th text-center hidden sm:table-cell">Opening</th>
              <th className="th text-center hidden sm:table-cell">Rating Δ</th>
              <th className="th text-center">Date</th>
              <th className="th text-center">Review</th>
            </tr></thead>
            <tbody>
              {games.map((g: any) => {
                const isWin = g.result_winner_id === user?.id
                const isDraw = g.result === 'draw'
                const opponent = g.white_id === user?.id ? { name: g.black_name, id: g.black_id } : { name: g.white_name, id: g.white_id }
                const ratingDelta = g.white_id === user?.id ? g.white_rating_change : g.black_rating_change
                return (
                  <tr key={g.id} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <Avatar user={{ name: opponent.name, role: 'student' }} size="xs" />
                        <span className="text-sm">{opponent.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="td text-center">
                      <span className={`badge text-xs ${isWin ? 'badge-green' : isDraw ? 'badge-orange' : 'badge-red'}`}>
                        {isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'}
                      </span>
                    </td>
                    <td className="td text-center text-xs hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{g.opening || '—'}</td>
                    <td className="td text-center hidden sm:table-cell">
                      {ratingDelta !== undefined && ratingDelta !== null ? (
                        <span className="text-sm font-mono font-semibold" style={{ color: ratingDelta >= 0 ? '#15803D' : '#DC2626' }}>
                          {ratingDelta > 0 ? '+' : ''}{ratingDelta}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="td text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(g.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="td text-center">
                      <Link href={`/game?id=${g.id}`} className="text-xs px-2 py-1 rounded-lg font-medium transition-all" style={{ background: 'var(--bg-subtle)', color: 'var(--text-mid)' }}>
                        Review
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
