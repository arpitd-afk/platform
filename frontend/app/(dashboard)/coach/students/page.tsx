'use client'
import { useState } from 'react'
import { Users, Search, MessageSquare, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
const STUDENTS = [
  { id:'1', name:'Arjun Sharma', rating:1210, change:+42, batch:'Intermediate A', lastSeen:'1h ago', puzzles:280, winRate:58, trend:'up', nextClass:'Today 10am' },
  { id:'2', name:'Priya Nair', rating:980, change:+28, batch:'Beginner B', lastSeen:'3h ago', puzzles:120, winRate:45, trend:'up', nextClass:'Today 2pm' },
  { id:'3', name:'Rohit Verma', rating:1540, change:+65, batch:'Advanced', lastSeen:'Yesterday', puzzles:540, winRate:68, trend:'up', nextClass:'Tomorrow 11am' },
  { id:'4', name:'Meera Patel', rating:650, change:-15, batch:'Beginner A', lastSeen:'2 days ago', puzzles:45, winRate:32, trend:'down', nextClass:'Jul 18 4pm' },
  { id:'5', name:'Kiran Kumar', rating:1120, change:+10, batch:'Intermediate A', lastSeen:'1h ago', puzzles:190, winRate:52, trend:'flat', nextClass:'Today 10am' },
]
export default function CoachStudentsPage() {
  const [search, setSearch] = useState('')
  const filtered = STUDENTS.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()))
  const TrendIcon=({t}:{t:string})=>t==='up'?<TrendingUp size={14} className="text-green-400"/>:t==='down'?<TrendingDown size={14} className="text-red-400"/>:<Minus size={14} className="text-[#6B6050]"/>
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Users size={22} className="text-[#4ADE80]"/>My Students</h1>
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="input pl-9 w-56"/></div>
      </div>
      <div className="grid gap-4">
        {filtered.map(s=>(
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#4ADE80]/15 flex items-center justify-center font-bold text-[#4ADE80] text-lg">{s.name[0]}</div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-[#6B6050] mt-0.5">{s.batch} · Last seen: {s.lastSeen}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div><div className="font-display text-xl font-bold text-[#D4AF37]">{s.rating}</div><div className="flex items-center justify-end gap-1 text-xs"><TrendIcon t={s.trend}/><span className={s.change>0?'text-green-400':'text-red-400'}>{s.change>0?'+':''}{s.change}</span></div></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[{l:'Win Rate',v:`${s.winRate}%`},{l:'Puzzles Done',v:s.puzzles},{l:'Next Class',v:s.nextClass}].map(x=>(
                <div key={x.l} className="bg-white/[0.04] rounded-lg p-3 text-center"><div className="font-semibold text-sm text-[#D4AF37]">{x.v}</div><div className="text-[10px] text-[#6B6050] mt-0.5">{x.l}</div></div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-secondary flex-1 text-xs py-2">View Profile</button>
              <button className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"><Target size={13}/>Assign Task</button>
              <button className="btn-ghost text-xs py-2 px-3"><MessageSquare size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
