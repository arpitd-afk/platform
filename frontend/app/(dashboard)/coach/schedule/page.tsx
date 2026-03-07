'use client'
import { useState } from 'react'
import { useClassrooms } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import Link from 'next/link'
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, Video } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CoachSchedulePage() {
  const { data: classrooms = [], isLoading } = useClassrooms()
  const today = new Date()
  const [viewDate, setViewDate] = useState(today)

  if (isLoading) return <PageLoading />

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )

  const getClassesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return classrooms.filter((c: any) => c.scheduled_at?.startsWith(dateStr))
  }

  const selectedDayClasses = getClassesForDay(today.getDate())
  const upcomingClasses = classrooms
    .filter((c: any) => c.scheduled_at && new Date(c.scheduled_at) >= today)
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Calendar size={22} className="text-[#4ADE80]" />My Schedule</h1>
        <Link href="/coach/classroom" className="btn-primary text-sm"><Plus size={15} />Schedule Class</Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">{MONTHS[month]} {year}</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="btn-icon w-8 h-8"><ChevronLeft size={15} /></button>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="btn-icon w-8 h-8"><ChevronRight size={15} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs text-[var(--text-muted)] font-medium py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const classes = getClassesForDay(day)
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              return (
                <div key={day} className={`aspect-square flex flex-col items-center justify-start p-1 rounded-xl text-xs cursor-pointer transition-all ${isToday ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40' : 'hover:bg-[var(--bg-hover)]'}`}>
                  <span className={`font-medium mb-0.5 ${isToday ? 'text-[var(--amber)]' : 'text-[var(--text-mid)]'}`}>{day}</span>
                  {classes.slice(0, 2).map((c: any, ci: number) => (
                    <div key={ci} className={`w-full text-[9px] px-1 py-0.5 rounded truncate text-center ${c.status === 'live' ? 'bg-red-400/20 text-red-400' : 'bg-[#60A5FA]/20 text-[#60A5FA]'}`}>
                      {c.title?.slice(0, 6)}
                    </div>
                  ))}
                  {classes.length > 2 && <div className="text-[9px] text-[var(--text-muted)]">+{classes.length - 2}</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming list */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]"><h3 className="section-title">Upcoming Classes</h3></div>
          {upcomingClasses.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">No upcoming classes</div>
          ) : (
            <div className="divide-y divide-white/[0.05] max-h-96 overflow-y-auto">
              {upcomingClasses.map((c: any) => {
                const dt = new Date(c.scheduled_at)
                const isLive = c.status === 'live'
                return (
                  <div key={c.id} className={`px-5 py-3.5 ${isLive ? 'bg-red-400/[0.05]' : ''}`}>
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs font-medium ${isLive ? 'text-red-400' : 'text-[#60A5FA]'}`}>
                        {isLive ? '🔴 LIVE' : `${dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="font-medium text-sm">{c.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                      {c.batch_name && <span>{c.batch_name}</span>}
                      {c.duration_min && <span className="flex items-center gap-1"><Clock size={9} />{c.duration_min}min</span>}
                    </div>
                    {isLive && (
                      <Link href={`/classroom/${c.id}`} className="btn-primary text-xs py-1.5 mt-2 flex items-center justify-center gap-1.5">
                        <Video size={11} />Join Now
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
