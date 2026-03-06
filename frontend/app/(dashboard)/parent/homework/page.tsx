'use client'
import { ClipboardList, CheckCircle2, Clock, XCircle } from 'lucide-react'
const HOMEWORK = [
  { child:'Arjun Sharma', tasks:[
    {title:'Sicilian Dragon Opening Study',due:'Jul 18',status:'pending',type:'Opening'},
    {title:'Knight Fork Puzzles',due:'Jul 19',status:'pending',type:'Tactics'},
    {title:'Analyze 3 Losses',due:'Jul 15',status:'submitted',type:'Analysis',grade:88},
    {title:'Caro-Kann Lines',due:'Jul 10',status:'graded',type:'Opening',grade:92},
  ]},
  { child:'Priya Sharma', tasks:[
    {title:'Basic Checkmate Patterns',due:'Jul 18',status:'pending',type:'Tactics'},
    {title:'King and Pawn Endgame',due:'Jul 20',status:'pending',type:'Endgame'},
    {title:'Opening Principles Quiz',due:'Jul 12',status:'graded',type:'Opening',grade:78},
  ]},
]
const TYPE_C:any={Opening:'#60A5FA',Tactics:'#A78BFA',Endgame:'#D4AF37',Analysis:'#4ADE80'}
const STATUS_S:any={pending:{label:'Pending',cls:'badge-gold'},submitted:{label:'Submitted',cls:'badge-blue'},graded:{label:'Graded',cls:'badge-green'}}
export default function HomeworkPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-[#A78BFA]"/>Homework</h1>
      {HOMEWORK.map(child=>(
        <div key={child.child} className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
            <h3 className="section-title">{child.child}</h3>
            <span className="text-xs text-[#6B6050]">{child.tasks.filter(t=>t.status==='graded').length}/{child.tasks.length} complete</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {child.tasks.map((t,i)=>(
              <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02]">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge text-xs" style={{background:`${TYPE_C[t.type]}15`,color:TYPE_C[t.type]}}>{t.type}</span>
                  </div>
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="flex items-center gap-1 text-xs text-[#6B6050] mt-0.5"><Clock size={10}/>Due: {t.due}</div>
                </div>
                <div className="flex items-center gap-3">
                  {t.grade && <div className="text-right"><div className="font-bold text-[#D4AF37]">{t.grade}/100</div><div className="text-[10px] text-[#6B6050]">Score</div></div>}
                  <span className={`badge text-xs ${STATUS_S[t.status].cls}`}>{STATUS_S[t.status].label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
