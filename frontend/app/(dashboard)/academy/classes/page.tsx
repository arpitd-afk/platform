'use client'
import { useState } from 'react'
import { BookOpen, Plus, Clock, Users, Calendar, Video, Play } from 'lucide-react'
import Link from 'next/link'
const CLASSES = [
  { id:'1', title:'Sicilian Defense Workshop', batch:'Intermediate A', coach:'Vikram Nair', date:'Today', time:'10:00 AM', duration:60, students:8,  status:'live' },
  { id:'2', title:'Endgame Techniques',         batch:'Beginner B',    coach:'Meera Joshi', date:'Today', time:'2:00 PM',  duration:60, students:12, status:'upcoming' },
  { id:'3', title:'Opening Theory Advanced',    batch:'Advanced',      coach:'Vikram Nair', date:'Tomorrow', time:'11:00 AM', duration:90, students:6, status:'upcoming' },
  { id:'4', title:'Knight & Bishop Endings',    batch:'Intermediate B', coach:'Meera Joshi', date:'Jul 18', time:'4:00 PM',  duration:60, students:10, status:'upcoming' },
  { id:'5', title:'Tactics Workshop',           batch:'Beginner A',    coach:'Suresh Reddy', date:'Jul 16', time:'5:00 PM', duration:60, students:14, status:'completed' },
  { id:'6', title:'Rook Endgames',             batch:'Intermediate A', coach:'Vikram Nair', date:'Jul 15', time:'10:00 AM', duration:60, students:9, status:'completed' },
]
const STATUS_STYLE:any = { live:'badge-red', upcoming:'badge-gold', completed:'badge-gray' }
export default function ClassesPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter==='all' ? CLASSES : CLASSES.filter(c=>c.status===filter)
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><BookOpen size={22} className="text-[#4ADE80]"/>Classes</h1>
        <button className="btn-primary text-sm"><Plus size={15}/>Schedule Class</button>
      </div>
      <div className="flex items-center gap-1 card p-1 rounded-xl w-fit">
        {['all','live','upcoming','completed'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter===f?'bg-[#4ADE80]/15 text-[#4ADE80]':'text-[#6B6050] hover:text-[#A09880]'}`}>{f}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c=>(
          <div key={c.id} className={`card p-5 flex flex-col gap-3 ${c.status==='live'?'border-red-400/30':''}`}>
            <div className="flex items-start justify-between">
              <span className={`badge text-xs ${STATUS_STYLE[c.status]}`}>{c.status==='live'?<><span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block animate-pulse mr-1"/>LIVE</>:c.status}</span>
              <span className="badge-gray text-xs">{c.duration}min</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{c.title}</h3>
              <p className="text-xs text-[#6B6050] mt-0.5">{c.batch} · Coach {c.coach}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#A09880]">
              <span className="flex items-center gap-1"><Calendar size={11}/>{c.date}</span>
              <span className="flex items-center gap-1"><Clock size={11}/>{c.time}</span>
              <span className="flex items-center gap-1"><Users size={11}/>{c.students}</span>
            </div>
            {c.status==='live'
              ? <Link href={`/classroom/${c.id}`} className="btn-primary text-sm flex items-center justify-center gap-2 mt-1"><Video size={14}/>Join Live Class</Link>
              : c.status==='completed'
              ? <button className="btn-secondary text-sm flex items-center justify-center gap-2 mt-1"><Play size={14}/>View Recording</button>
              : <button className="btn-secondary text-sm mt-1">View Details</button>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
