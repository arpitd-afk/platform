'use client'

import { useState, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { Puzzle, Flame, Target, Lightbulb, RotateCcw, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

const PUZZLES = [
  { id: 1, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['g1f3','f6e4','f3f7'], desc: 'Knight Fork — find the winning tactic!', difficulty: 'Intermediate', rating: 1250 },
  { id: 2, fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', solution: ['a1a8'], desc: 'Back Rank Mate', difficulty: 'Beginner', rating: 800 },
]

export default function PuzzlesPage() {
  const [pi, setPi]               = useState(0)
  const [game, setGame]           = useState(() => new Chess(PUZZLES[0].fen))
  const [status, setStatus]       = useState<'playing' | 'correct' | 'wrong'>('playing')
  const [moveIndex, setMoveIndex] = useState(0)
  const [hint, setHint]           = useState(false)
  const [streak, setStreak]       = useState(7)
  const [solved, setSolved]       = useState(0)

  const puzzle = PUZZLES[pi % PUZZLES.length]

  const handleMove = useCallback((_: any, sourceSquare: string, targetSquare: string) => {
    const expectedUCI = puzzle.solution[moveIndex]
    const userUCI = sourceSquare + targetSquare

    if (userUCI !== expectedUCI) {
      setStatus('wrong')
      setTimeout(() => setStatus('playing'), 1000)
      return false
    }

    const newGame = new Chess(game.fen())
    newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    setGame(newGame)

    if (moveIndex + 1 >= puzzle.solution.length) {
      setStatus('correct')
      setStreak(s => s + 1)
      setSolved(s => s + 1)
    } else {
      setMoveIndex(i => i + 1)
    }
    return true
  }, [game, moveIndex, puzzle])

  const next = () => {
    const nextPi = pi + 1
    setPi(nextPi)
    const next = PUZZLES[nextPi % PUZZLES.length]
    setGame(new Chess(next.fen))
    setStatus('playing')
    setMoveIndex(0)
    setHint(false)
  }

  const retry = () => {
    setGame(new Chess(puzzle.fen))
    setStatus('playing')
    setMoveIndex(0)
    setHint(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Puzzle size={22} className="text-[#A78BFA]" />Puzzle Trainer</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 badge-gold px-3 py-2 rounded-lg">
            <Flame size={14} className="text-orange-400" />
            <span className="text-sm font-semibold">{streak} streak</span>
          </div>
          <div className="badge-green px-3 py-2 rounded-lg text-sm font-semibold">
            {solved} solved today
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Board */}
        <div className="lg:col-span-2">
          <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
            status === 'correct' ? 'ring-2 ring-green-400' : status === 'wrong' ? 'ring-2 ring-red-400' : ''
          }`}>
            <Chessboard
              position={game.fen()}
              onPieceDrop={handleMove}
              customBoardStyle={{ borderRadius: '16px' }}
              customDarkSquareStyle={{ backgroundColor: '#B58863' }}
              customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
            />
            {status !== 'playing' && (
              <div className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl`}>
                <div className="text-center">
                  {status === 'correct'
                    ? <><CheckCircle size={56} className="text-green-400 mx-auto mb-2" /><p className="text-xl font-bold text-green-400">Correct! ✨</p></>
                    : <><XCircle size={56} className="text-red-400 mx-auto mb-2" /><p className="text-xl font-bold text-red-400">Try again</p></>
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`badge text-xs ${puzzle.difficulty === 'Beginner' ? 'badge-green' : puzzle.difficulty === 'Intermediate' ? 'badge-gold' : 'badge-red'}`}>
                {puzzle.difficulty}
              </span>
              <span className="badge-gray text-xs">Rating {puzzle.rating}</span>
            </div>
            <p className="text-sm text-[#A09880] leading-relaxed">{puzzle.desc}</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B6050]">
                <span>Progress</span>
                <span>{moveIndex}/{puzzle.solution.length} moves</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(moveIndex / puzzle.solution.length) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setHint(true)}
              disabled={hint}
              className="btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <Lightbulb size={15} className="text-[#D4AF37]" />
              {hint ? `From: ${puzzle.solution[moveIndex]?.slice(0,2)}` : 'Hint'}
            </button>
            <button onClick={retry} className="btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm">
              <RotateCcw size={15} />
              Retry
            </button>
          </div>

          {status === 'correct' && (
            <button onClick={next} className="btn-primary w-full flex items-center justify-center gap-2">
              Next Puzzle <ChevronRight size={16} />
            </button>
          )}

          {/* Stats */}
          <div className="card p-4 space-y-3">
            <h4 className="text-xs font-semibold text-[#6B6050] uppercase tracking-wider">Today's Stats</h4>
            {[
              { label: 'Solved', value: solved },
              { label: 'Accuracy', value: '94%' },
              { label: 'Streak', value: `${streak} 🔥` },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-[#A09880]">{s.label}</span>
                <span className="font-semibold text-sm text-[#D4AF37]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
