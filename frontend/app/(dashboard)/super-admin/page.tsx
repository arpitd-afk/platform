'use client'

import Link from 'next/link'
import {
  Building2, Users, DollarSign, Activity, TrendingUp,
  ArrowUpRight, CheckCircle, AlertTriangle, Server
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'

const revenueData = [
  { m: 'Jan', r: 420 }, { m: 'Feb', r: 580 }, { m: 'Mar', r: 750 },
  { m: 'Apr', r: 690 }, { m: 'May', r: 920 }, { m: 'Jun', r: 1100 }, { m: 'Jul', r: 1340 },
]
const academiesData = [
  { m: 'Jan', n: 12 }, { m: 'Feb', n: 18 }, { m: 'Mar', n: 28 },
  { m: 'Apr', n: 35 }, { m: 'May', n: 44 }, { m: 'Jun', n: 58 }, { m: 'Jul', n: 72 },
]
const recentAcademies = [
  { name: 'Elite Chess Mumbai', plan: 'Academy', students: 142, status: 'active', rev: '₹1.02L' },
  { name: 'Delhi Chess Club',   plan: 'Enterprise', students: 380, status: 'active', rev: '₹4.5L' },
  { name: 'Bangalore Knights',  plan: 'Trial',    students: 28,  status: 'trial',  rev: '₹0' },
  { name: 'Chennai Grandmasters', plan: 'Academy', students: 95,  status: 'active', rev: '₹95K' },
]

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[#6B6050] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>)}</div>
  : null

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="text-[#6B6050] text-sm mt-1">ChessAcademy Pro · All systems operational</p>
        </div>
        <div className="flex items-center gap-2 badge-green px-3 py-2 rounded-lg">
          <Server size={14} />
          <span className="text-sm font-medium">99.9% Uptime</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Academies', value: '72',    icon: Building2, color: '#D4AF37', sub: '+8 this month' },
          { label: 'Active Students', value: '14.2K', icon: Users,     color: '#60A5FA', sub: '+1.2K this month' },
          { label: 'Monthly Revenue', value: '₹13.4L', icon: DollarSign,color: '#4ADE80', sub: '+22% vs last month' },
          { label: 'Games Today',     value: '8,420',  icon: Activity,  color: '#A78BFA', sub: 'Peak: 11pm' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <TrendingUp size={13} className="text-green-400" />
            </div>
            <div className="font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-[#6B6050]">{s.label}</div>
            <div className="text-xs text-green-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Monthly Revenue (₹K)</h3>
            <span className="badge-green text-xs">+22% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}K`} />
              <Tooltip content={<T />} />
              <Area type="monotone" dataKey="r" stroke="#4ADE80" strokeWidth={2} fill="url(#revG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Academy growth */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Academy Growth</h3>
            <Link href="/super-admin/academies" className="text-xs text-[#D4AF37] flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={academiesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Bar dataKey="n" fill="#D4AF37" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Academies table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h3 className="section-title">Recent Academies</h3>
          <Link href="/super-admin/academies" className="text-xs text-[#D4AF37] flex items-center gap-1">Manage all <ArrowUpRight size={12} /></Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="th">Academy</th>
              <th className="th">Plan</th>
              <th className="th text-center">Students</th>
              <th className="th text-right">MRR</th>
              <th className="th text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentAcademies.map((a, i) => (
              <tr key={i} className="tr">
                <td className="td font-medium">{a.name}</td>
                <td className="td">
                  <span className={`badge text-xs ${a.plan === 'Enterprise' ? 'badge-gold' : a.plan === 'Trial' ? 'badge-gray' : 'badge-blue'}`}>{a.plan}</span>
                </td>
                <td className="td text-center font-mono">{a.students}</td>
                <td className="td text-right font-mono">{a.rev}</td>
                <td className="td text-center">
                  <span className={`text-xs flex items-center justify-center gap-1 ${a.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {a.status === 'active' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
