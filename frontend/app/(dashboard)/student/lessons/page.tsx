'use client'
import { useState } from 'react'
import { BookMarked, Play, Lock, CheckCircle2, Clock, Star } from 'lucide-react'

const COURSES = [
  {
    id:'1', title:'Opening Principles', level:'Beginner', lessons:8, completed:8, color:'#4ADE80',
    items:[
      {id:'l1',title:'Control the Center',duration:'12 min',done:true},
      {id:'l2',title:'Develop Your Pieces',duration:'15 min',done:true},
      {id:'l3',title:'King Safety & Castling',duration:'18 min',done:true},
      {id:'l4',title:'The Italian Game',duration:'20 min',done:true},
      {id:'l5',title:'The Spanish Opening',duration:'22 min',done:true},
      {id:'l6',title:'Avoiding Common Mistakes',duration:'14 min',done:true},
      {id:'l7',title:'Creating a Plan',duration:'16 min',done:true},
      {id:'l8',title:'Opening Quiz',duration:'10 min',done:true},
    ]
  },
  {
    id:'2', title:'Tactical Patterns', level:'Intermediate', lessons:10, completed:4, color:'#D4AF37',
    items:[
      {id:'l1',title:'Forks & Double Attacks',duration:'18 min',done:true},
      {id:'l2',title:'Pins & Skewers',duration:'20 min',done:true},
      {id:'l3',title:'Discovered Attacks',duration:'15 min',done:true},
      {id:'l4',title:'Back Rank Weaknesses',duration:'12 min',done:true},
      {id:'l5',title:'Knight Outposts',duration:'16 min',done:false},
      {id:'l6',title:'Sacrifices & Combinations',duration:'25 min',done:false},
      {id:'l7',title:'Deflection Tactics',duration:'18 min',done:false},
      {id:'l8',title:'Interference',duration:'14 min',done:false},
      {id:'l9',title:'Zugzwang',duration:'20 min',done:false},
      {id:'l10',title:'Tactics Quiz',duration:'30 min',done:false},
    ]
  },
  {
    id:'3', title:'Sicilian Defense', level:'Intermediate', lessons:6, completed:0, color:'#60A5FA',
    items:[
      {id:'l1',title:'Introduction to Sicilian',duration:'15 min',done:false},
      {id:'l2',title:'The Najdorf Variation',duration:'25 min',done:false},
      {id:'l3',title:'The Dragon Variation',duration:'28 min',done:false},
      {id:'l4',title:'The Classical Sicilian',duration:'22 min',done:false},
      {id:'l5',title:'Anti-Sicilian Systems',duration:'20 min',done:false},
      {id:'l6',title:'Sicilian Quiz',duration:'20 min',done:false},
    ]
  },
]

export default function LessonsPage() {
  const [openCourse, setOpenCourse] = useState('2')
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><BookMarked size={22} className="text-[#60A5FA]"/>Lessons</h1>
        <p className="text-[#6B6050] text-sm mt-1">Your personalised chess curriculum</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{l:'Courses',v:COURSES.length,c:'#60A5FA'},{l:'Lessons Done',v:COURSES.reduce((s,c)=>s+c.completed,0),c:'#4ADE80'},{l:'Total Lessons',v:COURSES.reduce((s,c)=>s+c.lessons,0),c:'#D4AF37'}].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {COURSES.map(course => {
          const pct = Math.round((course.completed/course.lessons)*100)
          const isOpen = openCourse === course.id
          return (
            <div key={course.id} className="card overflow-hidden">
              <button onClick={()=>setOpenCourse(isOpen?'':course.id)} className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors text-left">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:`${course.color}15`}}>
                  <BookMarked size={20} style={{color:course.color}}/>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <span className="badge-gray text-xs">{course.level}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6B6050]">
                    <span>{course.completed}/{course.lessons} lessons</span>
                    <div className="flex-1 max-w-32 progress-bar"><div className="progress-fill" style={{width:`${pct}%`,background:course.color}}/></div>
                    <span style={{color:course.color}}>{pct}%</span>
                  </div>
                </div>
                {pct===100 && <CheckCircle2 size={18} className="text-green-400 flex-shrink-0"/>}
              </button>
              {isOpen && (
                <div className="border-t border-white/[0.07]">
                  {course.items.map((item,i) => {
                    const locked = !item.done && course.items.slice(0,i).some(x=>!x.done)
                    return (
                      <div key={item.id} className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0 ${locked?'opacity-50':''} hover:bg-white/[0.02] transition-colors`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${item.done?'bg-green-500/20':'bg-white/[0.06]'}`}>
                          {item.done ? <CheckCircle2 size={14} className="text-green-400"/> : locked ? <Lock size={13} className="text-[#6B6050]"/> : <Play size={13} style={{color:course.color}}/>}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${item.done?'text-[#6B6050] line-through':''}`}>{item.title}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#6B6050]"><Clock size={11}/>{item.duration}</div>
                        {!locked && !item.done && <button className="btn-primary text-xs px-3 py-1.5">Start</button>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
