'use client'
import Link from 'next/link'
import { Users, Star, Calendar, BookOpen, TrendingUp } from 'lucide-react'
const CHILDREN = [
  { id:'1', name:'Arjun Sharma',  age:14, rating:1210, ratingChange:'+160', batch:'Intermediate A', coach:'Vikram Nair', attendance:92, homework:88, nextClass:'Today 4:00 PM', since:'Jan 2024' },
  { id:'2', name:'Priya Sharma',  age:11, rating:780,  ratingChange:'+120', batch:'Beginner B',     coach:'Meera Joshi', attendance:85, homework:95, nextClass:'Tomorrow 5:00 PM', since:'Mar 2024' },
]
export default function ParentChildrenPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Users size={22} className="text-[#A78BFA]"/>My Children</h1>
      {CHILDREN.map(child=>(
        <div key={child.id} className="card p-6">
          <div className="flex items-center gap-5 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#A78BFA]/20 flex items-center justify-center text-2xl font-bold text-[#A78BFA]">{child.name[0]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{child.name}</h2>
                <span className="badge-gray text-xs">Age {child.age}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#6B6050]">
                <span>📚 {child.batch}</span><span>·</span>
                <span>🎓 Coach {child.coach}</span><span>·</span>
                <span>📅 Enrolled {child.since}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end"><Star size={16} className="text-[#D4AF37]"/><span className="font-display text-3xl font-bold">{child.rating}</span></div>
              <span className="text-green-400 text-sm">{child.ratingChange} this year</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              {l:'Attendance',v:`${child.attendance}%`,c:child.attendance>=90?'#4ADE80':'#D4AF37',icon:Calendar},
              {l:'Homework',v:`${child.homework}%`,c:'#D4AF37',icon:BookOpen},
              {l:'Next Class',v:child.nextClass,c:'#60A5FA',icon:Calendar},
              {l:'Progress',v:'Good ↑',c:'#4ADE80',icon:TrendingUp},
            ].map(s=>(
              <div key={s.l} className="bg-white/[0.04] rounded-xl p-3 text-center">
                <div className="font-semibold text-sm" style={{color:s.c}}>{s.v}</div>
                <div className="text-[10px] text-[#6B6050] mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/parent/progress" className="btn-secondary flex-1 text-sm">View Progress</Link>
            <Link href="/parent/messages" className="btn-secondary flex-1 text-sm">Message Coach</Link>
          </div>
        </div>
      ))}
    </div>
  )
}
