'use client'
import { TrendingUp } from 'lucide-react'
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
const arjunHistory = [{m:'Jan',r:1050},{m:'Feb',r:1080},{m:'Mar',r:1110},{m:'Apr',r:1145},{m:'May',r:1175},{m:'Jun',r:1210}]
const priyaHistory  = [{m:'Jan',r:660},{m:'Feb',r:700},{m:'Mar',r:720},{m:'Apr',r:740},{m:'May',r:760},{m:'Jun',r:780}]
const T=({active,payload}:any)=>active&&payload?.length?<div className="card px-3 py-2 text-xs">{payload.map((p:any)=><p key={p.name} style={{color:p.color}}>{p.name}: {p.value}</p>)}</div>:null
export default function ParentProgressPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><TrendingUp size={22} className="text-[#4ADE80]"/>Progress Reports</h1>
      <div className="card p-6">
        <h3 className="section-title mb-4">Rating History — Both Children</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="m" data={arjunHistory} tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<T/>}/>
            <Line data={arjunHistory} type="monotone" dataKey="r" stroke="#D4AF37" strokeWidth={2.5} dot={false} name="Arjun"/>
            <Line data={priyaHistory}  type="monotone" dataKey="r" stroke="#A78BFA" strokeWidth={2.5} dot={false} name="Priya"/>
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3 text-xs">
          <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#D4AF37] inline-block"/>Arjun Sharma</span>
          <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#A78BFA] inline-block"/>Priya Sharma</span>
        </div>
      </div>
      {[
        {name:'Arjun Sharma',color:'#D4AF37',radar:[{s:'Tactics',v:72},{s:'Endgame',v:58},{s:'Opening',v:81},{s:'Strategy',v:64},{s:'Speed',v:77},{s:'Accuracy',v:69}]},
        {name:'Priya Sharma',color:'#A78BFA',radar:[{s:'Tactics',v:55},{s:'Endgame',v:40},{s:'Opening',v:62},{s:'Strategy',v:48},{s:'Speed',v:60},{s:'Accuracy',v:58}]},
      ].map(child=>(
        <div key={child.name} className="card p-6">
          <h3 className="section-title mb-4">{child.name} — Skill Breakdown</h3>
          <div className="grid lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={child.radar}><PolarGrid stroke="rgba(255,255,255,0.07)"/><PolarAngleAxis dataKey="s" tick={{fill:'#6B6050',fontSize:11}}/><Radar dataKey="v" stroke={child.color} fill={child.color} fillOpacity={0.15}/></RadarChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {child.radar.map(s=>(
                <div key={s.s} className="flex items-center gap-3">
                  <span className="text-sm text-[#A09880] w-20">{s.s}</span>
                  <div className="flex-1 progress-bar"><div className="progress-fill" style={{width:`${s.v}%`,background:child.color}}/></div>
                  <span className="text-sm font-mono w-8 text-right" style={{color:child.color}}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
