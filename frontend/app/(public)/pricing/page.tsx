import Link from 'next/link'
import { Check, Zap, Building2, Crown, X, Info } from 'lucide-react'

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

const comparisonData = [
  { feature: 'Active Students', starter: '50', academy: '200', enterprise: 'Unlimited' },
  { feature: 'Coach Seats', starter: '3', academy: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Live Classrooms', starter: true, academy: true, enterprise: true },
  { feature: 'Tournament hosting', starter: false, academy: true, enterprise: true },
  { feature: 'Parent Dashboard', starter: false, academy: true, enterprise: true },
  { feature: 'Anti-Cheat Pro', starter: false, academy: true, enterprise: true },
  { feature: 'Custom Branding', starter: false, academy: false, enterprise: true },
  { feature: 'Analytics API', starter: false, academy: false, enterprise: true },
  { feature: 'Priority Support', starter: 'Email', academy: 'Priority', enterprise: '24/7 Dedicated' },
]

export default function PricingPage() {
  return (
    <div className="bg-surface-50">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 lg:pt-24 lg:pb-20 text-center">
         <h1 className="font-display text-5xl lg:text-6xl font-black mb-8 tracking-tight text-surface-900 leading-[1.1]">Simple, Transparent <br/><span className="text-gold-gradient">Pricing</span></h1>
         <p className="text-surface-500 text-lg lg:text-xl max-w-2xl mx-auto font-medium">Start free for 14 days. No credit card required. <br/>Upgrade, downgrade, or cancel anytime.</p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-20 lg:pb-24">
        <div className="grid md:grid-cols-3 gap-10 items-stretch">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative bg-white rounded-[3rem] p-12 border transition-all duration-300 hover:shadow-premium flex flex-col ${plan.popular ? 'border-amber shadow-xl lg:scale-105 z-10' : 'border-surface-200'}`}>
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">MOST POPULAR</div>
              )}
              <div className="mb-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10 bg-white shadow-sm border border-surface-100" style={{ background: `${plan.color}15` }}>
                   <plan.Icon size={32} style={{ color: plan.color }} />
                </div>
                <h2 className="font-display text-4xl font-bold mb-3 text-surface-900">{plan.name}</h2>
                <p className="text-sm text-surface-400 font-bold uppercase tracking-widest mb-10">{plan.desc}</p>
                
                <div className="flex items-baseline gap-2 mb-4">
                  {plan.price ? (
                    <>
                      <span className="text-5xl font-black text-surface-900">₹{plan.price.toLocaleString()}</span>
                      <span className="text-surface-400 text-xl font-bold">/mo</span>
                    </>
                  ) : (
                    <span className="text-4xl font-black text-surface-900">Custom</span>
                  )}
                </div>
                {plan.yearly && (
                  <div className="text-[11px] text-green-600 font-black bg-green-50 px-4 py-1.5 rounded-full inline-block uppercase tracking-widest">
                    Best Value: ₹{plan.yearly.toLocaleString()}/year
                  </div>
                )}
              </div>

              <ul className="space-y-5 mb-12 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-4 text-sm text-surface-600 font-bold">
                    <Check size={20} className="text-gold flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href={plan.href || '/onboarding'}
                className={`block text-center py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-md ${plan.popular ? 'btn-primary shadow-gold/20' : 'btn-secondary'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-white border-y border-surface-200 py-20 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold mb-6 tracking-tight text-surface-900">Detailed Comparison</h2>
            <p className="text-surface-500 text-lg font-medium">Pick the plan that fits your academy's scale.</p>
          </div>
          
          <div className="overflow-x-auto rounded-[3rem] border border-surface-200 shadow-premium">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50">
                  <th className="p-10 text-xs font-black uppercase tracking-widest border-b border-surface-200 text-surface-400 font-sans">Features</th>
                  <th className="p-10 text-xs font-black uppercase tracking-widest border-b border-surface-200 text-center text-surface-900 font-sans">Starter</th>
                  <th className="p-10 text-xs font-black uppercase tracking-widest border-b border-surface-200 text-center text-amber font-sans">Academy</th>
                  <th className="p-10 text-xs font-black uppercase tracking-widest border-b border-surface-200 text-center text-surface-900 font-sans">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="hover:bg-surface-50/50 transition-colors">
                    <td className="p-10 text-lg font-bold text-surface-900 flex items-center gap-3">
                       {row.feature}
                       <Info size={16} className="text-surface-300 cursor-help" />
                    </td>
                    <td className="p-10 text-lg text-center font-bold">
                       {typeof row.starter === 'boolean' ? (row.starter ? <Check size={24} className="mx-auto text-blue-500" /> : <X size={24} className="mx-auto text-surface-200" />) : <span className="text-surface-500">{row.starter}</span>}
                    </td>
                    <td className="p-10 text-lg text-center font-bold bg-amber/5">
                       {typeof row.academy === 'boolean' ? (row.academy ? <Check size={24} className="mx-auto text-amber" /> : <X size={24} className="mx-auto text-surface-200" />) : <span className="text-surface-900">{row.academy}</span>}
                    </td>
                    <td className="p-10 text-lg text-center font-bold">
                       {typeof row.enterprise === 'boolean' ? (row.enterprise ? <Check size={24} className="mx-auto text-purple-500" /> : <X size={24} className="mx-auto text-surface-200" />) : <span className="text-surface-500">{row.enterprise}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-6 py-24 lg:py-32">
        <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-center mb-20 tracking-tight text-surface-900">Common Questions</h2>
        <div className="grid md:grid-cols-2 gap-10">
          {[
            { q: 'Can I change plans later?', a: 'Yes, upgrade or downgrade at any time. Changes take effect at the next billing cycle.' },
            { q: 'Is there a free trial?', a: 'All plans include a 14-day free trial with full access. No credit card required.' },
            { q: 'How does seat pricing work?', a: 'Seats are counted by active students in a billing period. Inactive students do not count.' },
            { q: 'Discounts for NGOs or schools?', a: 'Yes! We offer special pricing for registered non-profits. Contact us to learn more.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white p-10 rounded-[2.5rem] border border-surface-200 hover:border-amber/20 transition-all group shadow-sm">
              <h3 className="text-xl font-black mb-4 group-hover:text-amber transition-colors text-surface-900 leading-tight">{q}</h3>
              <p className="text-surface-500 leading-relaxed font-bold text-sm">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto bg-surface-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold opacity-10 blur-[150px]" />
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold opacity-10 blur-[150px]" />
           <h2 className="text-white text-3xl lg:text-5xl font-extrabold mb-10 tracking-tight leading-[1.1]">Ready to scale up?</h2>
           <p className="text-surface-400 text-lg lg:text-xl mb-14 max-w-2xl mx-auto font-medium">Join 500+ academies scaling with our professional system.</p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/onboarding" className="btn-primary px-16 py-6 text-xl font-black shadow-2xl shadow-gold/30 w-full sm:w-auto">Start Free Trial</Link>
              <Link href="/contact" className="btn-secondary border-surface-700 text-white hover:bg-surface-800 px-16 py-6 text-xl font-black w-full sm:w-auto">Talk to Sales</Link>
           </div>
        </div>
      </section>
    </div>
  )
}
