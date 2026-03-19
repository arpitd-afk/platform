'use client'
import { useState } from 'react'
import { Mail, Phone, MessageSquare, MapPin, Send, CheckCircle2, Globe, MessageCircle, ChevronDown } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', academy: '', message: '', type: 'general' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production this would POST to /api/contact
    setSent(true)
  }

  return (
    <div className="bg-surface-50 min-h-[calc(100vh-80px)]">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-12 lg:pt-24 lg:pb-20 text-center">
        <h1 className="font-display text-5xl lg:text-6xl font-black mb-8 tracking-tight text-surface-900 leading-[1.1]">Get in <span className="text-gold-gradient">Touch</span></h1>
        <p className="text-surface-500 text-lg lg:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Ready to elevate your academy? Our expert team is here to guide 
          you through every step of your digital transformation.
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-start pb-24 lg:pb-48">
        {/* Contact info & Community */}
        <div className="space-y-16">
          <div className="space-y-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-surface-900">Reach Out Direct</h2>
            <p className="text-surface-500 font-bold text-lg leading-relaxed">
              Skip the queue. Connect with us through your preferred channel. 
              We&apos;re active Monday through Saturday, 9 AM to 6 PM IST.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Mail, label: 'Email', value: 'hello@chessacademy.pro', color: 'var(--amber)' },
                { icon: Phone, label: 'Phone', value: '+91 98765 43210', color: '#60A5FA' },
                { icon: MessageSquare, label: 'Live Chat', value: 'Available 9am–6pm IST', color: '#4ADE80' },
                { icon: MapPin, label: 'Global HQ', value: 'Bengaluru, KA, India', color: '#A78BFA' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white p-8 rounded-[2rem] border border-surface-200 shadow-sm transition-all hover:border-gold/30 hover:shadow-premium group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background: `${color}15` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="text-[10px] text-surface-400 font-black uppercase tracking-[0.2em] mb-2">{label}</div>
                  <div className="text-base font-black text-surface-900 leading-snug">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 blur-[100px]" />
             <h3 className="text-2xl font-extrabold mb-6 tracking-tight">Join our Community</h3>
             <p className="text-surface-400 text-lg mb-10 font-medium leading-relaxed">
               Connect with 2,000+ academy owners and top coaches. 
               Share strategies and get exclusive early access to our pro features.
             </p>
             <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] px-10 py-5 rounded-2xl font-black text-base transition-all shadow-xl">
                   <Globe size={24} /> Discord
                </button>
                <button className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5C] px-10 py-5 rounded-2xl font-black text-base transition-all shadow-xl">
                   <MessageCircle size={24} /> WhatsApp
                </button>
             </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-12 lg:p-16 rounded-[3.5rem] border border-surface-200 shadow-premium">
          {sent ? (
            <div className="text-center py-20 space-y-8">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-extrabold tracking-tight text-surface-900">Success!</h3>
                <p className="text-surface-500 text-xl font-medium">Thank you for reaching out. An expert from our team will contact you within the hour.</p>
              </div>
              <button onClick={() => setSent(false)} className="btn-secondary px-10 py-4 font-black text-lg">Send Another Message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                 <h3 className="text-2xl font-extrabold tracking-tight text-surface-900">Send a message</h3>
                 <p className="text-surface-500 font-bold">Expect a response within 60 minutes.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-surface-400 uppercase tracking-widest">Your Name</label>
                  <input className="input h-14 bg-surface-50 border-surface-100 font-bold" placeholder="Magnus Carlsen" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-surface-400 uppercase tracking-widest">Work Email</label>
                  <input className="input h-14 bg-surface-50 border-surface-100 font-bold" type="email" placeholder="you@academy.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest">Academy Name</label>
                <input className="input h-14 bg-surface-50 border-surface-100 font-bold" placeholder="Grandmaster Chess Academy" value={form.academy} onChange={e => setForm(f => ({ ...f, academy: e.target.value }))} />
              </div>
              <div className="space-y-3 relative">
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest">How can we help?</label>
                <select className="input h-14 bg-surface-50 border-surface-100 font-bold appearance-none pr-10" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="general">General Inquiry</option>
                  <option value="demo">Request a Personal Demo</option>
                  <option value="pricing">Pricing & Institutional Plans</option>
                  <option value="enterprise">Partnership Opportunities</option>
                  <option value="support">Technical Coaching Support</option>
                </select>
                <div className="absolute right-4 bottom-4 pointer-events-none text-surface-300">
                  <ChevronDown size={20} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest">Message</label>
                <textarea className="input bg-surface-50 border-surface-100 font-bold min-h-[180px] pt-4 resize-none" placeholder="Tell us about your academy&apos;s goals..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              <button type="submit" className="btn-primary w-full py-6 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-2xl shadow-gold/20 active:scale-[0.98]">
                <Send size={24} /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
