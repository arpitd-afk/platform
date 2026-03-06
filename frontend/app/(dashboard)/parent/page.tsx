'use client'

import Link from 'next/link'
import { TrendingUp, Calendar, FileText, CreditCard, CheckCircle2, ArrowUpRight, Star } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const children = [
  {
    name: 'Arjun Sharma', age: 14, rating: 1210, ratingChange: '+160',
    coach: 'Vikram Nair', batch: 'Intermediate A', attendance: 92,
    homeworkDone: 4, homeworkTotal: 5, nextClass: 'Today 4:00 PM',
    history: [{ m: 'Jan', r: 1050 }, { m: 'Feb', r: 1080 }, { m: 'Mar', r: 1110 }, { m: 'Apr', r: 1145 }, { m: 'May', r: 1175 }, { m: 'Jun', r: 1210 }],
  },
  {
    name: 'Priya Sharma', age: 11, rating: 780, ratingChange: '+120',
    coach: 'Meera Joshi', batch: 'Beginner B', attendance: 85,
    homeworkDone: 3, homeworkTotal: 3, nextClass: 'Tomorrow 5:00 PM',
    history: [{ m: 'Jan', r: 660 }, { m: 'Feb', r: 700 }, { m: 'Mar', r: 720 }, { m: 'Apr', r: 740 }, { m: 'May', r: 760 }, { m: 'Jun', r: 780 }],
  },
]

const T = ({ active, payload }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs text-[#D4AF37] font-semibold">{payload[0].value}</div>
  : null

export default function ParentDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Parent Dashboard</h1>
        <p className="text-[#6B6050] text-sm mt-1">Track your children's chess progress</p>
      </div>

      {children.map((child, ci) => (
        <div key={ci} className="card overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.07]">
            <div className="w-12 h-12 rounded-full bg-[#A78BFA]/20 flex items-center justify-center text-lg font-bold text-[#A78BFA]">
              {child.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{child.name}</h3>
                <span className="text-xs text-[#6B6050]">Age {child.age}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#6B6050] mt-0.5">
                <span>Coach: {child.coach}</span>
                <span>·</span>
                <span>{child.batch}</span>
                <span>·</span>
                <span className="text-[#4ADE80]">Next: {child.nextClass}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <Star size={15} className="text-[#D4AF37]" />
                <span className="font-display text-2xl font-bold">{child.rating}</span>
              </div>
              <span className="text-xs text-green-400">{child.ratingChange} this year</span>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#6B6050] uppercase tracking-wider">This Month</h4>
              {[
                { label: 'Attendance', value: `${child.attendance}%`, color: child.attendance >= 90 ? '#4ADE80' : '#D4AF37', icon: Calendar },
                { label: 'Homework', value: `${child.homeworkDone}/${child.homeworkTotal}`, color: child.homeworkDone === child.homeworkTotal ? '#4ADE80' : '#D4AF37', icon: FileText },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-sm text-[#A09880]">
                    <s.icon size={14} style={{ color: s.color }} />{s.label}
                  </div>
                  <span className="font-semibold text-sm" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#6B6050] uppercase tracking-wider mb-3">Rating History</h4>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={child.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="m" tick={{ fill: '#6B6050', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto','auto']} tick={{ fill: '#6B6050', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<T />} />
                  <Line type="monotone" dataKey="r" stroke="#D4AF37" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#6B6050] uppercase tracking-wider mb-3">Coach Notes</h4>
              <div className="space-y-2">
                {[
                  { text: `${child.name.split(' ')[0]} showed excellent endgame technique this week.`, date: '3 days ago' },
                  { text: 'Needs to work on time management in rapid games.', date: '1 week ago' },
                ].map((fb, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-xs text-[#A09880] leading-relaxed">{fb.text}</p>
                    <p className="text-[10px] text-[#6B6050] mt-1">{fb.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Payments */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h3 className="section-title flex items-center gap-2"><CreditCard size={16} className="text-[#A78BFA]" />Payments</h3>
          <Link href="/parent/payments" className="text-xs text-[#A78BFA] flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
        </div>
        {[
          { desc: 'Monthly Fee — July 2024', amount: '₹3,500', date: 'Jul 1' },
          { desc: 'Tournament Entry — Summer Open', amount: '₹500', date: 'Jun 28' },
          { desc: 'Monthly Fee — June 2024', amount: '₹3,500', date: 'Jun 1' },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0">
            <div>
              <div className="text-sm font-medium">{p.desc}</div>
              <div className="text-xs text-[#6B6050] mt-0.5">{p.date}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">{p.amount}</span>
              <span className="badge-green text-xs"><CheckCircle2 size={10} /> Paid</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
