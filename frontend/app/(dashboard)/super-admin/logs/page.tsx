'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityLogsAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { Activity, Search, RefreshCw, Filter } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  create: '#4ADE80', update: '#60A5FA', delete: '#F87171',
  login: '#D4AF37', logout: 'var(--text-mid)', suspend: '#F87171', activate: '#4ADE80',
}

function getActionColor(action: string) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action?.toLowerCase().includes(key)) return color
  }
  return 'var(--text-mid)'
}

export default function ActivityLogsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['activity-logs', page],
    queryFn: () => activityLogsAPI.list({ page, limit: 50 }).then((r: any) => r.data),
    staleTime: 10_000,
  })

  const logs = data?.logs || []
  const total = data?.total || 0

  const filtered = logs.filter((l: any) =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.academy_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Activity size={22} className="text-[#60A5FA]" />Activity Logs</h1>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input pl-9 text-sm" placeholder="Search by action, user, academy..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 px-3">
          <Filter size={12} />{total} total events
        </div>
      </div>

      {isLoading ? <PageLoading /> : filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="No activity yet" subtitle="Platform events will appear here as they happen" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border)]">
              <th className="th">Time</th><th className="th">Actor</th><th className="th">Action</th>
              <th className="th">Academy</th><th className="th">Entity</th><th className="th">IP</th>
            </tr></thead>
            <tbody>
              {filtered.map((log: any) => {
                const color = getActionColor(log.action)
                return (
                  <tr key={log.id} className="tr text-xs">
                    <td className="td font-mono text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="td">
                      <div className="font-medium text-sm">{log.actor_name || 'System'}</div>
                      <div className="text-[var(--text-muted)] text-xs capitalize">{log.actor_role?.replace('_', ' ')}</div>
                    </td>
                    <td className="td">
                      <span className="badge text-xs font-mono" style={{ background: `${color}15`, color }}>{log.action}</span>
                    </td>
                    <td className="td text-[var(--text-mid)]">{log.academy_name || '—'}</td>
                    <td className="td">
                      {log.entity_type && (
                        <div className="text-xs">
                          <span className="badge-gray capitalize">{log.entity_type}</span>
                          {log.entity_id && <div className="font-mono text-[var(--text-muted)] mt-0.5">{log.entity_id.slice(0, 8)}...</div>}
                        </div>
                      )}
                    </td>
                    <td className="td font-mono text-[var(--text-muted)] text-xs">{log.ip_address || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {total > 50 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5">Previous</button>
              <span className="text-xs text-[var(--text-muted)]">Page {page} of {Math.ceil(total / 50)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 50)} className="btn-secondary text-xs py-1.5">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
