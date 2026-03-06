'use client'

import { useState } from 'react'
import { Building2, Search, CheckCircle, XCircle, Crown, Globe, Eye, Pause, Play, Edit, ExternalLink, Plus } from 'lucide-react'

const ACADEMIES = [
  { id: '1', name: 'Elite Chess Mumbai',    sub: 'elite-chess', owner: 'Rahul Sharma', plan: 'academy',    students: 142, coaches: 8,  revenue: 102000, active: true },
  { id: '2', name: 'Delhi Chess Academy',   sub: 'delhi-chess', owner: 'Priya Patel',  plan: 'enterprise', students: 380, coaches: 22, revenue: 450000, active: true },
  { id: '3', name: 'Bangalore Knights',     sub: 'blr-knights', owner: 'Vikram Nair',  plan: 'trial',      students: 28,  coaches: 2,  revenue: 0,      active: true  },
  { id: '4', name: 'Chennai GM Club',       sub: 'chennai-gm',  owner: 'Anand Kumar', plan: 'academy',    students: 95,  coaches: 6,  revenue: 95000,  active: true },
  { id: '5', name: 'Pune Chess Institute',  sub: 'pune-chess',  owner: 'Sneha Reddy', plan: 'starter',    students: 45,  coaches: 3,  revenue: 33750,  active: false },
  { id: '6', name: 'Kolkata Chess Fed.',    sub: 'kolkata-cf',  owner: 'Mohan Das',   plan: 'academy',    students: 210, coaches: 12, revenue: 210000, active: true },
]

const PLAN_COLORS: any = { trial: '#6B6050', starter: '#A09880', academy: '#60A5FA', enterprise: '#D4AF37' }

export default function AcademiesPage() {
  const [search, setSearch]     = useState('')
  const [plan, setPlan]         = useState('all')
  const [status, setStatus]     = useState('all')

  const filtered = ACADEMIES.filter(a => {
    const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.sub.includes(search)
    const mp = plan === 'all' || a.plan === plan
    const mt = status === 'all' || (status === 'active' && a.active) || (status === 'inactive' && !a.active)
    return ms && mp && mt
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Building2 size={22} className="text-[#D4AF37]" />Academies</h1>
        <button className="btn-primary text-sm"><Plus size={15} />Onboard Academy</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Total', v: ACADEMIES.length, c: '#D4AF37' },
          { l: 'Active', v: ACADEMIES.filter(a => a.active).length, c: '#4ADE80' },
          { l: 'Students', v: ACADEMIES.reduce((s, a) => s + a.students, 0).toLocaleString(), c: '#60A5FA' },
          { l: 'Total MRR', v: `₹${(ACADEMIES.reduce((s, a) => s + a.revenue, 0)/100000).toFixed(1)}L`, c: '#F472B6' },
        ].map(s => <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{ color: s.c }}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div></div>)}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search academies..." className="input pl-9 w-64" />
        </div>
        <div className="flex items-center gap-1 card p-1 rounded-xl">
          {['all','trial','starter','academy','enterprise'].map(p => (
            <button key={p} onClick={() => setPlan(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${plan === p ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-[#6B6050] hover:text-[#A09880]'}`}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 card p-1 rounded-xl">
          {['all','active','inactive'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${status === s ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-[#6B6050] hover:text-[#A09880]'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="th">Academy</th><th className="th">Owner</th><th className="th">Plan</th>
              <th className="th text-center">Students</th><th className="th text-right">MRR</th>
              <th className="th text-center">Status</th><th className="th text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i} className="tr">
                <td className="td">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center font-bold text-[#D4AF37] text-sm">{a.name[0]}</div>
                    <div>
                      <div className="font-medium text-sm">{a.name}</div>
                      <div className="text-xs text-[#6B6050] flex items-center gap-1"><Globe size={9} />{a.sub}.chessacademy.pro</div>
                    </div>
                  </div>
                </td>
                <td className="td text-[#A09880] text-sm">{a.owner}</td>
                <td className="td">
                  <span className="badge text-xs capitalize" style={{ background: `${PLAN_COLORS[a.plan]}15`, color: PLAN_COLORS[a.plan] }}>
                    {a.plan === 'enterprise' && <Crown size={9} />}{a.plan}
                  </span>
                </td>
                <td className="td text-center font-mono">{a.students}</td>
                <td className="td text-right font-mono text-sm">{a.revenue > 0 ? `₹${(a.revenue/1000).toFixed(0)}K` : '—'}</td>
                <td className="td text-center">
                  <span className={`text-xs flex items-center justify-center gap-1 ${a.active ? 'text-green-400' : 'text-red-400'}`}>
                    {a.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {a.active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="td text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="btn-icon w-7 h-7"><Eye size={13} /></button>
                    <button className="btn-icon w-7 h-7"><Edit size={13} /></button>
                    <button className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${a.active ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}>
                      {a.active ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
