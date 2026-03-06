'use client'
import { useState } from 'react'
import { Users, Search, Plus, TrendingUp, TrendingDown, Minus, Mail, MoreHorizontal } from 'lucide-react'
const STUDENTS = [
  { id:'1', name:'Arjun Sharma',  email:'arjun@example.com',  batch:'Intermediate A', coach:'Vikram Nair',  rating:1210, joined:'Jan 15', attendance:92, hw:88,  trend:'up' },
  { id:'2', name:'Priya Nair',    email:'priya@example.com',  batch:'Beginner B',     coach:'Meera Joshi', rating:780,  joined:'Feb 10', attendance:78, hw:95,  trend:'up' },
  { id:'3', name:'Rohit Verma',   email:'rohit@example.com',  batch:'Advanced',       coach:'Vikram Nair',  rating:1540, joined:'Dec 01', attendance:97, hw:100, trend:'up' },
  { id:'4', name:'Meera Patel',   email:'meera@example.com',  batch:'Beginner A',     coach:'Meera Joshi', rating:650,  joined:'Mar 20', attendance:65, hw:55,  trend:'down' },
  { id:'5', name:'Kiran Kumar',   email:'kiran@example.com',  batch:'Intermediate A', coach:'Vikram Nair',  rating:1120, joined:'Feb 28', attendance:88, hw:82,  trend:'flat' },
  { id:'6', name:'Aanya Singh',   email:'aanya@example.com',  batch:'Intermediate B', coach:'Meera Joshi', rating:990,  joined:'Apr 05', attendance:94, hw:90,  trend:'up' },
  { id:'7', name:'Dev Malhotra',  email:'dev@example.com',    batch:'Beginner B',     coach:'Meera Joshi', rating:720,  joined:'May 12', attendance:82, hw:78,  trend:'flat' },
  { id:'8', name:'Sia Kapoor',    email:'sia@example.com',    batch:'Advanced',       coach:'Vikram Nair',  rating:1680, joined:'Nov 08', attendance:99, hw:98,  trend:'up' },
]
const BATCHES = ['All','Beginner A','Beginner B','Intermediate A','Intermediate B','Advanced']

export default function AcademyStudentsPage() {
  const [search, setSearch] = useState('')
  const [batch, setBatch]   = useState('All')
  const filtered = STUDENTS.filter(s => (s.name.toLowerCase().includes(search.toLowerCase())) && (batch==='All'||s.batch===batch))
  const TrendIcon = ({t}:{t:string}) => t==='up' ? <TrendingUp size={14} className="text-green-400"/> : t==='down' ? <TrendingDown size={14} className="text-red-400"/> : <Minus size={14} className="text-[#6B6050]"/>
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title flex items-center gap-2"><Users size={22} className="text-[#60A5FA]"/>Students</h1><p className="text-[#6B6050] text-sm mt-1">{STUDENTS.length} enrolled</p></div>
        <button className="btn-primary text-sm"><Plus size={15}/>Add Student</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Total',v:STUDENTS.length,c:'#60A5FA'},{l:'Avg Rating',v:Math.round(STUDENTS.reduce((s,x)=>s+x.rating,0)/STUDENTS.length),c:'#D4AF37'},{l:'Avg Attendance',v:`${Math.round(STUDENTS.reduce((s,x)=>s+x.attendance,0)/STUDENTS.length)}%`,c:'#4ADE80'},{l:'Improving',v:STUDENTS.filter(s=>s.trend==='up').length,c:'#A78BFA'}].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div></div>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students..." className="input pl-9"/></div>
        <div className="flex items-center gap-1 card p-1 rounded-xl flex-wrap">
          {BATCHES.map(b=><button key={b} onClick={()=>setBatch(b)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${batch===b?'bg-[#60A5FA]/15 text-[#60A5FA]':'text-[#6B6050] hover:text-[#A09880]'}`}>{b}</button>)}
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.07]"><th className="th">Student</th><th className="th">Batch</th><th className="th">Coach</th><th className="th text-center">Rating</th><th className="th text-center">Attendance</th><th className="th text-center">Homework</th><th className="th text-center">Trend</th><th className="th text-center">Actions</th></tr></thead>
          <tbody>
            {filtered.map(s=>(
              <tr key={s.id} className="tr">
                <td className="td"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#60A5FA]/15 flex items-center justify-center font-bold text-[#60A5FA] text-sm">{s.name[0]}</div><div><div className="font-medium text-sm">{s.name}</div><div className="text-xs text-[#6B6050]">{s.email}</div></div></div></td>
                <td className="td"><span className="badge-gray text-xs">{s.batch}</span></td>
                <td className="td text-[#A09880] text-sm">{s.coach}</td>
                <td className="td text-center font-mono font-semibold">{s.rating}</td>
                <td className="td"><div className="flex items-center justify-center gap-2"><div className="w-16 progress-bar"><div className="progress-fill" style={{width:`${s.attendance}%`,background:s.attendance<75?'#F87171':'#D4AF37'}}/></div><span className="text-xs text-[#A09880] w-8">{s.attendance}%</span></div></td>
                <td className="td"><div className="flex items-center justify-center gap-2"><div className="w-16 progress-bar"><div className="progress-fill" style={{width:`${s.hw}%`}}/></div><span className="text-xs text-[#A09880] w-8">{s.hw}%</span></div></td>
                <td className="td text-center"><TrendIcon t={s.trend}/></td>
                <td className="td text-center"><div className="flex items-center justify-center gap-1"><button className="btn-icon w-7 h-7"><Mail size={13}/></button><button className="btn-icon w-7 h-7"><MoreHorizontal size={13}/></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
