'use client'
import { Calendar, Clock, Users } from 'lucide-react'
const WEEK = ['Mon Jul 15','Tue Jul 16','Wed Jul 17','Thu Jul 18','Fri Jul 19','Sat Jul 20','Sun Jul 21']
const SCHEDULE:any = {
  'Mon Jul 15':[{time:'10:00 AM',title:'Intermediate A',duration:'60 min',students:8},{time:'4:00 PM',title:'Beginner B',duration:'60 min',students:12}],
  'Tue Jul 16':[{time:'11:00 AM',title:'Advanced Group',duration:'90 min',students:6}],
  'Wed Jul 17':[],
  'Thu Jul 18':[{time:'10:00 AM',title:'Intermediate A',duration:'60 min',students:8},{time:'2:00 PM',title:'Beginner A',duration:'60 min',students:10},{time:'6:00 PM',title:'Private Lesson',duration:'60 min',students:1}],
  'Fri Jul 19':[{time:'4:00 PM',title:'Beginner B',duration:'60 min',students:12}],
  'Sat Jul 20':[{time:'10:00 AM',title:'Weekend Workshop',duration:'120 min',students:20}],
  'Sun Jul 21':[],
}
export default function CoachSchedulePage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Calendar size={22} className="text-[#4ADE80]"/>My Schedule</h1>
      <div className="grid md:grid-cols-7 gap-3">
        {WEEK.map((day,i)=>(
          <div key={day} className={`card p-3 ${i===1?'border-[#D4AF37]/40 bg-[#D4AF37]/5':''}`}>
            <div className="text-center mb-3">
              <div className="text-xs text-[#6B6050]">{day.split(' ')[0]}</div>
              <div className={`font-bold text-sm mt-0.5 ${i===1?'text-[#D4AF37]':''}`}>{day.split(' ')[1]} {day.split(' ')[2]}</div>
              {i===1 && <div className="text-[10px] badge-gold mt-1 mx-auto w-fit px-1.5">Today</div>}
            </div>
            <div className="space-y-2">
              {SCHEDULE[day]?.map((c:any,ci:number)=>(
                <div key={ci} className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg p-2">
                  <div className="text-xs font-semibold text-[#D4AF37]">{c.time}</div>
                  <div className="text-xs truncate mt-0.5">{c.title}</div>
                  <div className="text-[10px] text-[#6B6050]">{c.duration} · {c.students} students</div>
                </div>
              ))}
              {SCHEDULE[day]?.length===0 && <div className="text-center text-[11px] text-[#6B6050] py-3">Free</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
