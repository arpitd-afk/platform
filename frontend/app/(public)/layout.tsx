import Link from 'next/link'
import { Crown } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <nav style={{ background: '#FFFCF8', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,150,30,0.15)', border: '1px solid rgba(200,150,30,0.25)' }}>
              <Crown size={18} style={{ color: 'var(--amber)' }} />
            </div>
            <span className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Chess Academy Pro</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            {['features', 'pricing', 'blog', 'contact'].map(l => (
              <Link key={l} href={`/${l}`} className="capitalize hover:text-[var(--text)] transition-colors">{l}</Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Login</Link>
            <Link href="/onboarding" className="btn-primary text-sm">Start Free Trial</Link>
          </div>
        </div>
      </nav>
      {children}
      <footer style={{ background: '#FFFCF8', borderTop: '1px solid var(--border)' }} className="py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown size={15} style={{ color: 'var(--amber)' }} />
            <span className="font-display font-bold text-sm">Chess Academy Pro</span>
          </div>
          <div className="flex gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            {['Features', 'Pricing', 'Blog', 'Contact'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:underline">{l}</Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2025 Chess Academy Pro</p>
        </div>
      </footer>
    </div>
  )
}
