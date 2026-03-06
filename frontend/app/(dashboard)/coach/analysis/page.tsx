'use client'
import { BarChart3, TrendingUp } from 'lucide-react'
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
const studentPerf = [
  {name:'Arjun', rating:1210, accuracy:72, tactics:82}, {name:'Priya', rating:980, accuracy:65, tactics:71},
  {name:'Rohit', rating:1540, accuracy:88, tactics:91}, {name:'Meera', rating:650, accuracy:48, tactics:52},
  {name:'Kiran', rating:1120, accuracy:69, tactics:77},
]
const cohortRadar = [{s:'Tactics',v:74},{s:'Endgame',v:62},{s:'Opening',v:78},{s:'Strategy',v:65},{s:'Speed',v:71},{s:'Accuracy',v:68}]
const T=({active,payload,label}:any)=>active&&payload?.length?<div className="card px-3 py-2 text-xs"><p className="text-[#6B6050] mb-1">{label}</p>{payload.map((p:any)=><p key={p.name} style={{color:p.fill||p.color}}>{p.dataKey}: {p.value}</p>)}</div>:null
export default function CoachAnalysisPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-[#F472B6]"/>Student Analysis</h1>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">Student Ratings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={studentPerf}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="name" tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#6B6050',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<T/>}/><Bar dataKey="rating" fill="#D4AF37" radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">Cohort Skill Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={cohortRadar}><PolarGrid stroke="rgba(255,255,255,0.07)"/><PolarAngleAxis dataKey="s" tick={{fill:'#6B6050',fontSize:11}}/><Radar dataKey="v" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15}/></RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]"><h3 className="section-title">Accuracy & Tactics Per Student</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.07]"><th className="th">Student</th><th className="th text-center">Rating</th><th className="th">Accuracy</th><th className="th">Tactics</th></tr></thead>
          <tbody>
            {studentPerf.map(s=>(
              <tr key={s.name} className="tr">
                <td className="td font-medium">{s.name}</td>
                <td className="td text-center font-mono">{s.rating}</td>
                <td className="td w-40"><div className="flex items-center gap-2"><div className="progress-bar flex-1"><div className="progress-fill" style={{width:`${s.accuracy}%`}}/></div><span className="text-xs text-[#A09880] w-8">{s.accuracy}%</span></div></td>
                <td className="td w-40"><div className="flex items-center gap-2"><div className="progress-bar flex-1"><div className="progress-fill" style={{width:`${s.tactics}%`,background:'#A78BFA'}}/></div><span className="text-xs text-[#A09880] w-8">{s.tactics}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
