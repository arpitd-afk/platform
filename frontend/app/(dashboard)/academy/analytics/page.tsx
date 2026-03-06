'use client'
import { BarChart3 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
const ratingDist = [{r:'<800',c:4},{r:'800-1000',c:12},{r:'1000-1200',c:22},{r:'1200-1400',c:18},{r:'1400-1600',c:9},{r:'>1600',c:3}]
const monthlyGames = [{m:'Jan',g:320},{m:'Feb',g:410},{m:'Mar',g:380},{m:'Apr',g:520},{m:'May',g:610},{m:'Jun',g:740},{m:'Jul',g:820}]
const retentionData = [{m:'Jan',r:88},{m:'Feb',r:90},{m:'Mar',r:86},{m:'Apr',r:92},{m:'May',r:89},{m:'Jun',r:94},{m:'Jul',r:96}]
const T=({active,payload,label}:any)=>active&&payload?.length?<div className="card px-3 py-2 text-xs"><p className="text-[#6B6050] mb-1">{label}</p>{payload.map((p:any)=><p key={p.name} style={{color:p.color||p.fill}}>{p.dataKey}: {p.value}</p>)}</div>:null
export default function AcademyAnalyticsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-[#F472B6]"/>Analytics</h1>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Avg Rating',v:'1,124',c:'#D4AF37',sub:'+48 this month'},{l:'Total Games',v:'4,820',c:'#60A5FA',sub:'+820 this month'},{l:'Retention Rate',v:'94%',c:'#4ADE80',sub:'+2% vs last month'},{l:'Puzzle Accuracy',v:'78%',c:'#A78BFA',sub:'Academy avg'}].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div><div className="text-xs mt-0.5" style={{color:s.c}}>{s.sub}</div></div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ratingDist}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="r" tick={{fill:'#6B6050',fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<T/>}/><Bar dataKey="c" fill="#D4AF37" radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">Monthly Games Played</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyGames}>
              <defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2}/><stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="m" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<T/>}/><Area type="monotone" dataKey="g" stroke="#60A5FA" strokeWidth={2} fill="url(#gg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="section-title mb-4">Student Retention (%)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={retentionData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="m" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><YAxis domain={[80,100]} tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<T/>}/><Line type="monotone" dataKey="r" stroke="#4ADE80" strokeWidth={2.5} dot={{fill:'#4ADE80',r:4,strokeWidth:0}}/></LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
