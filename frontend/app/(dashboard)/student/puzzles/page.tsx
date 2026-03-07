'use client'
import { useState, useCallback } from 'react'
import { useRandomPuzzle, useSubmitPuzzle } from '@/lib/hooks'
import { useAuth } from '@/lib/auth-context'
import { useUserStats } from '@/lib/hooks'
import { PageLoading } from '@/components/shared/States'
import { Puzzle, RefreshCw, ChevronRight, Lightbulb, CheckCircle2, XCircle, Trophy, Loader2, Flame } from 'lucide-react'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert']

export default function PuzzlesPage() {
  const { user } = useAuth()
  const { data: stats } = useUserStats(user?.id)
  const [difficulty, setDifficulty] = useState('intermediate')
  const [hint, setHint] = useState(false)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [startTime] = useState(Date.now())

  const { data: puzzle, isLoading, refetch, isFetching } = useRandomPuzzle(difficulty)
  const submitPuzzle = useSubmitPuzzle()

  const handleMove = useCallback(async (move: string) => {
    if (!puzzle || result) return
    const timeTakenMs = Date.now() - startTime
    try {
      const res = await submitPuzzle.mutateAsync({ id: puzzle.id, moves: [move], timeTakenMs })
      setResult(res.data.isCorrect ? 'correct' : 'wrong')
    } catch { setResult('wrong') }
  }, [puzzle, result, startTime, submitPuzzle])

  const nextPuzzle = () => { setResult(null); setHint(false); refetch() }

  if (isLoading) return <PageLoading />

  const accuracy = stats?.puzzles?.total > 0 ? Math.round((stats.puzzles.correct / stats.puzzles.total) * 100) : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><Puzzle size={22} className="text-[#7C3AED]" />Puzzle Trainer</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Sharpen your tactical vision</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[#7C3AED]">{stats?.puzzles?.total || 0}</div><div className="text-xs text-[var(--text-muted)]">Puzzles Solved</div></div>
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[var(--amber)]">{accuracy}%</div><div className="text-xs text-[var(--text-muted)]">Accuracy</div></div>
        <div className="stat-card"><div className="font-display text-2xl font-bold text-[#F97316] flex items-center gap-1.5"><Flame size={18} />0</div><div className="text-xs text-[var(--text-muted)]">Daily Streak</div></div>
      </div>

      <div className="flex items-center gap-1 card p-1 rounded-xl w-fit">
        {DIFFICULTIES.map(d => (
          <button key={d} onClick={() => { setDifficulty(d); setResult(null); setHint(false) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${difficulty === d ? 'bg-[#EDE9FE]/15 text-[#7C3AED]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 card p-5">
          {isFetching ? (
            <div className="flex items-center justify-center h-80"><Loader2 size={28} className="text-[var(--amber)] animate-spin" /></div>
          ) : puzzle ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="badge-gray text-xs">#{puzzle.id?.slice(0, 8)}</span>
                  <span className="badge text-xs bg-[#EDE9FE]/15 text-[#7C3AED]">Rating: {puzzle.rating}</span>
                </div>
                {result && (
                  <div className={`flex items-center gap-2 text-sm font-semibold ${result === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                    {result === 'correct' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {result === 'correct' ? 'Correct!' : 'Wrong!'}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl p-4 text-center mb-4">
                <div className="font-mono text-xs text-[var(--text-muted)] break-all">{puzzle.fen}</div>
                <p className="text-sm text-[var(--text-mid)] mt-3">
                  {puzzle.fen?.includes('w') ? '⬜ White to move' : '⬛ Black to move'}
                </p>
              </div>
              {hint && puzzle.moves && (
                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl mb-4">
                  <p className="text-xs text-[var(--amber)]">Hint: Look for a <strong>{puzzle.themes?.[0] || 'tactical'}</strong> opportunity.</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                {!result && (
                  <button onClick={() => setHint(true)} className="btn-secondary text-sm flex items-center gap-2">
                    <Lightbulb size={14} />Hint
                  </button>
                )}
                <button onClick={nextPuzzle} className="btn-primary text-sm flex items-center gap-2 ml-auto">
                  <RefreshCw size={14} />{result ? 'Next Puzzle' : 'Skip'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Puzzle size={32} className="text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)] text-sm">No puzzles available for this difficulty</p>
              <button onClick={() => refetch()} className="btn-secondary text-sm">Try Again</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">About This Puzzle</h3>
            {puzzle ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Difficulty</span>
                  <span className="capitalize text-[#7C3AED]">{difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Rating</span>
                  <span className="font-mono text-[var(--amber)]">{puzzle.rating}</span>
                </div>
                {puzzle.themes && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Themes</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {(puzzle.themes.slice(0, 3)).map((t: string) => (
                        <span key={t} className="badge-gray text-[10px] capitalize">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Played</span>
                  <span className="text-[var(--text-mid)]">{puzzle.nb_plays?.toLocaleString() || 0}×</span>
                </div>
              </div>
            ) : <p className="text-[var(--text-muted)] text-sm">Load a puzzle to see details</p>}
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Total Solved</span>
                <span className="font-semibold">{stats?.puzzles?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Correct</span>
                <span className="text-green-400 font-semibold">{stats?.puzzles?.correct || 0}</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">Accuracy</span>
                  <span className="text-[var(--amber)]">{accuracy}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${accuracy}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
