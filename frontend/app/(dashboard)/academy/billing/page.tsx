'use client'
import { useAuth } from '@/lib/auth-context'
import { useAcademy, usePlans, useInvoices, useUpgradePlan } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import { CreditCard, CheckCircle2, Download, Crown, Loader2 } from 'lucide-react'

export default function BillingPage() {
  const { user } = useAuth()
  const { data: academy, isLoading: aLoading } = useAcademy(user?.academyId)
  const { data: plans = [], isLoading: pLoading } = usePlans()
  const { data: invoices = [], isLoading: iLoading } = useInvoices(user?.academyId)
  const upgrade = useUpgradePlan()

  if (aLoading || pLoading) return <PageLoading />

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><CreditCard size={22} className="text-[#7C3AED]" />Billing & Plans</h1>

      {academy && (
        <div className="card p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--text-muted)]">Current Plan</div>
            <div className="font-display text-xl font-bold text-[var(--amber)] mt-0.5 capitalize">{academy.plan}</div>
            <div className="text-sm text-[var(--text-mid)] mt-1">{academy.student_count || 0} / {academy.max_students || 50} students</div>
          </div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400" /><span className="text-green-400 text-sm font-medium">Active</span></div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p: any) => {
            const isCurrent = academy?.plan === p.slug
            return (
              <div key={p.id} className={`card p-5 flex flex-col ${isCurrent ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5' : ''}`}>
                {isCurrent && <div className="text-xs font-bold text-[var(--amber)] mb-2">✓ CURRENT PLAN</div>}
                {p.slug === 'enterprise' && <Crown size={16} className="text-[var(--amber)] mb-2" />}
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <div className="font-display text-2xl font-bold mt-1 mb-0.5">{p.price_monthly ? `₹${p.price_monthly}/mo` : 'Custom'}</div>
                <div className="text-xs text-[var(--text-muted)] mb-4">{p.max_students === -1 ? 'Unlimited' : p.max_students} students</div>
                {Array.isArray(p.features) && (
                  <ul className="space-y-2 flex-1 mb-4">{p.features.map((f: string) => <li key={f} className="flex items-center gap-2 text-xs text-[var(--text-mid)]"><span className="text-green-400">✓</span>{f.replace(/_/g, ' ')}</li>)}</ul>
                )}
                <button
                  disabled={isCurrent || upgrade.isPending}
                  onClick={() => user?.academyId && upgrade.mutate({ academyId: user.academyId, plan: p.slug })}
                  className={isCurrent ? 'btn-secondary text-sm cursor-not-allowed opacity-60' : 'btn-primary text-sm'}>
                  {isCurrent ? 'Current Plan' : upgrade.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Upgrade'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]"><h3 className="section-title">Invoice History</h3></div>
        {iLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No invoices yet</div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border)]"><th className="th">Invoice</th><th className="th">Period</th><th className="th text-right">Amount</th><th className="th text-center">Status</th><th className="th text-center">Actions</th></tr></thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="tr">
                  <td className="td font-mono text-sm text-[var(--text-mid)]">INV-{inv.id.slice(0, 6).toUpperCase()}</td>
                  <td className="td text-sm">{inv.billing_period_start ? new Date(inv.billing_period_start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</td>
                  <td className="td text-right font-semibold">₹{parseFloat(inv.amount).toLocaleString()}</td>
                  <td className="td text-center"><span className={`badge text-xs ${inv.status === 'paid' ? 'badge-green' : inv.status === 'pending' ? 'badge-gold' : 'badge-red'}`}><CheckCircle2 size={10} />{inv.status}</span></td>
                  <td className="td text-center"><button className="btn-icon w-7 h-7"><Download size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
