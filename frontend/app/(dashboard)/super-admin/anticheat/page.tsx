'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { anticheatAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import { Shield, AlertTriangle, CheckCircle2, XCircle, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, string> = { pending: 'badge-gold', reviewed: 'badge-blue', confirmed: 'badge-red', dismissed: 'badge-gray' }

export default function AnticheatPage() {
  const { data: reports = [], isLoading } = useQuery({ queryKey: ['anticheat-reports'], queryFn: () => anticheatAPI.reports().then(r => r.data.reports) })
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('all')

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: any) => anticheatAPI.review(id, { status, notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anticheat-reports'] }); toast.success('Report updated'); setSelected(null) },
  })

  if (isLoading) return <PageLoading />
  const filtered = filter === 'all' ? reports : reports.filter((r: any) => r.status === filter)

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Shield size={22} className="text-[#F87171]" />Anti-Cheat Reports</h1>

      <div className="grid grid-cols-4 gap-4">
        {[{ s: 'pending', c: '#D4AF37' }, { s: 'reviewed', c: '#60A5FA' }, { s: 'confirmed', c: '#F87171' }, { s: 'dismissed', c: 'var(--text-muted)' }].map(x => (
          <div key={x.s} className="stat-card cursor-pointer" onClick={() => setFilter(x.s)}>
            <div className="font-display text-2xl font-bold" style={{ color: x.c }}>{reports.filter((r: any) => r.status === x.s).length}</div>
            <div className="text-xs text-[var(--text-muted)] capitalize">{x.s}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 card p-1 rounded-xl w-fit">
        {['all', 'pending', 'reviewed', 'confirmed', 'dismissed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#F87171]/15 text-[#F87171]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No reports found" subtitle="All clear — no suspicious activity detected" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border)]"><th className="th">Reported Player</th><th className="th text-center">Engine Similarity</th><th className="th text-center">Suspicious Moves</th><th className="th text-center">Status</th><th className="th text-right">Date</th><th className="th text-center">Actions</th></tr></thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="tr">
                  <td className="td font-medium">{r.reported_name || 'Unknown'}</td>
                  <td className="td text-center">
                    <span className={`font-mono font-bold ${r.engine_similarity > 0.8 ? 'text-red-400' : r.engine_similarity > 0.6 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {r.engine_similarity ? `${Math.round(r.engine_similarity * 100)}%` : '—'}
                    </span>
                  </td>
                  <td className="td text-center text-sm">{r.suspicious_moves?.length || 0} moves</td>
                  <td className="td text-center"><span className={`badge text-xs ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                  <td className="td text-right text-sm text-[var(--text-muted)]">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="td text-center"><button onClick={() => setSelected(r)} className="btn-icon w-7 h-7"><Eye size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!!selected && <Modal onClose={() => setSelected(null)} title="Review Cheat Report">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg-hover)] rounded-xl space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Player</span><span className="font-medium">{selected.reported_name}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Engine Similarity</span><span className={`font-mono font-bold ${selected.engine_similarity > 0.8 ? 'text-red-400' : 'text-yellow-400'}`}>{selected.engine_similarity ? `${Math.round(selected.engine_similarity * 100)}%` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Suspicious Moves</span><span>{selected.suspicious_moves?.join(', ') || 'None flagged'}</span></div>
              {selected.notes && <div><span className="text-[var(--text-muted)]">Notes:</span><p className="mt-1">{selected.notes}</p></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateStatus.mutate({ id: selected.id, status: 'confirmed' })} className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm"><AlertTriangle size={14} />Confirm Cheating</button>
              <button onClick={() => updateStatus.mutate({ id: selected.id, status: 'dismissed' })} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"><XCircle size={14} />Dismiss</button>
            </div>
          </div>
        )}
      </Modal>}
    </div>
  )
}
