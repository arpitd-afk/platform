'use client'
import { Calendar, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
const ATTENDANCE = [
  { child:'Arjun Sharma', data:[
    {date:'Jul 15',class:'Intermediate A',status:'present'},{date:'Jul 13',class:'Intermediate A',status:'present'},
    {date:'Jul 10',class:'Tactics Workshop',status:'absent'},{date:'Jul 8',class:'Intermediate A',status:'present'},
    {date:'Jul 6',class:'Intermediate A',status:'present'},{date:'Jul 3',class:'Intermediate A',status:'late'},
  ]},
  { child:'Priya Sharma', data:[
    {date:'Jul 14',class:'Beginner B',status:'present'},{date:'Jul 12',class:'Beginner B',status:'present'},
    {date:'Jul 9',class:'Beginner B',status:'absent'},{date:'Jul 7',class:'Beginner B',status:'present'},
  ]},
]
const S:any={present:{label:'Present',icon:CheckCircle2,cls:'text-green-400'},absent:{label:'Absent',icon:XCircle,cls:'text-red-400'},late:{label:'Late',icon:AlertTriangle,cls:'text-yellow-400'}}
export default function AttendancePage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><Calendar size={22} className="text-[#60A5FA]"/>Attendance</h1>
        <p className="text-[#6B6050] text-sm mt-1">Class attendance records for your children</p>
      </div>
      {ATTENDANCE.map(child=>{
        const total=child.data.length, present=child.data.filter(d=>d.status==='present').length
        return (
          <div key={child.child} className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <h3 className="section-title">{child.child}</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#A09880]">Attendance rate:</span>
                <span className={`font-bold text-sm ${(present/total)>=0.9?'text-green-400':'text-yellow-400'}`}>{Math.round((present/total)*100)}%</span>
              </div>
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-white/[0.07]"><th className="th">Date</th><th className="th">Class</th><th className="th text-center">Status</th></tr></thead>
              <tbody>
                {child.data.map((d,i)=>{
                  const {icon:Icon,label,cls}=S[d.status]
                  return (
                    <tr key={i} className="tr">
                      <td className="td text-[#A09880]">{d.date}</td>
                      <td className="td font-medium">{d.class}</td>
                      <td className="td text-center"><span className={`flex items-center justify-center gap-1.5 text-xs font-medium ${cls}`}><Icon size={13}/>{label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
