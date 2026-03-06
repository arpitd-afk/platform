'use client'
import { useState } from 'react'
import { ClipboardList, Plus, CheckCircle2, Clock, Users } from 'lucide-react'
const ASSIGNMENTS = [
  { id:'1', title:'Sicilian Dragon Opening Study', batch:'Intermediate A', type:'Opening', due:'Jul 18', submissions:6, total:8, status:'active' },
  { id:'2', title:'Knight Fork Puzzles (10 puzzles)', batch:'Beginner B', type:'Tactics', due:'Jul 19', submissions:10, total:12, status:'active' },
  { id:'3', title:'Rook Endgame Analysis', batch:'Advanced', type:'Endgame', due:'Jul 20', submissions:5, total:6, status:'active' },
  { id:'4', title:'Game Analysis - Review last 3 losses', batch:'Intermediate A', type:'Analysis', due:'Jul 15', submissions:8, total:8, status:'completed' },
  { id:'5', title:'Caro-Kann Defense Opening Lines', batch:'Beginner B', type:'Opening', due:'Jul 10', submissions:11, total:12, status:'completed' },
]
const TYPE_COLOR:any = { Opening:'#60A5FA', Tactics:'#A78BFA', Endgame:'#D4AF37', Analysis:'#4ADE80' }
export default function CoachAssignmentsPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter==='all' ? ASSIGNMENTS : ASSIGNMENTS.filter(a=>a.status===filter)
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-[#A78BFA]"/>Assignments</h1>
        <button className="btn-primary text-sm"><Plus size={15}/>Create Assignment</button>
      </div>
      <div className="flex items-center gap-1 card p-1 rounded-xl w-fit">
        {['all','active','completed'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter===f?'bg-[#A78BFA]/15 text-[#A78BFA]':'text-[#6B6050] hover:text-[#A09880]'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(a=>(
          <div key={a.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge text-xs" style={{background:`${TYPE_COLOR[a.type]}15`,color:TYPE_COLOR[a.type]}}>{a.type}</span>
                  <span className={`badge text-xs ${a.status==='completed'?'badge-green':'badge-gold'}`}>{a.status}</span>
                </div>
                <h3 className="font-semibold">{a.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#6B6050]">
                  <span className="flex items-center gap-1"><Users size={11}/>{a.batch}</span>
                  <span className="flex items-center gap-1"><Clock size={11}/>Due: {a.due}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={11}/>{a.submissions}/{a.total} submitted</span>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold font-display text-[#D4AF37]">{Math.round((a.submissions/a.total)*100)}%</div>
                <div className="text-xs text-[#6B6050]">completion</div>
              </div>
            </div>
            <div className="mt-3 progress-bar"><div className="progress-fill" style={{width:`${(a.submissions/a.total)*100}%`}}/></div>
          </div>
        ))}
      </div>
    </div>
  )
}
