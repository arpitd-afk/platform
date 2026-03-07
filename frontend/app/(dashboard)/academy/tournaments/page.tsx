'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTournaments, useCreateTournament } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import { Trophy, Plus, Users, Clock, Calendar, Loader2 } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = { live: 'badge-red', upcoming: 'badge-gold', registration: 'badge-blue', completed: 'badge-gray', cancelled: 'badge-gray' }
const FORMATS = ['swiss', 'round_robin', 'arena', 'knockout']

export default function AcademyTournamentsPage() {
  const { user } = useAuth()
  const { data: tournaments = [], isLoading } = useTournaments()
  const create = useCreateTournament()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', format: 'swiss', timeControl: '10+5', rounds: 5, maxPlayers: 64, startsAt: '', description: '', entryFee: 0, prizePool: 0 })

  if (isLoading) return <PageLoading />

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setShowModal(false)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Trophy size={22} className="text-[var(--amber)]" />Tournaments</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm"><Plus size={15} />Create Tournament</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[{ s: 'live', c: '#F87171' }, { s: 'upcoming', c: '#D4AF37' }, { s: 'registration', c: '#60A5FA' }, { s: 'completed', c: '#4ADE80' }].map(x => (
          <div key={x.s} className="stat-card"><div className="font-display text-2xl font-bold" style={{ color: x.c }}>{tournaments.filter((t: any) => t.status === x.s).length}</div><div className="text-xs text-[var(--text-muted)] capitalize">{x.s}</div></div>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <div className="card"><EmptyState title="No tournaments yet" subtitle="Create your first tournament"
          action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm">Create Tournament</button>} /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tournaments.map((t: any) => (
            <div key={t.id} className={`card p-5 ${t.status === 'live' ? 'border-red-400/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <span className={`badge text-xs ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status}</span>
                <span className="badge-gray text-xs capitalize">{t.format?.replace('_', ' ')}</span>
              </div>
              <h3 className="font-semibold mb-1">{t.name}</h3>
              {t.description && <p className="text-xs text-[var(--text-muted)] mb-3">{t.description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-mid)]">
                <span className="flex items-center gap-1"><Users size={11} />{t.registered_count || 0}/{t.max_players}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{t.time_control}</span>
                {t.starts_at && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(t.starts_at).toLocaleDateString()}</span>}
                {t.rounds > 0 && <span>R{t.current_round}/{t.rounds}</span>}
              </div>
              {t.prize_pool > 0 && <div className="text-sm font-bold text-[var(--amber)] mt-2">Prize: ₹{t.prize_pool}</div>}
            </div>
          ))}
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} title="Create Tournament" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Tournament Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Summer Open 2024" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Format</label><select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} className="input capitalize">{FORMATS.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}</select></div>
            <div><label className="label">Time Control</label><input value={form.timeControl} onChange={e => setForm({ ...form, timeControl: e.target.value })} className="input" placeholder="10+5" /></div>
            <div><label className="label">Rounds</label><input type="number" value={form.rounds} onChange={e => setForm({ ...form, rounds: parseInt(e.target.value) })} className="input" /></div>
            <div><label className="label">Max Players</label><input type="number" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: parseInt(e.target.value) })} className="input" /></div>
            <div><label className="label">Entry Fee (₹)</label><input type="number" value={form.entryFee} onChange={e => setForm({ ...form, entryFee: parseFloat(e.target.value) })} className="input" /></div>
            <div><label className="label">Prize Pool (₹)</label><input type="number" value={form.prizePool} onChange={e => setForm({ ...form, prizePool: parseFloat(e.target.value) })} className="input" /></div>
          </div>
          <div><label className="label">Starts At</label><input required type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className="input" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input resize-none h-16" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Creating...' : 'Create Tournament'}</button>
          </div>
        </form>
      </Modal>}
    </div>
  )
}
