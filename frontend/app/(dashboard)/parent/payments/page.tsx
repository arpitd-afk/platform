'use client'
import { CreditCard, Download, CheckCircle2 } from 'lucide-react'
const INVOICES = [
  {id:'INV-014',desc:'Monthly Fee — July 2024 (2 children)',amount:'₹7,000',date:'Jul 1, 2024',status:'paid'},
  {id:'INV-013',desc:'Tournament Entry — Summer Open 2024',amount:'₹1,000',date:'Jun 28, 2024',status:'paid'},
  {id:'INV-012',desc:'Monthly Fee — June 2024 (2 children)',amount:'₹7,000',date:'Jun 1, 2024',status:'paid'},
  {id:'INV-011',desc:'Monthly Fee — May 2024 (2 children)',amount:'₹7,000',date:'May 1, 2024',status:'paid'},
  {id:'INV-010',desc:'Monthly Fee — April 2024 (Arjun only)',amount:'₹3,500',date:'Apr 1, 2024',status:'paid'},
]
export default function PaymentsPage() {
  const total = INVOICES.reduce((s,i)=>s+parseInt(i.amount.replace(/[₹,]/g,'')),0)
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><CreditCard size={22} className="text-[#A78BFA]"/>Payments</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          {l:'Total Paid (2024)',v:`₹${(total/1000).toFixed(0)}K`,c:'#4ADE80'},
          {l:'Invoices',v:INVOICES.length,c:'#60A5FA'},
          {l:'Next Due',v:'Aug 1',c:'#D4AF37'},
        ].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div></div>
        ))}
      </div>
      <div className="card p-5 flex items-center justify-between border-[#D4AF37]/30">
        <div>
          <div className="text-sm text-[#6B6050]">Next Payment</div>
          <div className="font-semibold mt-0.5">Monthly Fee — August 2024 (2 children)</div>
          <div className="font-display text-xl font-bold text-[#D4AF37] mt-1">₹7,000</div>
        </div>
        <button className="btn-primary">Pay Now</button>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]"><h3 className="section-title">Payment History</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.07]"><th className="th">Invoice</th><th className="th">Description</th><th className="th text-right">Amount</th><th className="th text-center">Status</th><th className="th text-center">Receipt</th></tr></thead>
          <tbody>
            {INVOICES.map(inv=>(
              <tr key={inv.id} className="tr">
                <td className="td font-mono text-xs text-[#A09880]">{inv.id}</td>
                <td className="td text-sm">{inv.desc}</td>
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
