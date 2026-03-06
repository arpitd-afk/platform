'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  Users, BookOpen, Trophy, DollarSign, TrendingUp,
  ArrowUpRight, Calendar, Plus, AlertTriangle, CheckCircle2
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const enrollData = [
  { m: 'Jan', s: 28 }, { m: 'Feb', s: 35 }, { m: 'Mar', s: 42 },
  { m: 'Apr', s: 38 }, { m: 'May', s: 51 }, { m: 'Jun', s: 60 }, { m: 'Jul', s: 74 },
]
const revenueData = [
  { m: 'Jan', r: 45 }, { m: 'Feb', r: 52 }, { m: 'Mar', r: 61 },
  { m: 'Apr', r: 58 }, { m: 'May', r: 73 }, { m: 'Jun', r: 88 }, { m: 'Jul', r: 102 },
]
const activity = [
  { icon: '👤', text: 'New student Aanya enrolled in Batch B', t: '5m ago' },
  { icon: '📋', text: 'Classroom "Tactics Workshop" completed', t: '2h ago' },
  { icon: '🏆', text: 'Summer Open registration closed (48 players)', t: '3h ago' },
  { icon: '💳', text: 'Monthly invoice generated — ₹1,02,000', t: '1d ago' },
]

const T = ({ active, payload, label }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs"><p className="text-[#6B6050] mb-1">{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>)}</div>
  : null

export default function AcademyDashboard() {
  const { user } = useAuth()
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">{user?.academyName || 'Academy'} Dashboard</h1>
          <p className="text-[#6B6050] text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/academy/students" className="btn-secondary text-sm"><Plus size={15} />Student</Link>
          <Link href="/academy/classes/new" className="btn-primary text-sm"><Plus size={15} />New Class</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: '142', icon: Users, color: '#60A5FA', sub: '+12 this month' },
          { label: 'Active Coaches', value: '8', icon: CheckCircle2, color: '#D4AF37', sub: '2 part-time' },
          { label: 'Classes / Month', value: '64', icon: BookOpen, color: '#4ADE80', sub: '+8 vs last month' },
          { label: 'Monthly Revenue', value: '₹1.02L', icon: DollarSign, color: '#F472B6', sub: '+16%' },
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
        <div className="card p-6">
          <h3 className="section-title mb-5">Student Enrollment</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={enrollData}>
              <defs>
                <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Area type="monotone" dataKey="s" stroke="#60A5FA" strokeWidth={2} fill="url(#eg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-5">Revenue (₹K)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Bar dataKey="r" fill="#F472B6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <h3 className="section-title">Recent Activity</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span className="text-lg mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-[#6B6050] mt-0.5">{a.t}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="space-y-1.5">
            {[
              { label: 'Create Tournament', href: '/academy/tournaments', color: '#D4AF37' },
              { label: 'Schedule a Class',  href: '/academy/classes',    color: '#60A5FA' },
              { label: 'Add a Student',     href: '/academy/students',   color: '#4ADE80' },
              { label: 'View Analytics',    href: '/academy/analytics',  color: '#F472B6' },
              { label: 'Billing & Plans',   href: '/academy/billing',    color: '#A78BFA' },
            ].map((a, i) => (
              <Link key={i} href={a.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
                <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span className="text-sm text-[#A09880] group-hover:text-[#F5F0E8] transition-colors">{a.label}</span>
                <ArrowUpRight size={13} className="ml-auto text-[#6B6050]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
