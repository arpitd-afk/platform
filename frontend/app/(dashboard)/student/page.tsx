'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  Puzzle, Trophy, BookOpen, TrendingUp, Flame,
  ArrowUpRight, Target, CheckCircle2, Clock, Swords, Star
} from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const ratingData = [
  { d: 'Jun 1', r: 1050 }, { d: 'Jun 7', r: 1080 }, { d: 'Jun 14', r: 1105 },
  { d: 'Jun 21', r: 1090 }, { d: 'Jun 28', r: 1140 }, { d: 'Jul 5', r: 1175 },
  { d: 'Jul 12', r: 1210 },
]
const radarData = [
  { s: 'Tactics',  v: 72 }, { s: 'Endgame', v: 58 }, { s: 'Opening', v: 81 },
  { s: 'Strategy', v: 64 }, { s: 'Speed',   v: 77 }, { s: 'Accuracy', v: 69 },
]
const assignments = [
  { title: 'Sicilian Dragon Opening', due: 'Today', status: 'pending', type: 'Opening Study' },
  { title: 'Knight Fork Puzzles (10)', due: 'Tomorrow', status: 'pending', type: 'Puzzles' },
  { title: 'Rook Endgame Basics', due: 'Jul 18', status: 'submitted', type: 'Endgame' },
]

const Tip = ({ active, payload }: any) => active && payload?.length
  ? <div className="card px-3 py-2 text-xs text-[#D4AF37] font-semibold">{payload[0].value}</div>
  : null

export default function StudentDashboard() {
  const { user } = useAuth()
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            Good morning, <span className="text-gold-gradient">{user?.name?.split(' ')[0]}</span> ♟
          </h1>
          <p className="text-[#6B6050] text-sm mt-1">Your chess journey continues — keep improving!</p>
        </div>
        <Link href="/game" className="btn-primary">
          <Swords size={16} /> Play Now
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Rating', value: user?.rating || 1210, icon: Star, color: '#D4AF37', sub: '+42 this month' },
          { label: 'Puzzle Streak', value: '12 🔥', icon: Flame, color: '#F97316', sub: 'Personal best!' },
          { label: 'Games Played', value: 284, icon: Swords, color: '#60A5FA', sub: 'Win rate 58%' },
          { label: 'Puzzles Solved', value: 1420, icon: Puzzle, color: '#A78BFA', sub: '94% accuracy' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
            </div>
            <div className="font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-[#6B6050]">{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Rating chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Rating Progress</h3>
            <span className="badge-green text-xs">+160 pts ↑</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ratingData}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="d" tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto','auto']} tick={{ fill: '#6B6050', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="r" stroke="#D4AF37" strokeWidth={2.5} fill="url(#rg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Skill radar */}
        <div className="card p-6">
          <h3 className="section-title mb-5">Skill Radar</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="s" tick={{ fill: '#6B6050', fontSize: 11 }} />
              <Radar dataKey="v" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Assignments */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <h3 className="section-title">Assignments</h3>
            <Link href="/student/assignments" className="text-xs text-[#D4AF37] flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-gray text-[11px]">{a.type}</span>
                    <span className="text-xs text-[#6B6050] flex items-center gap-1"><Clock size={10} />{a.due}</span>
                  </div>
                </div>
                <span className={a.status === 'submitted' ? 'badge-green text-[11px]' : 'badge-gold text-[11px]'}>
                  {a.status === 'submitted' ? <><CheckCircle2 size={10} /> Done</> : 'Due'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily tasks */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Today's Training</h3>
          <div className="space-y-3">
            {[
              { t: 'Solve 10 tactics puzzles', pts: '+50 XP', done: true,  icon: Puzzle },
              { t: 'Play 1 rated game',        pts: '+30 XP', done: true,  icon: Swords },
              { t: 'Watch opening lesson',     pts: '+20 XP', done: false, icon: BookOpen },
              { t: 'Review yesterday\'s game', pts: '+25 XP', done: false, icon: TrendingUp },
            ].map((task, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.done ? 'border-green-500/20 bg-green-500/5' : 'border-white/[0.07]'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${task.done ? 'bg-green-500/20' : 'bg-white/[0.05]'}`}>
                  {task.done
                    ? <CheckCircle2 size={15} className="text-green-400" />
                    : <task.icon size={15} className="text-[#6B6050]" />
                  }
                </div>
                <span className={`flex-1 text-sm ${task.done ? 'line-through text-[#6B6050]' : ''}`}>{task.t}</span>
                <span className="text-xs text-[#D4AF37]">{task.pts}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.07]">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#A09880]">Daily progress</span>
              <span className="text-[#D4AF37] font-semibold">2 / 4 done</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
