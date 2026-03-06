'use client'
import { TrendingUp } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ratingHistory = [
  {d:'Jan',r:1050},{d:'Feb',r:1080},{d:'Mar',r:1105},{d:'Apr',r:1090},{d:'May',r:1140},{d:'Jun',r:1175},{d:'Jul',r:1210},
]
const radarData = [
  {s:'Tactics',v:72},{s:'Endgame',v:58},{s:'Opening',v:81},{s:'Strategy',v:64},{s:'Speed',v:77},{s:'Accuracy',v:69},
]
const openings = [
  {name:"King's Indian",w:8,d:2,l:3},{name:'Sicilian',w:12,d:3,l:5},{name:'French',w:4,d:1,l:2},{name:'Italian',w:6,d:2,l:1},
]
const gamesByMonth = [
  {m:'Jan',w:8,d:3,l:5},{m:'Feb',w:10,d:2,l:6},{m:'Mar',w:14,d:4,l:4},{m:'Apr',w:9,d:5,l:8},{m:'May',w:16,d:3,l:5},{m:'Jun',w:18,d:4,l:6},{m:'Jul',w:12,d:3,l:4},
]
const T=({active,payload,label}:any)=>active&&payload?.length?<div className="card px-3 py-2 text-xs"><p className="text-[#6B6050] mb-1">{label}</p>{payload.map((p:any)=><p key={p.name} style={{color:p.color||p.fill}}>{p.dataKey}: {p.value}</p>)}</div>:null

export default function StudentProgressPage() {
  const totalGames = gamesByMonth.reduce((s,m)=>s+m.w+m.d+m.l,0)
  const totalWins  = gamesByMonth.reduce((s,m)=>s+m.w,0)
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><TrendingUp size={22} className="text-[#4ADE80]"/>My Progress</h1>
        <p className="text-[#6B6050] text-sm mt-1">Track your chess improvement over time</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          {l:'Current Rating',v:'1,210',c:'#D4AF37',sub:'+160 since Jan'},
          {l:'Win Rate',v:`${Math.round((totalWins/totalGames)*100)}%`,c:'#4ADE80',sub:`${totalWins} of ${totalGames} games`},
          {l:'Peak Rating',v:'1,210',c:'#60A5FA',sub:'Achieved this month'},
          {l:'Games Played',v:totalGames,c:'#A78BFA',sub:'This year'},
        ].map(s=>(
          <div key={s.l} className="stat-card">
            <div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div>
            <div className="text-xs text-[#6B6050]">{s.l}</div>
            <div className="text-xs mt-0.5" style={{color:s.c}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <h3 className="section-title mb-5">Rating Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ratingHistory}>
              <defs><linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25}/><stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="d" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis domain={['auto','auto']} tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip content={<T/>}/>
              <Area type="monotone" dataKey="r" stroke="#D4AF37" strokeWidth={2.5} fill="url(#rg2)" dot={{fill:'#D4AF37',r:4,strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">Skill Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.07)"/>
              <PolarAngleAxis dataKey="s" tick={{fill:'#6B6050',fontSize:11}}/>
              <Radar dataKey="v" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.15}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Games by Month</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gamesByMonth} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="m" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip content={<T/>}/>
              <Bar dataKey="w" fill="#4ADE80" radius={[3,3,0,0]} name="Wins"/>
              <Bar dataKey="d" fill="#D4AF37" radius={[3,3,0,0]} name="Draws"/>
              <Bar dataKey="l" fill="#F87171" radius={[3,3,0,0]} name="Losses"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">Opening Performance</h3>
          <div className="space-y-3">
            {openings.map(o => {
              const total = o.w+o.d+o.l
              return (
                <div key={o.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{o.name}</span>
                    <span className="text-xs text-[#6B6050]">{o.w}W {o.d}D {o.l}L</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-green-400 rounded-full" style={{width:`${(o.w/total)*100}%`}}/>
                    <div className="bg-[#D4AF37] rounded-full" style={{width:`${(o.d/total)*100}%`}}/>
                    <div className="bg-red-400 rounded-full" style={{width:`${(o.l/total)*100}%`}}/>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-4 pt-2 text-xs text-[#6B6050]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>Win</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4AF37] inline-block"/>Draw</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
