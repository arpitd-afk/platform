'use client'
import { useState } from 'react'
import { UserCheck, Plus, Star, Users, BookOpen, MoreHorizontal, Mail } from 'lucide-react'
const COACHES = [
  { id:'1', name:'Vikram Nair',   email:'vikram@example.com', specialization:'Tactics & Middlegame', students:24, classes:18, rating:2150, joined:'Jan 2023', active:true },
  { id:'2', name:'Meera Joshi',   email:'meera@example.com',  specialization:'Openings & Beginners',  students:18, classes:14, rating:1950, joined:'Mar 2023', active:true },
  { id:'3', name:'Suresh Reddy',  email:'suresh@example.com', specialization:'Endgame Specialist',    students:12, classes:10, rating:2080, joined:'Jun 2023', active:false },
]
export default function CoachesPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><UserCheck size={22} className="text-[#D4AF37]"/>Coaches</h1>
        <button className="btn-primary text-sm"><Plus size={15}/>Add Coach</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{l:'Total Coaches',v:COACHES.length,c:'#D4AF37'},{l:'Active',v:COACHES.filter(c=>c.active).length,c:'#4ADE80'},{l:'Total Students',v:COACHES.reduce((s,c)=>s+c.students,0),c:'#60A5FA'}].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div></div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {COACHES.map(c=>(
          <div key={c.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-lg">{c.name[0]}</div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-[#6B6050]">{c.specialization}</div>
                </div>
              </div>
              <span className={`badge text-xs ${c.active?'badge-green':'badge-gray'}`}>{c.active?'Active':'Inactive'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[{l:'Students',v:c.students,icon:Users},{l:'Classes',v:c.classes,icon:BookOpen},{l:'Rating',v:c.rating,icon:Star}].map(s=>(
                <div key={s.l} className="bg-white/[0.04] rounded-lg p-2.5 text-center">
                  <div className="font-bold text-sm text-[#D4AF37]">{s.v}</div>
                  <div className="text-[10px] text-[#6B6050]">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"><Mail size={13}/>Message</button>
              <button className="btn-icon"><MoreHorizontal size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
