import Link from 'next/link'
import { Check, Zap, Building2, Crown } from 'lucide-react'

const plans = [
  {
    name: 'Starter', Icon: Zap, price: 999, yearly: 9999,
    color: '#60A5FA', desc: 'Perfect for small academies just getting started',
    features: ['Up to 50 students', '3 coaches', 'Live classrooms', 'Assignments & puzzles',
      'Student progress reports', 'Email support'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Academy', Icon: Building2, price: 2499, yearly: 24999, popular: true,
    color: 'var(--amber)', desc: 'Everything you need to run a full-scale chess academy',
    features: ['Up to 200 students', 'Unlimited coaches', 'Live classrooms', 'Tournament hosting',
      'Parent dashboard', 'Advanced analytics', 'Anti-cheat system', 'Priority support'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise', Icon: Crown, price: null, yearly: null,
    color: '#A78BFA', desc: 'For large schools and national federations',
    features: ['Unlimited students', 'Unlimited coaches', 'Custom branding & white-label',
      'Dedicated server', 'API access', 'Custom integrations', 'SLA guarantee', '24/7 support'],
    cta: 'Contact Sales', href: '/contact',
  },
]

export default function PricingPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="font-display text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-[var(--text-mid)] text-lg max-w-xl mx-auto">Start free for 14 days. No credit card required. Cancel anytime.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <div key={plan.name} className={`card p-8 relative ${plan.popular ? 'border-[var(--amber)]/40 shadow-[0_0_40px_rgba(212,175,55,0.08)]' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--amber)] text-[var(--bg)] text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
            )}
            <plan.Icon size={28} style={{ color: plan.color }} className="mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">{plan.name}</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">{plan.desc}</p>
            <div className="mb-8">
              {plan.price ? (
                <>
                  <span className="font-display text-4xl font-bold" style={{ color: plan.color }}>₹{plan.price.toLocaleString()}</span>
                  <span className="text-[var(--text-muted)] text-sm">/month</span>
                  <div className="text-xs text-[var(--text-muted)] mt-1">₹{plan.yearly?.toLocaleString()}/year — save 17%</div>
                </>
              ) : (
                <span className="font-display text-3xl font-bold" style={{ color: plan.color }}>Custom</span>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-mid)]">
                  <Check size={15} style={{ color: plan.color }} className="mt-0.5 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href={plan.href || '/register'}
              className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? 'bg-[var(--amber)] text-[var(--bg)] hover:bg-[#F0D060]' : 'bg-[var(--bg-subtle)] border border-[var(--border-md)] hover:bg-[var(--bg-hover)]'}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-24">
        <h2 className="font-display text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { q: 'Can I change plans later?', a: 'Yes, upgrade or downgrade at any time. Changes take effect at the next billing cycle.' },
            { q: 'Is there a free trial?', a: 'All plans include a 14-day free trial with full access. No credit card required.' },
            { q: 'How does seat pricing work?', a: 'Seats are counted by active students in a billing period. Inactive students do not count.' },
            { q: 'Discounts for NGOs or schools?', a: 'Yes! We offer special pricing for registered non-profits. Contact us to learn more.' },
          ].map(({ q, a }) => (
            <div key={q} className="card p-6">
              <h3 className="font-semibold mb-2">{q}</h3>
              <p className="text-sm text-[var(--text-muted)]">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
