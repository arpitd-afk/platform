'use client'
import { Loader2, AlertCircle, Inbox } from 'lucide-react'

export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
      <Loader2 size={15} className="animate-spin" style={{ color: 'var(--amber)' }} />
      <span>{text}</span>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--amber)' }} />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
      </div>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', subtitle = 'Please try refreshing the page' }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#FEE2E2' }}>
        <AlertCircle size={22} style={{ color: 'var(--error)' }} />
      </div>
      <h3 className="font-semibold text-base" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', subtitle = '', action }: { title?: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-subtle)' }}>
        <Inbox size={22} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="font-semibold text-base" style={{ color: 'var(--text)' }}>{title}</h3>
      {subtitle && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
