'use client'
import { CreditCard, TrendingUp, Download, Crown } from 'lucide-react'
const SUBSCRIPTIONS = [
  {id:'1',academy:'Elite Chess Mumbai',plan:'academy',amount:'₹9,999',status:'active',nextBilling:'Aug 1'},
  {id:'2',academy:'Delhi Chess Academy',plan:'enterprise',amount:'₹49,999',status:'active',nextBilling:'Aug 1'},
  {id:'3',academy:'Bangalore Knights',plan:'trial',amount:'₹0',status:'trial',nextBilling:'Jul 28'},
  {id:'4',academy:'Chennai GM Club',plan:'academy',amount:'₹9,999',status:'active',nextBilling:'Aug 1'},
  {id:'5',academy:'Pune Chess Institute',plan:'starter',amount:'₹2,999',status:'inactive',nextBilling:'—'},
  {id:'6',academy:'Kolkata Chess Fed.',plan:'academy',amount:'₹9,999',status:'active',nextBilling:'Aug 1'},
]
const PLAN_C:any={trial:'#6B6050',starter:'#A09880',academy:'#60A5FA',enterprise:'#D4AF37'}
const PLANS=[
  {name:'Trial',price:'₹0',limit:'30 days',features:['10 students','Basic features']},
  {name:'Starter',price:'₹2,999/mo',limit:'50 students',features:['Live classrooms','Puzzles','Analytics']},
  {name:'Academy',price:'₹9,999/mo',limit:'500 students',features:['All Starter','AI Analysis','Tournaments','Parent portal']},
  {name:'Enterprise',price:'Custom',limit:'Unlimited',features:['All Academy','White label','API access','SLA']},
]
export default function SuperAdminBillingPage() {
  const active=SUBSCRIPTIONS.filter(s=>s.status==='active')
  const mrr=active.reduce((sum,s)=>sum+parseInt(s.amount.replace(/[₹,]/g,'')||'0'),0)
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><CreditCard size={22} className="text-[#4ADE80]"/>Billing Overview</h1>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Monthly Revenue',v:`₹${(mrr/1000).toFixed(0)}K`,c:'#4ADE80'},{l:'Active Subscribers',v:active.length,c:'#D4AF37'},{l:'Trial Academies',v:SUBSCRIPTIONS.filter(s=>s.status==='trial').length,c:'#60A5FA'},{l:'Churned',v:SUBSCRIPTIONS.filter(s=>s.status==='inactive').length,c:'#F87171'}].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div></div>
        ))}
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {PLANS.map(p=>(
          <div key={p.name} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              {p.name==='Enterprise'&&<Crown size={14} className="text-[#D4AF37]"/>}
              <h3 className="font-semibold">{p.name}</h3>
            </div>
            <div className="font-bold text-[#D4AF37] mb-0.5">{p.price}</div>
            <div className="text-xs text-[#6B6050] mb-3">{p.limit}</div>
            <ul className="space-y-1">{p.features.map(f=><li key={f} className="text-xs text-[#A09880]">✓ {f}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]"><h3 className="section-title">Active Subscriptions</h3><button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"><Download size={12}/>Export CSV</button></div>
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.07]"><th className="th">Academy</th><th className="th">Plan</th><th className="th text-right">MRR</th><th className="th text-center">Status</th><th className="th">Next Billing</th></tr></thead>
          <tbody>
            {SUBSCRIPTIONS.map(s=>(
              <tr key={s.id} className="tr">
                <td className="td font-medium">{s.academy}</td>
                <td className="td"><span className="badge text-xs capitalize" style={{background:`${PLAN_C[s.plan]}15`,color:PLAN_C[s.plan]}}>{s.plan}</span></td>
                <td className="td text-right font-mono">{s.amount}</td>
                <td className="td text-center"><span className={`badge text-xs ${s.status==='active'?'badge-green':s.status==='trial'?'badge-gold':'badge-gray'}`}>{s.status}</span></td>
                <td className="td text-[#A09880] text-sm">{s.nextBilling}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
