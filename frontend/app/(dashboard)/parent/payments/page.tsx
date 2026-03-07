'use client'
import { useMyInvoices } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { Wallet, Download, CheckCircle2 } from 'lucide-react'

export default function ParentPaymentsPage() {
  const { data: invoices = [], isLoading } = useMyInvoices()
  if (isLoading) return <PageLoading />
  const total = invoices.reduce((s: number, i: any) => s + parseFloat(i.amount || 0), 0)
  const pending = invoices.filter((i: any) => i.status === 'pending').reduce((s: number, i: any) => s + parseFloat(i.amount || 0), 0)
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Wallet size={22} className="text-[#4ADE80]" />Payments</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Total Paid', v: `₹${total.toLocaleString()}`, c: '#4ADE80' },
          { l: 'Pending', v: `₹${pending.toLocaleString()}`, c: '#D4AF37' },
          { l: 'Invoices', v: invoices.length, c: '#60A5FA' },
        ].map(s => (
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div><div className="text-xs text-[var(--text-muted)]">{s.l}</div></div>
        ))}
      </div>
      {invoices.length === 0 ? (
        <div className="card"><EmptyState title="No invoices yet" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border)]"><th className="th">Invoice</th><th className="th">Description</th><th className="th text-right">Amount</th><th className="th text-center">Status</th><th className="th text-center">Actions</th></tr></thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="tr">
                  <td className="td font-mono text-sm text-[var(--text-mid)]">INV-{inv.id.slice(0, 6).toUpperCase()}</td>
                  <td className="td text-sm">{inv.description || (inv.billing_period_start ? new Date(inv.billing_period_start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Monthly fee')}</td>
                  <td className="td text-right font-semibold">₹{parseFloat(inv.amount || 0).toLocaleString()}</td>
                  <td className="td text-center"><span className={`badge text-xs ${inv.status === 'paid' ? 'badge-green' : inv.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>{inv.status}</span></td>
                  <td className="td text-center"><button className="btn-icon w-7 h-7"><Download size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
