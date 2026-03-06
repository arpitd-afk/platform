'use client'
import Link from 'next/link'
import { BookOpen, Plus, Video, Clock, Users, Calendar } from 'lucide-react'
const SESSIONS = [
  { id:'1', title:'Sicilian Defense Workshop', batch:'Intermediate A', date:'Today', time:'10:00 AM', students:8, status:'live' },
  { id:'2', title:'Endgame Techniques',         batch:'Beginner B',    date:'Today', time:'2:00 PM',  students:12, status:'upcoming' },
  { id:'3', title:'Opening Theory Advanced',    batch:'Advanced',      date:'Tomorrow', time:'11:00 AM', students:6, status:'upcoming' },
  { id:'4', title:'Tactics Drills',             batch:'Intermediate A', date:'Jul 16', time:'10:00 AM', students:9, status:'completed' },
  { id:'5', title:'Pawn Structure Masterclass', batch:'Advanced', date:'Jul 15', time:'3:00 PM', students:7, status:'completed' },
]
const S:any={live:'badge-red',upcoming:'badge-gold',completed:'badge-gray'}
export default function CoachClassroomPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><BookOpen size={22} className="text-[#60A5FA]"/>My Classrooms</h1>
        <Link href="/classroom/new" className="btn-primary text-sm"><Plus size={15}/>Start Class</Link>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SESSIONS.map(s=>(
          <div key={s.id} className={`card p-5 flex flex-col gap-3 ${s.status==='live'?'border-red-400/30':''}`}>
            <div className="flex items-start justify-between"><span className={`badge text-xs ${S[s.status]}`}>{s.status==='live'?<><span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block animate-pulse mr-1"/>LIVE</>:s.status}</span></div>
            <div><h3 className="font-semibold text-sm">{s.title}</h3><p className="text-xs text-[#6B6050] mt-0.5">{s.batch}</p></div>
            <div className="flex items-center gap-3 text-xs text-[#A09880]">
              <span className="flex items-center gap-1"><Calendar size={11}/>{s.date}</span>
              <span className="flex items-center gap-1"><Clock size={11}/>{s.time}</span>
              <span className="flex items-center gap-1"><Users size={11}/>{s.students}</span>
            </div>
            {s.status==='live'
              ? <Link href={`/classroom/${s.id}`} className="btn-primary text-sm flex items-center justify-center gap-2"><Video size={14}/>Join Now</Link>
              : s.status==='upcoming'
              ? <Link href={`/classroom/${s.id}`} className="btn-secondary text-sm flex items-center justify-center gap-2">Start Session</Link>
              : <button className="btn-secondary text-sm">View Recording</button>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
