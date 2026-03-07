'use client'
import { useAuth } from '@/lib/auth-context'
import { useTournaments, useRegisterTournament } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { Trophy, Users, Clock, Calendar, CheckCircle2, Loader2 } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = { live: 'badge-red', upcoming: 'badge-gold', registration: 'badge-blue', completed: 'badge-gray' }

export default function StudentTournamentsPage() {
  const { user } = useAuth()
  const { data: tournaments = [], isLoading } = useTournaments()
  const register = useRegisterTournament()

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><Trophy size={22} className="text-[var(--amber)]" />Tournaments</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Compete and track your rankings</p>
      </div>

      {tournaments.length === 0 ? (
        <div className="card"><EmptyState title="No tournaments available" subtitle="Check back soon for upcoming tournaments" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tournaments.map((t: any) => (
            <div key={t.id} className={`card p-5 flex flex-col gap-3 ${t.status === 'live' ? 'border-red-400/30' : ''}`}>
              <div className="flex items-start justify-between">
                <span className={`badge text-xs ${STATUS_STYLE[t.status] || 'badge-gray'}`}>
                  {t.status === 'live' ? <><span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block animate-pulse mr-1" />LIVE</> : t.status}
                </span>
                <span className="badge-gray text-xs capitalize">{t.format}</span>
              </div>
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                {t.description && <p className="text-xs text-[var(--text-muted)] mt-1">{t.description}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-mid)]">
                <span className="flex items-center gap-1"><Users size={11} />{t.registered_count || 0}/{t.max_players}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{t.time_control}</span>
                {t.starts_at && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(t.starts_at).toLocaleDateString()}</span>}
                {t.rounds > 0 && <span>R{t.current_round}/{t.rounds}</span>}
              </div>
              {t.entry_fee > 0 && <div className="text-sm font-semibold text-[var(--amber)]">Entry: ₹{t.entry_fee}</div>}
              <button
                onClick={() => register.mutate(t.id)}
                disabled={register.isPending || t.status === 'completed'}
                className={`text-sm flex items-center justify-center gap-2 mt-1 ${t.status === 'completed' ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}>
                {register.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trophy size={13} />}
                {t.status === 'completed' ? 'Completed' : 'Register'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
