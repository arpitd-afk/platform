'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  Users, BookOpen, Star, CheckCircle2, Clock,
  Plus, ArrowUpRight, TrendingUp, Calendar
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const weekData = [
  { d: 'Mon', c: 2, s: 14 }, { d: 'Tue', c: 3, s: 22 }, { d: 'Wed', c: 1, s: 8 },
  { d: 'Thu', c: 4, s: 28 }, { d: 'Fri', c: 2, s: 16 }, { d: 'Sat', c: 3, s: 24 }, { d: 'Sun', c: 0, s: 0 },
]
const students = [
  { name: 'Arjun Sharma',  rating: 1210, progress: 82, status: 'improving',       last: '1h ago' },
  { name: 'Priya Nair',    rating: 980,  progress: 65, status: 'steady',          last: '3h ago' },
  { name: 'Rohit Verma',   rating: 1540, progress: 91, status: 'improving',       last: 'Yesterday' },
  { name: 'Meera Patel',   rating: 750,  progress: 45, status: 'needs_attention', last: '2d ago' },
  { name: 'Kiran Kumar',   rating: 1120, progress: 73, status: 'steady',          last: '1h ago' },
]
const upcomingClasses = [
  { title: 'Sicilian Defense — Batch A', time: '10:00 AM', students: 8,  today: true },
  { title: 'Endgame Techniques',         time: '2:00 PM',  students: 12, today: true },
  { title: 'Opening Theory — Advanced',  time: 'Tomorrow 11am', students: 6, today: false },
]

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[#6B6050] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.fill }}>{p.dataKey}: {p.value}</p>)}</div>
  : null

export default function CoachDashboard() {
  const { user } = useAuth()
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Morning, {user?.name?.split(' ')[0]} ♟</h1>
          <p className="text-[#6B6050] text-sm mt-1">You have {upcomingClasses.filter(c => c.today).length} classes today</p>
        </div>
        <div className="flex gap-2">
          <Link href="/coach/assignments/new" className="btn-secondary text-sm"><Plus size={15} />Assignment</Link>
          <Link href="/coach/classroom/new" className="btn-primary text-sm"><Plus size={15} />New Class</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Students', value: '47', icon: Users, color: '#4ADE80', sub: '+3 this month' },
          { label: 'Classes / Week', value: '15', icon: BookOpen, color: '#60A5FA', sub: '3 today' },
          { label: 'Avg Rating', value: '1,140', icon: Star, color: '#D4AF37', sub: '+28 avg gain' },
          { label: 'Pending Reviews', value: '8', icon: CheckCircle2, color: '#F472B6', sub: 'assignments' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.color}15` }}>
              <s.icon size={17} style={{ color: s.color }} />
            </div>
            <div className="font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-[#6B6050]">{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <h3 className="section-title mb-5">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="d" tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Bar dataKey="s" fill="#60A5FA" radius={[4,4,0,0]} name="Students" />
              <Bar dataKey="c" fill="#D4AF37" radius={[4,4,0,0]} name="Classes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
            <h3 className="section-title text-sm">Today's Classes</h3>
            <Link href="/coach/classroom" className="text-xs text-[#4ADE80]">View all</Link>
          </div>
          <div className="p-3 space-y-2">
            {upcomingClasses.map((c, i) => (
              <div key={i} className={`p-3 rounded-xl border ${c.today ? 'border-[#4ADE80]/20 bg-[#4ADE80]/5' : 'border-white/[0.07]'}`}>
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-[#6B6050] flex items-center gap-1"><Clock size={10} />{c.time}</span>
                  {c.today && (
                    <Link href="/classroom/live" className="text-xs bg-[#4ADE80] text-[#0F0E0B] font-semibold px-2.5 py-1 rounded-lg">Join</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Students table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h3 className="section-title">My Students</h3>
          <Link href="/coach/students" className="text-xs text-[#4ADE80] flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="th">Student</th>
              <th className="th text-center">Rating</th>
              <th className="th">Progress</th>
              <th className="th">Status</th>
              <th className="th">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i} className="tr">
                <td className="td">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#4ADE80]/15 flex items-center justify-center text-xs font-bold text-[#4ADE80]">{s.name[0]}</div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="td text-center font-mono">{s.rating}</td>
                <td className="td w-32">
                  <div className="flex items-center gap-2">
                    <div className="progress-bar flex-1"><div className="progress-fill" style={{ width: `${s.progress}%` }} /></div>
                    <span className="text-xs text-[#6B6050] w-8">{s.progress}%</span>
                  </div>
                </td>
                <td className="td">
                  <span className={`badge text-xs ${s.status === 'improving' ? 'badge-green' : s.status === 'needs_attention' ? 'badge-red' : 'badge-gray'}`}>
                    {s.status === 'improving' ? '↑ Good' : s.status === 'needs_attention' ? '⚠ Needs help' : '→ Steady'}
                  </span>
                </td>
                <td className="td text-[#6B6050] text-sm">{s.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
