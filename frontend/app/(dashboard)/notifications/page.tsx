'use client'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import { Bell, CheckCheck, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const NOTIF_ICONS: Record<string, string> = {
  game: '♟', class: '📹', tournament: '🏆', assignment: '📋', system: '🔔', payment: '💳',
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications({ limit: 50 })
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  if (isLoading) return <PageLoading />

  const unread = notifications.filter((n: any) => !n.is_read)

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <Bell size={22} style={{ color: 'var(--amber)' }} />
          Notifications
          {unread.length > 0 && (
            <span className="badge badge-gold text-xs">{unread.length} new</span>
          )}
        </h1>
        {unread.length > 0 && (
          <button onClick={() => markAll.mutate()} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck size={14} />Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={40} className="mx-auto mb-3" style={{ color: 'var(--border-md)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>No notifications</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {notifications.map((n: any, i: number) => (
            <div key={n.id}
              className="flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer"
              style={{
                background: !n.is_read ? 'rgba(200,150,30,0.04)' : 'white',
                borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              onMouseEnter={e => (e.currentTarget as any).style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => (e.currentTarget as any).style.background = !n.is_read ? 'rgba(200,150,30,0.04)' : 'white'}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: 'var(--bg-subtle)' }}>
                {NOTIF_ICONS[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ fontWeight: !n.is_read ? 600 : 400, color: 'var(--text)' }}>{n.title}</p>
                {n.body && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.body}</p>}
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center">
                {!n.is_read
                  ? <div className="w-2 h-2 rounded-full" style={{ background: 'var(--amber)' }} />
                  : <Check size={14} style={{ color: 'var(--border-md)' }} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
