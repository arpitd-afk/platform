'use client'
import { useState } from 'react'
import { ClipboardList, Clock, CheckCircle2, Upload, BookOpen } from 'lucide-react'

const ASSIGNMENTS = [
  { id:'1', title:'Sicilian Dragon Opening Study',    coach:'Vikram Nair', type:'Opening',  due:'Jul 18', dueTs:new Date('2024-07-18'), status:'pending',   desc:'Study the Sicilian Dragon variation. Analyze 5 grandmaster games and note the key ideas.', submitted:false },
  { id:'2', title:'Knight Fork Puzzles (10 puzzles)', coach:'Vikram Nair', type:'Tactics',  due:'Jul 19', dueTs:new Date('2024-07-19'), status:'pending',   desc:'Solve the 10 knight fork puzzles assigned on the puzzle trainer. Screenshot your results.', submitted:false },
  { id:'3', title:'Rook Endgame Basics',              coach:'Vikram Nair', type:'Endgame',  due:'Jul 17', dueTs:new Date('2024-07-17'), status:'overdue',   desc:'Practice the Lucena and Philidor positions. Demonstrate each in a game.', submitted:false },
  { id:'4', title:'Analyze 3 of Your Losses',         coach:'Vikram Nair', type:'Analysis', due:'Jul 15', dueTs:new Date('2024-07-15'), status:'submitted', desc:'Use the analysis board to find where you went wrong in your last 3 losses.', submitted:true, grade:88, feedback:'Good analysis on game 1 and 2. Work on identifying pawn structure issues.' },
  { id:'5', title:'Caro-Kann Opening Lines',          coach:'Vikram Nair', type:'Opening',  due:'Jul 10', dueTs:new Date('2024-07-10'), status:'graded',    desc:'Learn the main lines of the Caro-Kann defense.', submitted:true, grade:92, feedback:'Excellent work! Very thorough coverage of the Classical and Advance variations.' },
]

const TYPE_COLOR:any = { Opening:'#60A5FA', Tactics:'#A78BFA', Endgame:'#D4AF37', Analysis:'#4ADE80' }

export default function StudentAssignmentsPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter==='all' ? ASSIGNMENTS : ASSIGNMENTS.filter(a => a.status===filter)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-[#A78BFA]"/>Assignments</h1>
        <p className="text-[#6B6050] text-sm mt-1">Tasks assigned by your coach</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          {l:'Pending',v:ASSIGNMENTS.filter(a=>a.status==='pending').length,c:'#D4AF37'},
          {l:'Overdue',v:ASSIGNMENTS.filter(a=>a.status==='overdue').length,c:'#F87171'},
          {l:'Submitted',v:ASSIGNMENTS.filter(a=>a.status==='submitted').length,c:'#60A5FA'},
          {l:'Graded',v:ASSIGNMENTS.filter(a=>a.status==='graded').length,c:'#4ADE80'},
        ].map(s=>(
          <div key={s.l} className="stat-card cursor-pointer hover:border-white/[0.14]" onClick={()=>setFilter(s.l.toLowerCase())}>
            <div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div>
            <div className="text-xs text-[#6B6050]">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 card p-1 rounded-xl w-fit">
        {['all','pending','overdue','submitted','graded'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter===f?'bg-[#A78BFA]/15 text-[#A78BFA]':'text-[#6B6050] hover:text-[#A09880]'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map(a => (
          <div key={a.id} className={`card p-5 ${a.status==='overdue'?'border-red-400/30':''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge text-xs" style={{background:`${TYPE_COLOR[a.type]}15`,color:TYPE_COLOR[a.type]}}>{a.type}</span>
                  <span className={`badge text-xs ${a.status==='pending'?'badge-gold':a.status==='overdue'?'badge-red':a.status==='submitted'?'badge-blue':'badge-green'}`}>{a.status}</span>
                </div>
                <h3 className="font-semibold mb-1">{a.title}</h3>
                <p className="text-sm text-[#A09880]">{a.desc}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-[#6B6050]">
                  <span className="flex items-center gap-1"><BookOpen size={11}/>Coach: {a.coach}</span>
                  <span className={`flex items-center gap-1 ${a.status==='overdue'?'text-red-400':''}`}><Clock size={11}/>Due: {a.due}</span>
                </div>
              </div>
              {a.status==='graded' && (
                <div className="text-center bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex-shrink-0">
                  <div className="font-display text-2xl font-bold text-green-400">{a.grade}</div>
                  <div className="text-xs text-[#6B6050]">/ 100</div>
                </div>
              )}
            </div>
            {a.feedback && (
              <div className="mt-4 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                <div className="text-xs font-semibold text-[#D4AF37] mb-1">Coach Feedback</div>
                <p className="text-sm text-[#A09880]">{a.feedback}</p>
              </div>
            )}
            {(a.status==='pending'||a.status==='overdue') && (
              <button className="btn-primary text-sm mt-4 flex items-center gap-2"><Upload size={14}/>Submit Assignment</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
