'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useAuth } from '@/lib/auth-context'
import { useSearchParams, useRouter } from 'next/navigation'
import { gamesAPI } from '@/lib/api'
import { getSocket } from '@/lib/hooks/useSocket'
import { Flag, Handshake, RotateCcw, ChevronLeft, ChevronRight, Loader2, Wifi, WifiOff, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type GameState = {
  id: string
  fen: string
  pgn: string
  whiteId: string
  blackId: string
  whiteName: string
  blackName: string
  whiteRating: number
  blackRating: number
  whiteTimeMs: number
  blackTimeMs: number
  status: string
  moves: Array<{ san: string; uci: string; fen: string }>
  result?: { winner: string | null; reason: string }
}

export default function GamePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameId = searchParams.get('id')
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const [chess, setChess] = useState(() => new Chess())
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [whiteTimeMs, setWhiteTimeMs] = useState(600_000)
  const [blackTimeMs, setBlackTimeMs] = useState(600_000)
  const [gameOver, setGameOver] = useState<{ winner: string | null; reason: string } | null>(null)
  const [drawOffer, setDrawOffer] = useState<{ from: string } | null>(null)
  const [connected, setConnected] = useState(false)
  const [replayIdx, setReplayIdx] = useState(-1) // -1 = live
  const [currentMoveIdx, setCurrentMoveIdx] = useState(0)
  const moveListRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const isMyTurn = gameState
    ? (chess.turn() === 'w' && user?.id === gameState.whiteId) ||
      (chess.turn() === 'b' && user?.id === gameState.blackId)
    : false
  const orientation: 'white' | 'black' = gameState?.blackId === user?.id ? 'black' : 'white'

  // Connect socket & join game
  useEffect(() => {
    if (!token || !gameId) return
    const socket = getSocket(token)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    if (socket.connected) setConnected(true)

    socket.on('game:state', (state: GameState) => {
      applyState(state)
    })
    socket.on('game:start', (state: any) => {
      toast.success('Game started!')
      applyState(state)
    })
    socket.on('game:move', ({ move, fen, whiteTimeMs: wt, blackTimeMs: bt, inCheck, gameOver: go }: any) => {
      setChess(prev => {
        const g = new Chess(fen)
        return g
      })
      setWhiteTimeMs(wt)
      setBlackTimeMs(bt)
      setCurrentMoveIdx(prev => prev + 1)
      if (go) { setGameOver(go); clearTimer() }
      if (inCheck) toast('Check!', { icon: '⚠️' })
    })
    socket.on('game:over', (result: any) => {
      setGameOver(result)
      clearTimer()
    })
    socket.on('game:draw_offer', ({ from }: any) => {
      setDrawOffer({ from })
      toast('Opponent offers a draw', { icon: '🤝' })
    })
    socket.on('game:opponent_disconnected', () => {
      toast('Opponent disconnected', { icon: '📡' })
    })
    socket.on('game:created', ({ gameId: gid, color }: any) => {
      router.push(`/game?id=${gid}`)
    })

    socket.emit('game:join', { gameId })

    return () => {
      socket.off('game:state')
      socket.off('game:start')
      socket.off('game:move')
      socket.off('game:over')
      socket.off('game:draw_offer')
      socket.off('game:opponent_disconnected')
    }
  }, [token, gameId])

  // Fetch game from API if no socket state yet
  useEffect(() => {
    if (!gameId) return
    gamesAPI.get(gameId).then((res: any) => {
      const g = res.data.game
      if (g) applyStateFromDB(g)
    }).catch(() => {})
  }, [gameId])

  function applyState(state: any) {
    const g = new Chess(state.fen || 'start')
    setChess(g)
    setGameState(state)
    setWhiteTimeMs(state.whiteTimeMs || 600_000)
    setBlackTimeMs(state.blackTimeMs || 600_000)
    if (state.result) setGameOver(state.result)
  }

  function applyStateFromDB(g: any) {
    const chess = new Chess()
    try { if (g.pgn) chess.loadPgn(g.pgn) } catch {}
    setChess(chess)
    setWhiteTimeMs(g.white_time_ms || 600_000)
    setBlackTimeMs(g.black_time_ms || 600_000)
    setCurrentMoveIdx(chess.history().length)
    setGameState({
      id: g.id, fen: chess.fen(), pgn: g.pgn || '',
      whiteId: g.white_player_id, blackId: g.black_player_id,
      whiteName: g.white_name || 'White', blackName: g.black_name || 'Black',
      whiteRating: g.white_rating || 1200, blackRating: g.black_rating || 1200,
      whiteTimeMs: g.white_time_ms || 600_000, blackTimeMs: g.black_time_ms || 600_000,
      status: g.status, moves: [],
      result: g.result ? (typeof g.result === 'string' ? JSON.parse(g.result) : g.result) : undefined,
    })
    if (g.result || g.status === 'completed') {
      const r = typeof g.result === 'string' ? JSON.parse(g.result) : g.result
      setGameOver(r)
    }
  }

  // Timer
  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }
  useEffect(() => {
    if (gameOver || gameState?.status !== 'active') return
    clearTimer()
    timerRef.current = setInterval(() => {
      if (chess.turn() === 'w') {
        setWhiteTimeMs(t => {
          if (t <= 1000) { handleTimeout('white'); return 0 }
          return t - 1000
        })
      } else {
        setBlackTimeMs(t => {
          if (t <= 1000) { handleTimeout('black'); return 0 }
          return t - 1000
        })
      }
    }, 1000)
    return clearTimer
  }, [chess, gameOver, gameState?.status])

  function handleTimeout(color: string) {
    clearTimer()
    if (token && gameId) {
      getSocket(token).emit('game:timeout', { gameId, color })
    }
  }

  // Auto-scroll move list
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight
    }
  }, [currentMoveIdx])

  const handleMove = useCallback((source: string, target: string, piece: string) => {
    if (!isMyTurn || replayIdx !== -1 || gameOver) return false

    const g = new Chess(chess.fen())
    const result = g.move({ from: source, to: target, promotion: 'q' })
    if (!result) return false

    const uci = source + target + (result.promotion || '')
    const currentTime = chess.turn() === 'w' ? whiteTimeMs : blackTimeMs

    if (token && gameId) {
      getSocket(token).emit('game:move', { gameId, move: uci, timeLeftMs: currentTime })
    } else {
      // Offline fallback
      setChess(g)
      setCurrentMoveIdx(prev => prev + 1)
      if (g.isGameOver()) {
        setGameOver({
          winner: g.isCheckmate() ? (g.turn() === 'w' ? 'black' : 'white') : null,
          reason: g.isCheckmate() ? 'checkmate' : g.isStalemate() ? 'stalemate' : 'draw',
        })
      }
    }
    return true
  }, [chess, isMyTurn, replayIdx, gameOver, token, gameId, whiteTimeMs, blackTimeMs])

  const handleResign = async () => {
    if (!gameId || !token) return
    if (!confirm('Resign this game?')) return
    try {
      await gamesAPI.resign(gameId)
      toast('You resigned')
    } catch {
      getSocket(token).emit('game:resign', { gameId })
    }
  }

  const handleDrawOffer = () => {
    if (!gameId || !token) return
    getSocket(token).emit('game:offer_draw', { gameId })
    toast('Draw offer sent')
  }

  const handleAcceptDraw = () => {
    if (!gameId || !token) return
    getSocket(token).emit('game:accept_draw', { gameId })
    setDrawOffer(null)
  }

  // Replay navigation
  const history = chess.history({ verbose: true }) as any[]
  const getReplayChess = (idx: number) => {
    const g = new Chess()
    const fullHistory = history
    for (let i = 0; i <= idx && i < fullHistory.length; i++) {
      g.move(fullHistory[i])
    }
    return g
  }

  const replayChess = replayIdx >= 0 ? getReplayChess(replayIdx) : chess
  const displayFen = replayChess.fen()

  const PlayerCard = ({ name, rating, timeMs, active, side }: any) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${active && !gameOver ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${side === 'white' ? 'bg-[#F0D9B5] text-[#FFFCF8]' : 'bg-[#B58863] text-[#F0D9B5]'}`}>
        {name?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{name}</div>
        <div className="text-xs text-[var(--text-muted)]">{rating} ELO</div>
      </div>
      <div className={`font-mono text-xl font-bold tabular-nums transition-colors ${timeMs < 30_000 ? 'text-red-400 animate-pulse' : active && !gameOver ? 'text-[var(--amber)]' : 'text-[var(--text-mid)]'}`}>
        {fmt(timeMs)}
      </div>
    </div>
  )

  const allMoves = chess.history()

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Board column */}
        <div className="space-y-2">
          {/* Black player */}
          <PlayerCard
            name={gameState ? (orientation === 'white' ? gameState.blackName : gameState.whiteName) : 'Waiting...'}
            rating={gameState ? (orientation === 'white' ? gameState.blackRating : gameState.whiteRating) : '—'}
            timeMs={orientation === 'white' ? blackTimeMs : whiteTimeMs}
            active={chess.turn() === (orientation === 'white' ? 'b' : 'w')}
            side={orientation === 'white' ? 'black' : 'white'}
          />

          {/* Board */}
          <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${chess.inCheck() && replayIdx === -1 ? 'ring-2 ring-red-400/60 shadow-[0_0_20px_rgba(248,113,113,0.2)]' : ''}`}>
            <Chessboard
              position={displayFen}
              onPieceDrop={handleMove}
              boardOrientation={orientation}
              arePiecesDraggable={isMyTurn && replayIdx === -1 && !gameOver}
              customBoardStyle={{ borderRadius: '16px' }}
              customDarkSquareStyle={{ backgroundColor: '#B58863' }}
              customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
              customDropSquareStyle={{ boxShadow: 'inset 0 0 1px 4px rgba(212,175,55,0.6)' }}
            />
          </div>

          {/* White player */}
          <PlayerCard
            name={gameState ? (orientation === 'white' ? gameState.whiteName : gameState.blackName) : (user?.name || 'You')}
            rating={gameState ? (orientation === 'white' ? gameState.whiteRating : gameState.blackRating) : (user?.rating || 1200)}
            timeMs={orientation === 'white' ? whiteTimeMs : blackTimeMs}
            active={chess.turn() === (orientation === 'white' ? 'w' : 'b')}
            side={orientation === 'white' ? 'white' : 'black'}
          />
        </div>

        {/* Side panel */}
        <div className="space-y-3">

          {/* Connection */}
          <div className="card px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">{gameId ? `Game ${gameId.slice(0, 8)}...` : 'Practice Mode'}</span>
            <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>

          {/* Draw offer */}
          {drawOffer && (
            <div className="card p-4 border-[#D4AF37]/30 bg-[#D4AF37]/5 text-center space-y-2">
              <p className="text-sm font-semibold">Draw offered</p>
              <div className="flex gap-2">
                <button onClick={handleAcceptDraw} className="btn-primary flex-1 text-xs py-2">Accept</button>
                <button onClick={() => setDrawOffer(null)} className="btn-secondary flex-1 text-xs py-2">Decline</button>
              </div>
            </div>
          )}

          {/* Controls */}
          {!gameOver && (
            <div className="card p-3 flex gap-2">
              <button onClick={handleResign} className="btn-danger flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5">
                <Flag size={13} /> Resign
              </button>
              <button onClick={handleDrawOffer} className="btn-secondary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5">
                <Handshake size={13} /> Draw
              </button>
            </div>
          )}

          {/* Move history */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-semibold">Moves</h3>
              <span className="text-xs text-[var(--text-muted)]">{allMoves.length} half-moves</span>
            </div>
            <div ref={moveListRef} className="p-2 h-64 overflow-y-auto">
              {allMoves.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">No moves yet</p>
              ) : (
                <div className="grid grid-cols-[28px_1fr_1fr] gap-x-1 gap-y-0.5 text-sm font-mono">
                  {Array.from({ length: Math.ceil(allMoves.length / 2) }).map((_, i) => (
                    <>
                      <span key={`n${i}`} className="text-[var(--text-muted)] text-xs flex items-center">{i + 1}.</span>
                      <button key={`w${i}`}
                        onClick={() => setReplayIdx(i * 2)}
                        className={`text-left px-2 py-1 rounded text-xs transition-colors ${replayIdx === i * 2 ? 'bg-[#D4AF37]/20 text-[var(--amber)]' : 'hover:bg-[var(--bg-subtle)]'}`}>
                        {allMoves[i * 2]}
                      </button>
                      <button key={`b${i}`}
                        onClick={() => allMoves[i * 2 + 1] && setReplayIdx(i * 2 + 1)}
                        className={`text-left px-2 py-1 rounded text-xs transition-colors ${replayIdx === i * 2 + 1 ? 'bg-[#D4AF37]/20 text-[var(--amber)]' : 'hover:bg-[var(--bg-subtle)]'}`}>
                        {allMoves[i * 2 + 1] || ''}
                      </button>
                    </>
                  ))}
                </div>
              )}
            </div>
            {/* Replay controls */}
            <div className="flex border-t border-[var(--border)]">
              <button onClick={() => setReplayIdx(0)} disabled={allMoves.length === 0}
                className="flex-1 py-2.5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-mid)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30">
                <ChevronLeft size={14} className="mr-[-4px]" /><ChevronLeft size={14} />
              </button>
              <button onClick={() => setReplayIdx(r => Math.max(0, r === -1 ? allMoves.length - 2 : r - 1))} disabled={allMoves.length === 0}
                className="flex-1 py-2.5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-mid)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setReplayIdx(r => { const next = r === -1 ? -1 : r + 1; return next >= allMoves.length ? -1 : next })} disabled={allMoves.length === 0}
                className="flex-1 py-2.5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-mid)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setReplayIdx(-1)}
                className={`flex-1 py-2.5 flex items-center justify-center transition-colors ${replayIdx === -1 ? 'text-[var(--amber)]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)] hover:bg-[var(--bg-hover)]'}`}>
                <ChevronRight size={14} className="mr-[-4px]" /><ChevronRight size={14} />
              </button>
            </div>
            {replayIdx !== -1 && (
              <div className="px-4 py-2 bg-[#D4AF37]/5 border-t border-[#D4AF37]/20 text-xs text-[var(--amber)] text-center">
                Reviewing move {replayIdx + 1} — <button onClick={() => setReplayIdx(-1)} className="underline">Back to live</button>
              </div>
            )}
          </div>

          {/* Game over */}
          {gameOver && (
            <div className="card p-5 text-center border-[#D4AF37]/30 bg-[#D4AF37]/5 animate-fade-in">
              <Trophy className="mx-auto mb-2 text-[var(--amber)]" size={28} />
              <div className="font-display text-xl font-bold text-[var(--amber)]">
                {gameOver.winner ? `${gameOver.winner === 'white' ? gameState?.whiteName || 'White' : gameState?.blackName || 'Black'} wins` : 'Draw'}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 capitalize">by {gameOver.reason?.replace(/_/g, ' ')}</div>
              <button onClick={() => router.push('/student')} className="btn-primary w-full mt-4 text-sm">
                Back to Dashboard
              </button>
            </div>
          )}

          {/* Waiting */}
          {!gameOver && gameState?.status === 'waiting' && (
            <div className="card p-5 text-center animate-fade-in">
              <Loader2 className="mx-auto mb-2 text-[var(--amber)] animate-spin" size={24} />
              <div className="text-sm font-medium">Waiting for opponent...</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Share the game link to invite</div>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
                className="btn-secondary w-full mt-3 text-xs">
                Copy Game Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
