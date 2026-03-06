'use client'

import { useState, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useAuth } from '@/lib/auth-context'
import {
  Hand, MessageSquare, Mic, MicOff, Video, VideoOff,
  Users, ChevronLeft, Send, X, ArrowRight, Circle
} from 'lucide-react'

interface ChatMsg { id: number; name: string; role: string; text: string; time: string }

const INIT_STUDENTS = [
  { id: '1', name: 'Arjun Sharma',  online: true,  hand: false },
  { id: '2', name: 'Priya Nair',    online: true,  hand: true  },
  { id: '3', name: 'Rohit Verma',   online: false, hand: false },
  { id: '4', name: 'Meera Patel',   online: true,  hand: false },
]
const INIT_CHAT: ChatMsg[] = [
  { id: 1, name: 'Coach Vikram', role: 'coach', text: 'Welcome everyone! Today we\'ll study the Sicilian Defense.', time: '10:00' },
  { id: 2, name: 'Arjun',        role: 'student', text: 'Excited for this!', time: '10:01' },
]

export default function ClassroomPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const isCoach = user?.role === 'coach' || user?.role === 'academy_admin'
  const [game, setGame] = useState(() => new Chess())
  const [chat, setChat] = useState<ChatMsg[]>(INIT_CHAT)
  const [msg, setMsg]   = useState('')
  const [muted, setMuted]   = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [showChat, setShowChat]   = useState(true)
  const [showStudents, setShowStudents] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat])

  const handleMove = (sourceSquare: string, targetSquare: string) => {
    if (!isCoach) return false
    const g = new Chess(game.fen())
    const result = g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    if (!result) return false
    setGame(g)
    return true
  }

  const sendMsg = () => {
    if (!msg.trim()) return
    setChat(prev => [...prev, {
      id: Date.now(),
      name: user?.name || 'You',
      role: user?.role || 'student',
      text: msg.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }])
    setMsg('')
  }

  return (
    <div className="h-screen bg-[#0F0E0B] flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="h-14 bg-[#141210] border-b border-white/[0.07] px-4 flex items-center gap-4 flex-shrink-0">
        <button className="btn-icon"><ChevronLeft size={18} /></button>
        <div>
          <div className="font-semibold text-sm">Sicilian Defense Workshop</div>
          <div className="text-xs text-[#6B6050]">Live · {INIT_STUDENTS.filter(s => s.online).length} students online</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <span className="text-xs text-red-400 font-medium">LIVE</span>
          <button onClick={() => setMuted(!muted)} className={`btn-icon ${muted ? 'text-red-400' : ''}`}>
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={() => setCamOff(!camOff)} className={`btn-icon ${camOff ? 'text-red-400' : ''}`}>
            {camOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`btn-icon ${showChat ? 'text-[#D4AF37]' : ''}`}>
            <MessageSquare size={18} />
          </button>
          <button onClick={() => setShowStudents(!showStudents)} className={`btn-icon ${showStudents ? 'text-[#D4AF37]' : ''}`}>
            <Users size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Board */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div className="max-w-2xl w-full">
            <Chessboard
              position={game.fen()}
              onPieceDrop={handleMove}
              arePiecesDraggable={isCoach}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              customDarkSquareStyle={{ backgroundColor: '#B58863' }}
              customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
            />
            {!isCoach && (
              <p className="text-center text-xs text-[#6B6050] mt-3">Watch mode — only the coach can move pieces</p>
            )}
          </div>
        </div>

        {/* Students panel */}
        {showStudents && (
          <div className="w-52 bg-[#141210] border-l border-white/[0.07] flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <h3 className="text-xs font-semibold text-[#6B6050] uppercase tracking-wider">Students</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {INIT_STUDENTS.map(s => (
                <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04]">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.online ? 'bg-green-400' : 'bg-[#6B6050]'}`} />
                  <span className="text-sm flex-1 truncate">{s.name}</span>
                  {s.hand && <Hand size={13} className="text-[#D4AF37]" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat panel */}
        {showChat && (
          <div className="w-72 bg-[#141210] border-l border-white/[0.07] flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <h3 className="text-xs font-semibold text-[#6B6050] uppercase tracking-wider">Class Chat</h3>
            </div>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {chat.map(m => (
                <div key={m.id} className={`flex flex-col ${m.name === (user?.name || '') ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-xs font-medium ${m.role === 'coach' || m.role === 'academy_admin' ? 'text-[#D4AF37]' : 'text-[#A09880]'}`}>{m.name}</span>
                    <span className="text-[10px] text-[#6B6050]">{m.time}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                    m.name === (user?.name || '') ? 'bg-[#D4AF37]/15 text-[#F5F0E8]' : 'bg-white/[0.06] text-[#F5F0E8]'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/[0.07]">
              <div className="flex gap-2">
                <input
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Type a message..."
                  className="input flex-1 h-9 text-sm"
                />
                <button onClick={sendMsg} className="btn-primary px-3 h-9">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
