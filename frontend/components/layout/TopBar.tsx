'use client'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNotifications, useMarkAllRead, useUnreadCount } from '@/lib/hooks'
import Avatar from '@/components/shared/Avatar'
import Link from 'next/link'
import { Bell, Search, Settings, LogOut, X, ChevronDown, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function TopBar() {
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { data: notifications = [] } = useNotifications({ limit: 6 })
  const { data: unreadCount = 0 } = useUnreadCount()
  const markAll = useMarkAllRead()
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const ROLE_COLOR: Record<string,string> = { super_admin:'#7C3AED', academy_admin:'#9A6E00', coach:'#15803D', student:'#1D4ED8', parent:'#BE185D' }
  const roleColor = ROLE_COLOR[user?.role || ''] || '#9A6E00'

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 lg:pl-6 pl-14"
      style={{ background: '#FFFCF8', borderBottom: '1px solid var(--border)' }}>
      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input placeholder="Search..." className="input pl-9 h-9 text-sm w-52"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} />
      </div>
      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        {/* ELO badge */}
        {user?.rating && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg mr-1"
            style={{ background: 'rgba(200,150,30,0.10)', border: '1px solid rgba(200,150,30,0.20)' }}>
            <Star size={12} style={{ color: 'var(--amber)' }} />
            <span className="text-xs font-bold font-mono" style={{ color: 'var(--amber)' }}>{user.rating}</span>
          </div>
        )}

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className="btn-icon relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--amber)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 card shadow-lg z-50 overflow-hidden animate-slide-up" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="font-semibold text-sm">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && <button onClick={() => markAll.mutate()} className="text-xs hover:underline" style={{ color: 'var(--amber)' }}>Mark all read</button>}
                  <button onClick={() => setNotifOpen(false)} className="btn-icon w-7 h-7"><X size={13} /></button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</div>
                ) : notifications.map((n: any) => (
                  <div key={n.id} className="px-4 py-3 transition-colors" style={{ borderBottom: '1px solid var(--border)', background: !n.is_read ? 'rgba(200,150,30,0.04)' : '' }}
                    onMouseEnter={e => (e.currentTarget as any).style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => (e.currentTarget as any).style.background = !n.is_read ? 'rgba(200,150,30,0.04)' : ''}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm" style={{ fontWeight: !n.is_read ? 600 : 400, color: 'var(--text)' }}>{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--amber)' }} />}
                    </div>
                    {n.body && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{n.body}</p>}
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
              <Link href="/notifications" onClick={() => setNotifOpen(false)}
                className="block px-4 py-2.5 text-center text-xs hover:underline" style={{ borderTop: '1px solid var(--border)', color: 'var(--amber)' }}>
                View all
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl transition-colors"
            onMouseEnter={e => (e.currentTarget as any).style.background = 'var(--bg-hover)'}
            onMouseLeave={e => (e.currentTarget as any).style.background = ''}>
            <Avatar user={user} size="sm" />
            <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-52 card shadow-lg z-50 py-1 animate-slide-up">
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{user?.name}</div>
                <div className="text-xs capitalize mt-0.5" style={{ color: roleColor }}>{user?.role?.replace('_', ' ')}</div>
              </div>
              {[
                { href: '/profile', label: 'My Profile' },
                { href: '/notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-mid)' }}
                  onMouseEnter={e => (e.currentTarget as any).style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => (e.currentTarget as any).style.background = ''}>
                  {item.label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
                <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background = '#FEE2E2'; (e.currentTarget as any).style.color = '#DC2626' }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background = ''; (e.currentTarget as any).style.color = 'var(--text-muted)' }}>
                  <LogOut size={14} />Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
