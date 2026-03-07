'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, ChevronLeft, Building2, Users, Target } from 'lucide-react'

const steps = ['Academy Info', 'Your Details', 'Plan Selection', 'Done']

const plans = [
  { id: 'trial', name: 'Free Trial', desc: '14 days, all features, no card required', price: 'Free', color: '#4ADE80' },
  { id: 'starter', name: 'Starter', desc: 'Up to 50 students, 3 coaches', price: '₹999/mo', color: '#60A5FA' },
  { id: 'academy', name: 'Academy', desc: 'Up to 200 students, unlimited coaches', price: '₹2,499/mo', color: 'var(--amber)', popular: true },
  { id: 'enterprise', name: 'Enterprise', desc: 'Unlimited, custom branding, SLA', price: 'Custom', color: '#A78BFA' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    academyName: '', city: '', country: 'India', studentCount: '',
    website: '', name: '', email: '', phone: '', role: 'owner', plan: 'trial',
  })

  const update = (k: string, v: string) => setData(d => ({ ...d, [k]: v }))

  if (step === 3) return (
    <main className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="card p-12 space-y-6">
        <CheckCircle2 size={56} className="text-[var(--amber)] mx-auto" />
        <h1 className="font-display text-3xl font-bold">You're on the list!</h1>
        <p className="text-[var(--text-mid)]">We've received your request for <strong className="text-[var(--text)]">{data.academyName}</strong>. Our team will contact {data.email} within 24 hours to get you set up.</p>
        <div className="bg-[var(--amber)]/5 border border-[var(--amber)]/20 rounded-xl p-4 text-sm text-[var(--text-mid)]">
          <strong className="text-[var(--amber)]">What happens next?</strong>
          <ul className="mt-2 space-y-1 text-left">
            <li>• We'll email you a setup link</li>
            <li>• Onboarding call (30 min) with our team</li>
            <li>• Your academy is live within 24 hours</li>
          </ul>
        </div>
        <Link href="/login" className="btn-primary w-full block text-center">Go to Login</Link>
      </div>
    </main>
  )

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'bg-[var(--amber)] text-[var(--bg)]' : i === step ? 'bg-[var(--amber)]/20 text-[var(--amber)] border-2 border-[var(--amber)]' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden md:block ${i === step ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-[var(--amber)]' : 'bg-white/[0.08]'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <Building2 size={24} className="text-[var(--amber)]" />
              <h2 className="font-display text-2xl font-bold">About your academy</h2>
            </div>
            <div><label className="label">Academy / School Name *</label><input className="input" placeholder="Anand Chess Academy" value={data.academyName} onChange={e => update('academyName', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">City *</label><input className="input" placeholder="Bengaluru" value={data.city} onChange={e => update('city', e.target.value)} /></div>
              <div><label className="label">Country</label><input className="input" value={data.country} onChange={e => update('country', e.target.value)} /></div>
            </div>
            <div><label className="label">Approx. Number of Students</label>
              <select className="input" value={data.studentCount} onChange={e => update('studentCount', e.target.value)}>
                <option value="">Select range</option>
                <option value="1-20">1–20</option><option value="21-50">21–50</option>
                <option value="51-100">51–100</option><option value="100-200">100–200</option>
                <option value="200+">200+</option>
              </select>
            </div>
            <div><label className="label">Website (optional)</label><input className="input" placeholder="https://mychessacademy.com" value={data.website} onChange={e => update('website', e.target.value)} /></div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <Users size={24} className="text-[#60A5FA]" />
              <h2 className="font-display text-2xl font-bold">Your details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Your Name *</label><input className="input" placeholder="Viswanathan Anand" value={data.name} onChange={e => update('name', e.target.value)} /></div>
              <div><label className="label">Your Role</label>
                <select className="input" value={data.role} onChange={e => update('role', e.target.value)}>
                  <option value="owner">Academy Owner</option><option value="director">Director</option>
                  <option value="coach">Head Coach</option><option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div><label className="label">Email *</label><input className="input" type="email" placeholder="you@example.com" value={data.email} onChange={e => update('email', e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" placeholder="+91 98765 43210" value={data.phone} onChange={e => update('phone', e.target.value)} /></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Target size={24} className="text-[#A78BFA]" />
              <h2 className="font-display text-2xl font-bold">Choose a plan</h2>
            </div>
            {plans.map(plan => (
              <div key={plan.id} onClick={() => update('plan', plan.id)}
                className={`card-hover p-5 cursor-pointer transition-all ${data.plan === plan.id ? 'border-[var(--amber)]/60 bg-[var(--amber)]/5' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${data.plan === plan.id ? 'border-[var(--amber)] bg-[var(--amber)]' : 'border-white/30'}`}>
                      {data.plan === plan.id && <div className="w-2 h-2 rounded-full bg-[var(--bg)]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{plan.name}</span>
                        {plan.popular && <span className="badge-gold text-[10px]">Popular</span>}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{plan.desc}</div>
                    </div>
                  </div>
                  <div className="font-display font-bold" style={{ color: plan.color }}>{plan.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-30">
            <ChevronLeft size={15} /> Back
          </button>
          <button onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-2 text-sm">
            {step < 2 ? <><span>Continue</span><ChevronRight size={15} /></> : <span>Submit Request</span>}
          </button>
        </div>
      </div>
    </main>
  )
}
