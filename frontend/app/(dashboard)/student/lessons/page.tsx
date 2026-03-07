'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useLessons, useMyLessonProgress, useCompleteLesson } from '@/lib/hooks'
import { PageLoading, EmptyState } from '@/components/shared/States'
import { BookOpen, Play, Lock, CheckCircle2, Clock, ChevronDown, ChevronRight } from 'lucide-react'

const LEVEL_COLOR: Record<string, string> = { beginner: '#4ADE80', intermediate: '#D4AF37', advanced: '#F87171', expert: '#A78BFA' }

export default function LessonsPage() {
  const { user } = useAuth()
  const { data: lessons = [], isLoading } = useLessons({ academyId: user?.academyId })
  const { data: progress = [] } = useMyLessonProgress()
  const complete = useCompleteLesson()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  if (isLoading) return <PageLoading />

  const completedIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id))
  const completedCount = lessons.filter((l: any) => completedIds.has(l.id)).length

  const filtered = filter === 'all' ? lessons :
    filter === 'completed' ? lessons.filter((l: any) => completedIds.has(l.id)) :
    filter === 'in_progress' ? lessons.filter((l: any) => !completedIds.has(l.id)) :
    lessons.filter((l: any) => l.level === filter)

  const handleComplete = async (lessonId: string) => {
    await complete.mutateAsync(lessonId)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><BookOpen size={22} className="text-[#60A5FA]" />Lessons</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">{completedCount} of {lessons.length} completed</p>
        </div>
      </div>

      {lessons.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[var(--text-mid)]">Overall Progress</span>
            <span className="text-[#60A5FA] font-medium">{lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0}%</span>
          </div>
          <div className="progress-bar h-2.5">
            <div className="progress-fill" style={{ width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%`, background: '#60A5FA' }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 card p-1 rounded-xl w-fit flex-wrap">
        {['all', 'in_progress', 'completed', 'beginner', 'intermediate', 'advanced'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#60A5FA]/15 text-[#60A5FA]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="No lessons available" subtitle="Lessons assigned by your academy will appear here" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson: any) => {
            const done = completedIds.has(lesson.id)
            const color = LEVEL_COLOR[lesson.level] || '#60A5FA'
            const open = expanded === lesson.id
            return (
              <div key={lesson.id} className={`card overflow-hidden ${done ? 'opacity-80' : ''}`}>
                <button onClick={() => setExpanded(open ? null : lesson.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-[var(--bg)] transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500/15' : `bg-[${color}]/10`}`}
                    style={{ background: done ? 'rgba(74,222,128,0.15)' : `${color}15` }}>
                    {done ? <CheckCircle2 size={18} className="text-green-400" /> : <BookOpen size={18} style={{ color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge text-xs capitalize" style={{ background: `${color}15`, color }}>{lesson.level}</span>
                      {done && <span className="badge-green text-xs">Completed</span>}
                    </div>
                    <h3 className="font-semibold text-sm">{lesson.title}</h3>
                    {lesson.description && <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{lesson.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {lesson.content?.duration && (
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock size={11} />{lesson.content.duration}
                      </span>
                    )}
                    {open ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronRight size={16} className="text-[var(--text-muted)]" />}
                  </div>
                </button>

                {open && (
                  <div className="px-5 pb-5 border-t border-[var(--border)]">
                    <div className="pt-4 space-y-4">
                      {lesson.content?.pgn && (
                        <div className="bg-white rounded-xl p-3">
                          <div className="text-xs font-semibold text-[var(--amber)] mb-2">PGN</div>
                          <p className="font-mono text-xs text-[var(--text-muted)] break-all">{lesson.content.pgn.slice(0, 200)}...</p>
                        </div>
                      )}
                      {lesson.video_url && (
                        <div className="aspect-video bg-white rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <Play size={32} className="text-[var(--amber)] mx-auto mb-2" />
                            <p className="text-sm text-[var(--text-muted)]">Video lesson available</p>
                          </div>
                        </div>
                      )}
                      {lesson.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {lesson.tags.map((t: string) => <span key={t} className="badge-gray text-xs">{t}</span>)}
                        </div>
                      )}
                      {!done ? (
                        <button onClick={() => handleComplete(lesson.id)} disabled={complete.isPending}
                          className="btn-primary text-sm flex items-center gap-2">
                          <CheckCircle2 size={15} />{complete.isPending ? 'Marking...' : 'Mark as Complete'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                          <CheckCircle2 size={16} />Completed ✓
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
