'use client'
import { useAcademies, usePlans } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { CreditCard, Crown, Download } from 'lucide-react'

export default function SuperAdminBillingPage() {
  const { data: academies = [], isLoading: aLoad } = useAcademies({})
  const { data: plans = [], isLoading: pLoad } = usePlans()
  if (aLoad || pLoad) return <PageLoading />

  const paid = academies.filter((a: any) => a.plan !== 'trial')
  const totalMRR = paid.reduce((s: number, a: any) => {
    const plan = plans.find((p: any) => p.slug === a.plan)
    return s + (plan?.price_monthly || 0)
  }, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><CreditCard size={22} className="text-[#7C3AED]" />Billing Overview</h1>
      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'MRR (est.)', v: `₹${(totalMRR / 100).toFixed(0)}K`, c: '#4ADE80' },
          { l: 'Paid Accounts', v: paid.length, c: '#D4AF37' },
          { l: 'Trial Accounts', v: academies.filter((a: any) => a.plan === 'trial').length, c: '#60A5FA' },
          { l: 'Enterprise', v: academies.filter((a: any) => a.plan === 'enterprise').length, c: '#A78BFA' },
        ].map(s => (
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div><div className="text-xs text-[var(--text-muted)]">{s.l}</div></div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">Subscription Plans</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {plans.map((p: any) => (
            <div key={p.id} className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                {p.slug === 'enterprise' && <Crown size={14} className="text-[var(--amber)]" />}
                <h4 className="font-semibold capitalize">{p.name}</h4>
              </div>
              <div className="font-display text-xl font-bold text-[var(--amber)] mb-0.5">
                {p.price_monthly ? `₹${p.price_monthly}/mo` : 'Custom'}
              </div>
              <div className="text-xs text-[var(--text-muted)] mb-3">{p.max_students === -1 ? 'Unlimited' : p.max_students} students</div>
              <div className="text-xs font-bold text-[var(--amber)]">
                {academies.filter((a: any) => a.plan === p.slug).length} academies
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]"><h3 className="section-title">Subscribed Academies</h3></div>
        {paid.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No paid academies yet</div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border)]"><th className="th">Academy</th><th className="th">Owner</th><th className="th text-center">Students</th><th className="th text-center">Plan</th><th className="th text-right">Revenue</th></tr></thead>
            <tbody>
              {paid.map((a: any) => {
                const plan = plans.find((p: any) => p.slug === a.plan)
                return (
                  <tr key={a.id} className="tr">
                    <td className="td font-medium text-sm">{a.name}</td>
                    <td className="td text-sm text-[var(--text-mid)]">{a.owner_name}</td>
                    <td className="td text-center text-sm">{a.student_count || 0}</td>
                    <td className="td text-center"><span className="badge-gold text-xs capitalize">{a.plan}</span></td>
                    <td className="td text-right font-semibold text-[#4ADE80]">{plan?.price_monthly ? `₹${plan.price_monthly}/mo` : 'Custom'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
