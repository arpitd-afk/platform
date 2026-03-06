'use client'
import { BarChart3 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
const mrr=[{m:'Jan',r:380},{m:'Feb',r:520},{m:'Mar',r:690},{m:'Apr',m2:'Apr',r:750},{m:'May',r:920},{m:'Jun',r:1100},{m:'Jul',r:1340}]
const signups=[{m:'Jan',n:12},{m:'Feb',n:18},{m:'Mar',n:28},{m:'Apr',n:15},{m:'May',n:32},{m:'Jun',n:41},{m:'Jul',n:38}]
const games=[{m:'Jan',g:28000},{m:'Feb',g:34000},{m:'Mar',g:41000},{m:'Apr',g:38000},{m:'May',g:52000},{m:'Jun',g:68000},{m:'Jul',g:82000}]
const T=({active,payload,label}:any)=>active&&payload?.length?<div className="card px-3 py-2 text-xs"><p className="text-[#6B6050] mb-1">{label}</p>{payload.map((p:any)=><p key={p.name} style={{color:p.color||p.fill}}>{p.dataKey}: {p.value}</p>)}</div>:null
export default function SuperAdminAnalyticsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-[#F472B6]"/>Platform Analytics</h1>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Total MRR',v:'₹13.4L',c:'#4ADE80',sub:'+22% MoM'},{l:'Active Academies',v:'72',c:'#D4AF37',sub:'+8 this month'},{l:'Total Students',v:'14.2K',c:'#60A5FA',sub:'+1.2K this month'},{l:'Games / Day',v:'8,420',c:'#A78BFA',sub:'Peak: 11pm'}].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div><div className="text-xs mt-0.5" style={{color:s.c}}>{s.sub}</div></div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Monthly Recurring Revenue (₹K)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mrr}>
              <defs><linearGradient id="mrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ADE80" stopOpacity={0.2}/><stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="m" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<T/>}/><Area type="monotone" dataKey="r" stroke="#4ADE80" strokeWidth={2} fill="url(#mrg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">New Academy Signups / Month</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={signups}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="m" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<T/>}/><Bar dataKey="n" fill="#D4AF37" radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="section-title mb-4">Games Played / Month</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={games}>
            <defs><linearGradient id="gag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2}/><stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="m" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`${v/1000}K`}/><Tooltip content={<T/>}/><Area type="monotone" dataKey="g" stroke="#A78BFA" strokeWidth={2} fill="url(#gag)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
