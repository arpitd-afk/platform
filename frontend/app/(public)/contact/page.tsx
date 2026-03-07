'use client'
import { useState } from 'react'
import { Mail, Phone, MessageSquare, MapPin, Send, CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', academy: '', message: '', type: 'general' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production this would POST to /api/contact
    setSent(true)
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="font-display text-5xl font-bold mb-4">Get in Touch</h1>
        <p className="text-[var(--text-mid)] text-lg">We'd love to hear from you. Our team usually responds within a few hours.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-[var(--text-mid)] text-sm leading-relaxed mb-8">
              Whether you're looking to onboard your academy, need technical help, or want to discuss enterprise pricing — our team is here to help.
            </p>
          </div>
          {[
            { icon: Mail, label: 'Email', value: 'hello@chessacademy.pro', color: 'var(--amber)' },
            { icon: Phone, label: 'Phone', value: '+91 98765 43210', color: '#60A5FA' },
            { icon: MessageSquare, label: 'Live Chat', value: 'Available Mon–Sat 9am–6pm IST', color: '#4ADE80' },
            { icon: MapPin, label: 'Office', value: 'Bengaluru, Karnataka, India', color: '#A78BFA' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">{label}</div>
                <div className="text-sm font-medium">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="card p-8">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 size={48} className="text-green-400 mx-auto" />
              <h3 className="font-display text-2xl font-bold">Message Sent!</h3>
              <p className="text-[var(--text-mid)] text-sm">We'll get back to you within 24 hours.</p>
              <button onClick={() => setSent(false)} className="btn-secondary text-sm">Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-display text-xl font-bold mb-2">Send us a message</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Your Name</label>
                  <input className="input" placeholder="Viswanathan Anand" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Academy / School Name</label>
                <input className="input" placeholder="Anand Chess Academy" value={form.academy} onChange={e => setForm(f => ({ ...f, academy: e.target.value }))} />
              </div>
              <div>
                <label className="label">Inquiry Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="general">General Question</option>
                  <option value="demo">Request a Demo</option>
                  <option value="pricing">Pricing & Plans</option>
                  <option value="enterprise">Enterprise / School</option>
                  <option value="support">Technical Support</option>
                </select>
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input min-h-[120px] resize-none" placeholder="Tell us about your academy and what you're looking for..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Send size={15} /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
