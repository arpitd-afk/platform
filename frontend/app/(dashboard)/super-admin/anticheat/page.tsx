'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { anticheatAPI, usersAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import Avatar from '@/components/shared/Avatar'
import { Shield, AlertTriangle, CheckCircle2, XCircle, Eye, Plus, Search, Loader2, FileWarning, Ban, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, { class: string; color: string; bg: string }> = {
  pending: { class: 'badge-gold', color: '#D4AF37', bg: 'rgba(212,175,55,0.12)' },
  reviewed: { class: 'badge-blue', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  confirmed: { class: 'badge-red', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  dismissed: { class: 'badge-gray', color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
}

export default function AnticheatPage() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['anticheat-reports'],
    queryFn: () => anticheatAPI.reports().then(r => r.data.reports),
  })
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [showFileReport, setShowFileReport] = useState(false)

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: any) => anticheatAPI.review(id, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anticheat-reports'] })
      toast.success('Report updated')
      setSelected(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update report'),
  })

  if (isLoading) return <PageLoading />
  const filtered = filter === 'all' ? reports : reports.filter((r: any) => r.status === filter)

  const statCards = [
    { status: 'pending', label: 'Pending', color: '#D4AF37', icon: <FileWarning size={18} /> },
    { status: 'reviewed', label: 'Reviewed', color: '#60A5FA', icon: <Eye size={18} /> },
    { status: 'confirmed', label: 'Confirmed', color: '#F87171', icon: <Ban size={18} /> },
    { status: 'dismissed', label: 'Dismissed', color: 'var(--text-muted)', icon: <XCircle size={18} /> },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Shield size={22} className="text-[#F87171]" />Anti-Cheat Reports
        </h1>
        <button onClick={() => setShowFileReport(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} />File Report
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(card => {
          const count = reports.filter((r: any) => r.status === card.status).length
          return (
            <div
              key={card.status}
              className="card p-4 cursor-pointer transition-all hover:scale-[1.02]"
              onClick={() => setFilter(card.status)}
              style={filter === card.status ? { borderColor: card.color, boxShadow: `0 0 0 1px ${card.color}30` } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: card.color }}>{card.icon}</span>
                <span className="font-display text-2xl font-bold" style={{ color: card.color }}>{count}</span>
              </div>
              <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 card p-1 rounded-xl w-fit">
        {['all', 'pending', 'reviewed', 'confirmed', 'dismissed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#F87171]/15 text-[#F87171]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}
          >
            {f} {f !== 'all' && <span className="ml-1 opacity-60">({reports.filter((r: any) => f === 'all' || r.status === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Reports table */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="No reports found" subtitle="All clear — no suspicious activity detected" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border)]">
              <th className="th">Player</th>
              <th className="th">Reporter</th>
              <th className="th text-center">Engine Match</th>
              <th className="th text-center">Suspicious Moves</th>
              <th className="th text-center">Status</th>
              <th className="th text-right">Date</th>
              <th className="th text-center">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((r: any) => {
                const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending
                return (
                  <tr key={r.id} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <Avatar user={{ name: r.reported_name, role: 'student' }} size="sm" />
                        <div>
                          <div className="font-medium text-sm">{r.reported_name || 'Unknown'}</div>
                          {r.reported_rating && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.reported_rating} ELO</div>}
                        </div>
                      </div>
                    </td>
                    <td className="td text-sm" style={{ color: 'var(--text-mid)' }}>{r.reporter_name || 'System'}</td>
                    <td className="td text-center">
                      <span className={`font-mono font-bold text-sm ${r.engine_similarity > 0.8 ? 'text-red-400' : r.engine_similarity > 0.6 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {r.engine_similarity ? `${Math.round(r.engine_similarity * 100)}%` : '—'}
                      </span>
                    </td>
                    <td className="td text-center text-sm">{r.suspicious_moves?.length || 0} moves</td>
                    <td className="td text-center">
                      <span className="badge text-xs" style={{ background: badge.bg, color: badge.color }}>{r.status}</span>
                    </td>
                    <td className="td text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="td text-center">
                      <button onClick={() => setSelected(r)} className="btn-icon w-7 h-7"><Eye size={13} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review modal */}
      {!!selected && (
        <Modal onClose={() => setSelected(null)} title="Review Cheat Report">
          <div className="space-y-4">
            <div className="p-4 rounded-xl space-y-3 text-sm" style={{ background: 'var(--bg-hover)' }}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar user={{ name: selected.reported_name, role: 'student' }} size="md" />
                <div>
                  <div className="font-semibold">{selected.reported_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.reported_rating || '—'} ELO</div>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Engine Similarity</span>
                <span className={`font-mono font-bold ${selected.engine_similarity > 0.8 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {selected.engine_similarity ? `${Math.round(selected.engine_similarity * 100)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Suspicious Moves</span><span>{selected.suspicious_moves?.join(', ') || 'None flagged'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Reported By</span><span>{selected.reporter_name || 'System'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Status</span>
                <span className="badge text-xs" style={{ background: STATUS_BADGE[selected.status]?.bg, color: STATUS_BADGE[selected.status]?.color }}>{selected.status}</span>
              </div>
              {selected.notes && <div><span className="text-[var(--text-muted)]">Notes:</span><p className="mt-1">{selected.notes}</p></div>}
            </div>

            {selected.status === 'confirmed' && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <UserX size={16} className="text-red-400" />
                <span style={{ color: '#F87171' }}>Confirming this report will <strong>ban the player</strong> from the platform.</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => updateStatus.mutate({ id: selected.id, status: 'confirmed' })}
                disabled={updateStatus.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
              >
                {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                Confirm Cheating
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: selected.id, status: 'dismissed' })}
                disabled={updateStatus.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 btn-secondary"
              >
                <XCircle size={14} />Dismiss
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* File Report modal */}
      {showFileReport && <FileReportModal onClose={() => { setShowFileReport(false); qc.invalidateQueries({ queryKey: ['anticheat-reports'] }) }} />}
    </div>
  )
}

// ─── File Report Modal ────────────────────────────────────────
function FileReportModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [engineSim, setEngineSim] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: users = [] } = useQuery({
    queryKey: ['users-search', search],
    queryFn: () => usersAPI.list({ role: 'student' }).then(r => r.data.users),
    enabled: search.length > 1,
    staleTime: 30000,
  })

  const filtered = users.filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!selectedUser) return toast.error('Select a player first')
    setSubmitting(true)
    try {
      await anticheatAPI.report({
        reportedUserId: selectedUser.id,
        engineSimilarity: engineSim ? parseFloat(engineSim) / 100 : null,
        notes: notes || null,
      })
      toast.success('Cheat report filed!')
      onClose()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to file report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="File Anti-Cheat Report" onClose={onClose}>
      <div className="space-y-4">
        {/* Player search */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Search Player</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input pl-9 text-sm"
              placeholder="Type player name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedUser(null) }}
            />
          </div>
        </div>

        {/* Selected player */}
        {selectedUser && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <Avatar user={{ name: selectedUser.name, role: 'student' }} size="sm" />
            <div>
              <div className="font-medium text-sm">{selectedUser.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedUser.email} • {selectedUser.rating || 1200} ELO</div>
            </div>
            <CheckCircle2 size={16} className="ml-auto text-green-400" />
          </div>
        )}

        {/* Search results */}
        {search.length > 1 && !selectedUser && filtered.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            {filtered.slice(0, 8).map((u: any) => (
              <button key={u.id} onClick={() => { setSelectedUser(u); setSearch(u.name) }}
                className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] transition-all text-left border-b last:border-b-0"
                style={{ borderColor: 'var(--border)' }}>
                <Avatar user={{ name: u.name, role: 'student' }} size="sm" />
                <div>
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.rating || '—'}</span>
              </button>
            ))}
          </div>
        )}

        {/* Engine similarity */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Engine Similarity % (optional)</label>
          <input
            className="input text-sm"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 85"
            value={engineSim}
            onChange={e => setEngineSim(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Notes / Reason</label>
          <textarea
            className="input text-sm"
            rows={3}
            placeholder="Describe the suspicious behavior..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedUser}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
          File Report
        </button>
      </div>
    </Modal>
  )
}
