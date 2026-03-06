'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useAuth } from '@/lib/auth-context'
import { Flag, Handshake, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function GamePage() {
  const { user } = useAuth()
  const [game, setGame]       = useState(() => new Chess())
  const [moves, setMoves]     = useState<string[]>([])
  const [whiteTime, setWhiteTime] = useState(600_000)
  const [blackTime, setBlackTime] = useState(600_000)
  const [gameOver, setGameOver]   = useState<{ winner: string; reason: string } | null>(null)
  const [orientation] = useState<'white' | 'black'>('white')

  useEffect(() => {
    if (gameOver) return
    const interval = setInterval(() => {
      if (game.turn() === 'w') setWhiteTime(t => Math.max(0, t - 1000))
      else                     setBlackTime(t => Math.max(0, t - 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [game, gameOver])

  const handleMove = useCallback((source: string, target: string) => {
    const g = new Chess(game.fen())
    const result = g.move({ from: source, to: target, promotion: 'q' })
    if (!result) return false
    setGame(g)
    setMoves(prev => [...prev, result.san])
    if (g.isGameOver()) {
      setGameOver({
        winner: g.isCheckmate() ? (g.turn() === 'w' ? 'Black' : 'White') : 'None',
        reason: g.isCheckmate() ? 'Checkmate' : g.isStalemate() ? 'Stalemate' : 'Draw',
      })
    }
    return true
  }, [game])

  const PlayerCard = ({ name, rating, time, active, color }: any) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5' : 'border-white/[0.07]'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${color === 'white' ? 'bg-[#F0D9B5] text-[#1A1710]' : 'bg-[#B58863] text-[#F0D9B5]'}`}>
        {name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{name}</div>
        <div className="text-xs text-[#6B6050]">Rating: {rating}</div>
      </div>
      <div className={`font-mono text-lg font-bold ${time < 30000 ? 'text-red-400' : active ? 'text-[#D4AF37]' : 'text-[#A09880]'}`}>
        {formatTime(time)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F0E0B] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-3 gap-5 items-start">
        {/* Board */}
        <div className="lg:col-span-2 space-y-3">
          <PlayerCard name="Magnus Opponent" rating="1850" time={blackTime} active={game.turn() === 'b'} color="black" />
          <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${game.inCheck() ? 'ring-2 ring-red-400' : ''}`}>
            <Chessboard
              position={game.fen()}
              onPieceDrop={handleMove}
              boardOrientation={orientation}
              customBoardStyle={{ borderRadius: '16px' }}
              customDarkSquareStyle={{ backgroundColor: '#B58863' }}
              customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
            />
          </div>
          <PlayerCard name={user?.name || 'You'} rating={user?.rating || 1200} time={whiteTime} active={game.turn() === 'w'} color="white" />
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Controls */}
          <div className="card p-4 flex gap-2">
            <button className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
              <Flag size={15} /> Resign
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
              <Handshake size={15} /> Draw
            </button>
          </div>

          {/* Move history */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold">Move History</h3>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              {moves.length === 0 ? (
                <p className="text-xs text-[#6B6050] text-center py-4">Game not started</p>
              ) : (
                <div className="grid grid-cols-3 gap-1 text-sm font-mono">
                  {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => (
                    <>
                      <span key={`n${i}`} className="text-[#6B6050] text-xs py-1 px-2">{i + 1}.</span>
                      <span key={`w${i}`} className="py-1 px-2 rounded hover:bg-white/[0.05] cursor-pointer">{moves[i * 2]}</span>
                      <span key={`b${i}`} className="py-1 px-2 rounded hover:bg-white/[0.05] cursor-pointer">{moves[i * 2 + 1] || ''}</span>
                    </>
                  ))}
                </div>
              )}
            </div>
            <div className="flex border-t border-white/[0.07]">
              {[ChevronLeft, RotateCcw, ChevronRight].map((Icon, i) => (
                <button key={i} className="flex-1 py-2.5 flex items-center justify-center text-[#6B6050] hover:text-[#A09880] hover:bg-white/[0.04] transition-colors">
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Game status */}
          {gameOver && (
            <div className="card p-5 text-center border-[#D4AF37]/30 bg-[#D4AF37]/5">
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-display text-xl font-bold text-[#D4AF37]">Game Over</div>
              <div className="text-sm text-[#A09880] mt-1">{gameOver.winner !== 'None' ? `${gameOver.winner} wins` : 'Draw'}</div>
              <div className="text-xs text-[#6B6050] mt-0.5">by {gameOver.reason}</div>
              <button className="btn-primary w-full mt-4">New Game</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
