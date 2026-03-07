'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useAuth } from '@/lib/auth-context'
import { useParams, useRouter } from 'next/navigation'
import { classroomsAPI } from '@/lib/api'
import { getSocket } from '@/lib/hooks/useSocket'
import {
  Hand, MessageSquare, Users, Send, ArrowLeft,
  Wifi, WifiOff, Circle, Pencil, Trash2, Save, Play, Square
} from 'lucide-react'
import toast from 'react-hot-toast'

type ChatMsg = { id: number | string; userId: string; userName: string; role: string; message: string; timestamp: string }
type Participant = { userId: string; name: string; role: string; handRaised: boolean }
type Annotation = { type: 'arrow' | 'highlight'; from?: string; to?: string; square?: string; color: string }

export default function ClassroomPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const isCoach = ['coach', 'academy_admin', 'super_admin'].includes(user?.role || '')

  const [chess, setChess] = useState(() => new Chess())
  const [classroom, setClassroom] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatMsg, setChatMsg] = useState('')
  const [handRaised, setHandRaised] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [arrows, setArrows] = useState<[string, string, string?][]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'students'>('chat')
  const [classActive, setClassActive] = useState(false)
  const [savedPgn, setSavedPgn] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  // Fetch classroom info
  useEffect(() => {
    if (!id) return
    classroomsAPI.get(id).then((r: any) => setClassroom(r.data.classroom)).catch(() => {})
  }, [id])

  // Socket setup
  useEffect(() => {
    if (!token || !id) return
    const socket = getSocket(token)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    if (socket.connected) setConnected(true)

    // Board sync (on join)
    socket.on('classroom:board_sync', ({ fen }: any) => {
      try { setChess(new Chess(fen)) } catch {}
    })

    // Board updates from coach
    socket.on('classroom:board_update', ({ fen, move }: any) => {
      try {
        setChess(new Chess(fen))
        if (move) toast(`${move.san}`, { icon: '♟' })
      } catch {}
    })

    // Annotations
    socket.on('classroom:annotation', (ann: Annotation) => {
      setAnnotations(prev => [...prev, ann])
      if (ann.type === 'arrow' && ann.from && ann.to) {
        setArrows(prev => [...prev, [ann.from!, ann.to!, ann.color]])
      }
    })
    socket.on('classroom:clear_annotations', () => {
      setAnnotations([])
      setArrows([])
    })

    // Chat
    socket.on('classroom:chat', (msg: ChatMsg) => {
      setChat(prev => [...prev, msg])
    })

    // Participants
    socket.on('classroom:user_joined', ({ userId, name, count }: any) => {
      setParticipants(prev => {
        if (prev.find(p => p.userId === userId)) return prev
        return [...prev, { userId, name, role: 'student', handRaised: false }]
      })
      toast(`${name} joined`, { icon: '👋', duration: 2000 })
    })
    socket.on('classroom:user_left', ({ userId }: any) => {
      setParticipants(prev => prev.filter(p => p.userId !== userId))
    })
    socket.on('classroom:hand_raised', ({ userId, name }: any) => {
      setParticipants(prev => prev.map(p => p.userId === userId ? { ...p, handRaised: true } : p))
      toast(`${name} raised hand ✋`, { duration: 3000 })
    })
    socket.on('classroom:hand_lowered', ({ userId }: any) => {
      setParticipants(prev => prev.map(p => p.userId === userId ? { ...p, handRaised: false } : p))
    })

    // Join room
    socket.emit('classroom:join', { classroomId: id })

    // Add self to participants
    if (user) {
      setParticipants([{ userId: user.id, name: user.name, role: user.role, handRaised: false }])
    }

    return () => {
      socket.off('classroom:board_sync')
      socket.off('classroom:board_update')
      socket.off('classroom:annotation')
      socket.off('classroom:clear_annotations')
      socket.off('classroom:chat')
      socket.off('classroom:user_joined')
      socket.off('classroom:user_left')
      socket.off('classroom:hand_raised')
      socket.off('classroom:hand_lowered')
    }
  }, [token, id, user])

  // Auto scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat])

  // Coach: move piece → broadcast
  const handleCoachMove = useCallback((from: string, to: string) => {
    if (!isCoach) return false
    const g = new Chess(chess.fen())
    const result = g.move({ from, to, promotion: 'q' })
    if (!result) return false
    setChess(g)
    if (token) {
      getSocket(token).emit('classroom:board_update', {
        classroomId: id,
        fen: g.fen(),
        pgn: g.pgn(),
        move: result,
      })
    }
    return true
  }, [chess, isCoach, id, token])

  // Arrow drawing (coach only) — using customArrows prop
  const handleArrowDraw = useCallback((arrows: [string, string][]) => {
    if (!isCoach) return
    setArrows(arrows as any)
    const lastArrow = arrows[arrows.length - 1]
    if (lastArrow && token) {
      getSocket(token).emit('classroom:annotation', {
        classroomId: id,
        annotation: { type: 'arrow', from: lastArrow[0], to: lastArrow[1], color: 'var(--amber)' },
      })
    }
  }, [isCoach, id, token])

  const clearAnnotations = () => {
    setArrows([])
    setAnnotations([])
    if (token) getSocket(token).emit('classroom:clear_annotations', { classroomId: id })
  }

  const sendChat = () => {
    if (!chatMsg.trim() || !token) return
    getSocket(token).emit('classroom:chat', { classroomId: id, message: chatMsg })
    setChatMsg('')
  }

  const toggleHand = () => {
    if (!token) return
    if (handRaised) {
      getSocket(token).emit('classroom:lower_hand', { classroomId: id })
    } else {
      getSocket(token).emit('classroom:raise_hand', { classroomId: id })
    }
    setHandRaised(!handRaised)
  }

  const startClass = async () => {
    try {
      await classroomsAPI.start(id)
      setClassActive(true)
      toast.success('Class started!')
    } catch { toast.error('Failed to start class') }
  }

  const endClass = async () => {
    if (!confirm('End this class?')) return
    try {
      await classroomsAPI.end(id)
      setClassActive(false)
      toast.success('Class ended')
    } catch { toast.error('Failed to end class') }
  }

  const savePgn = async () => {
    const pgn = chess.pgn()
    if (!pgn) return toast.error('No moves to save')
    try {
      await classroomsAPI.savePgn(id, pgn)
      setSavedPgn(pgn)
      toast.success('Lesson saved as PGN!')
    } catch { toast.error('Failed to save PGN') }
  }

  const resetBoard = () => {
    const g = new Chess()
    setChess(g)
    setArrows([])
    if (token) {
      getSocket(token).emit('classroom:board_update', { classroomId: id, fen: g.fen(), pgn: '', move: null })
    }
  }

  const handsUp = participants.filter(p => p.handRaised)

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="font-display font-bold text-base">{classroom?.title || 'Chess Classroom'}</h1>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>{classroom?.coach_name || 'Coach'}</span>
              <span>·</span>
              <div className={`flex items-center gap-1 ${connected ? 'text-green-400' : 'text-red-400'}`}>
                {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
                {connected ? 'Live' : 'Reconnecting...'}
              </div>
              <span>·</span>
              <span>{participants.length} online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCoach ? (
            <>
              <button onClick={clearAnnotations} className="btn-ghost text-xs flex items-center gap-1.5 py-2 px-3">
                <Trash2 size={13} />Clear
              </button>
              <button onClick={savePgn} className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3">
                <Save size={13} />Save PGN
              </button>
              <button onClick={resetBoard} className="btn-secondary text-xs py-2 px-3">Reset Board</button>
              {!classActive
                ? <button onClick={startClass} className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3"><Play size={13} />Start Class</button>
                : <button onClick={endClass} className="btn-danger text-xs flex items-center gap-1.5 py-2 px-3"><Square size={13} />End Class</button>
              }
            </>
          ) : (
            <button onClick={toggleHand}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${handRaised ? 'bg-[#D4AF37] text-[var(--bg)]' : 'btn-secondary'}`}>
              <Hand size={15} />{handRaised ? 'Lower Hand' : 'Raise Hand'}
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Board */}
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-[600px]">
            {/* Coach controls */}
            {isCoach && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[var(--text-muted)]">
                  <Pencil size={11} className="inline mr-1" />Draw arrows by right-click drag on the board
                </span>
                {handsUp.length > 0 && (
                  <div className="ml-auto flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-3 py-1 text-xs text-[var(--amber)]">
                    ✋ {handsUp.length} hand{handsUp.length > 1 ? 's' : ''} raised
                  </div>
                )}
              </div>
            )}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <Chessboard
                position={chess.fen()}
                onPieceDrop={isCoach ? handleCoachMove : () => false}
                arePiecesDraggable={isCoach}
                customArrows={arrows}
                onArrowsChange={isCoach ? handleArrowDraw as any : undefined}
                boardOrientation="white"
                customBoardStyle={{ borderRadius: '16px' }}
                customDarkSquareStyle={{ backgroundColor: '#B58863' }}
                customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
                customDropSquareStyle={{ boxShadow: 'inset 0 0 1px 4px rgba(212,175,55,0.6)' }}
              />
            </div>
            {/* Move history strip */}
            {chess.history().length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {chess.history().map((move, i) => (
                  <span key={i} className="text-xs font-mono bg-[var(--bg-subtle)] px-2 py-1 rounded text-[var(--text-mid)]">
                    {i % 2 === 0 && <span className="text-[var(--text-muted)] mr-1">{Math.floor(i / 2) + 1}.</span>}{move}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-[var(--border)] flex flex-col bg-[var(--bg)]">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {([['chat', 'Chat', MessageSquare], ['students', 'Students', Users]] as any[]).map(([tab, label, Icon]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${activeTab === tab ? 'text-[var(--amber)] border-b-2 border-[#D4AF37]' : 'text-[var(--text-muted)] hover:text-[var(--text-mid)]'}`}>
                <Icon size={14} />{label}
                {tab === 'students' && handsUp.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-[var(--bg)] text-[10px] flex items-center justify-center font-bold">{handsUp.length}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'chat' ? (
            <>
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chat.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center pt-8">No messages yet</p>
                ) : chat.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                      ${msg.role === 'coach' || msg.role === 'academy_admin' ? 'bg-[#D4AF37]/20 text-[var(--amber)]' : 'bg-white/[0.08] text-[var(--text-mid)]'}`}>
                      {msg.userName?.[0]}
                    </div>
                    <div className={`max-w-[75%] ${msg.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      <span className="text-[10px] text-[var(--text-muted)]">{msg.userName}</span>
                      <div className={`px-3 py-2 rounded-xl text-sm ${msg.userId === user?.id ? 'bg-[#D4AF37]/20 text-[var(--text)]' : 'bg-[var(--bg-subtle)] text-[var(--text)]'}`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-[var(--border)] flex gap-2">
                <input
                  className="input flex-1 text-sm py-2"
                  placeholder="Send a message..."
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                />
                <button onClick={sendChat} className="btn-primary p-2.5">
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {participants.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center pt-8">No participants yet</p>
              ) : participants.map(p => (
                <div key={p.userId} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${p.role === 'coach' || p.role === 'academy_admin' ? 'bg-[#D4AF37]/20 text-[var(--amber)]' : 'bg-white/[0.08] text-[var(--text-mid)]'}`}>
                    {p.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-[var(--text-muted)] capitalize">{p.role?.replace('_', ' ')}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.handRaised && <span title="Hand raised">✋</span>}
                    <Circle size={8} className="text-green-400 fill-green-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
