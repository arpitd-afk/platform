'use client'
import { CreditCard, CheckCircle2, AlertTriangle, Download } from 'lucide-react'
const INVOICES = [
  { id:'INV-007', period:'July 2024',     amount:'₹9,999', status:'paid',    date:'Jul 1, 2024' },
  { id:'INV-006', period:'June 2024',     amount:'₹9,999', status:'paid',    date:'Jun 1, 2024' },
  { id:'INV-005', period:'May 2024',      amount:'₹9,999', status:'paid',    date:'May 1, 2024' },
  { id:'INV-004', period:'April 2024',    amount:'₹9,999', status:'paid',    date:'Apr 1, 2024' },
  { id:'INV-003', period:'March 2024',    amount:'₹2,999', status:'paid',    date:'Mar 1, 2024' },
]
const PLANS = [
  { name:'Starter', price:'₹2,999/mo', students:'50 students', features:['Live Classrooms','Puzzle Trainer','Basic Analytics','Email Support'], current:false },
  { name:'Academy', price:'₹9,999/mo', students:'500 students', features:['All Starter features','AI Game Analysis','Tournament Engine','Parent Dashboard','Priority Support'], current:true },
  { name:'Enterprise', price:'Custom', students:'Unlimited', features:['All Academy features','White Label','Custom Domain','API Access','24/7 Support'], current:false },
]
export default function BillingPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><CreditCard size={22} className="text-[#A78BFA]"/>Billing & Plans</h1>
      <div className="card p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-[#6B6050]">Current Plan</div>
          <div className="font-display text-xl font-bold text-[#D4AF37] mt-0.5">Academy — ₹9,999/month</div>
          <div className="text-sm text-[#A09880] mt-1">142 / 500 students · Renews Aug 1, 2024</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-green-400 text-sm font-medium">Active</span>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(p=>(
          <div key={p.name} className={`card p-5 flex flex-col ${p.current?'border-[#D4AF37]/40 bg-[#D4AF37]/5':''}`}>
            {p.current && <div className="text-xs font-bold text-[#D4AF37] mb-2">✓ CURRENT PLAN</div>}
            <h3 className="font-semibold text-lg">{p.name}</h3>
            <div className="font-display text-2xl font-bold mt-1 mb-0.5">{p.price}</div>
            <div className="text-xs text-[#6B6050] mb-4">{p.students}</div>
            <ul className="space-y-2 flex-1 mb-4">
              {p.features.map(f=><li key={f} className="flex items-center gap-2 text-xs text-[#A09880]"><span className="text-green-400">✓</span>{f}</li>)}
            </ul>
            <button className={p.current?'btn-secondary text-sm':'btn-primary text-sm'}>{p.current?'Current Plan':'Upgrade'}</button>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]"><h3 className="section-title">Invoice History</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.07]"><th className="th">Invoice</th><th className="th">Period</th><th className="th text-right">Amount</th><th className="th text-center">Status</th><th className="th text-center">Actions</th></tr></thead>
          <tbody>
            {INVOICES.map(inv=>(
              <tr key={inv.id} className="tr">
                <td className="td font-mono text-sm text-[#A09880]">{inv.id}</td>
                <td className="td text-sm">{inv.period}</td>
                <td className="td text-right font-semibold">{inv.amount}</td>
                <td className="td text-center"><span className="badge-green text-xs"><CheckCircle2 size={10}/>Paid</span></td>
                <td className="td text-center"><button className="btn-icon w-7 h-7"><Download size={13}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
