'use client'
import { useAuth } from '@/lib/auth-context'
import { useMyChildren, useStudentAttendance } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { Calendar, CheckCircle2, XCircle } from 'lucide-react'

function ChildAttendance({ child, color }: { child: any; color: string }) {
  const { data: attendance = [] } = useStudentAttendance(child.id)
  const attended = attendance.filter((a: any) => a.status === 'present').length
  const pct = attendance.length > 0 ? Math.round((attended / attendance.length) * 100) : 0
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: `${color}20`, color }}>{child.name?.[0]}</div>
          <div><div className="font-semibold">{child.name}</div><div className="text-xs text-[var(--text-muted)]">{child.batch_name}</div></div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold" style={{ color }}>{pct}%</div>
          <div className="text-xs text-[var(--text-muted)]">Attendance</div>
        </div>
      </div>
      {attendance.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] text-center py-4">No attendance records yet</p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {attendance.slice(0, 10).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <div>
                <div className="text-sm font-medium">{a.class_title}</div>
                <div className="text-xs text-[var(--text-muted)]">{new Date(a.scheduled_at).toLocaleDateString()}</div>
              </div>
              {a.status === 'present'
                ? <CheckCircle2 size={16} className="text-green-400" />
                : <XCircle size={16} className="text-red-400" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const COLORS = ['#D4AF37', '#60A5FA', '#4ADE80', '#F472B6', '#A78BFA']

export default function ParentAttendancePage() {
  const { data: children = [], isLoading } = useMyChildren()
  if (isLoading) return <PageLoading />
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Calendar size={22} className="text-[#60A5FA]" />Attendance</h1>
      {children.length === 0 ? (
        <div className="card"><EmptyState title="No children linked" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {children.map((child: any, i: number) => (
            <ChildAttendance key={child.id} child={child} color={COLORS[i % COLORS.length]} />
          ))}
        </div>
      )}
    </div>
  )
}
