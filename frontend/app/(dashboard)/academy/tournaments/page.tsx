'use client'
// tournaments page
import { useState } from 'react'
import { Trophy, Plus, Users, Clock, Calendar } from 'lucide-react'

const TOURNAMENTS = [
  { id: 1, name: 'Summer Open 2024', format: 'Swiss', status: 'live', players: 48, maxPlayers: 64, rounds: 7, currentRound: 3, timeControl: '10+5', starts: 'In progress' },
  { id: 2, name: 'Beginner Cup', format: 'Round Robin', status: 'upcoming', players: 12, maxPlayers: 16, rounds: 5, currentRound: 0, timeControl: '15+10', starts: 'Jul 20, 10:00 AM' },
  { id: 3, name: 'Blitz Championship', format: 'Arena', status: 'upcoming', players: 32, maxPlayers: 100, rounds: 0, currentRound: 0, timeControl: '3+2', starts: 'Jul 22, 6:00 PM' },
  { id: 4, name: 'Inter-Academy Cup', format: 'Knockout', status: 'completed', players: 32, maxPlayers: 32, rounds: 5, currentRound: 5, timeControl: '10+0', starts: 'Completed' },
]
const STANDINGS = [
  { rank: 1, name: 'Rohit Verma', rating: 1540, points: 2.5, tb: 8.25 },
  { rank: 2, name: 'Kiran Kumar', rating: 1420, points: 2.0, tb: 7.50 },
  { rank: 3, name: 'Arjun Sharma', rating: 1210, points: 2.0, tb: 6.75 },
  { rank: 4, name: 'Priya Nair', rating: 980, points: 1.5, tb: 5.50 },
  { rank: 5, name: 'Meera Patel', rating: 750, points: 0.5, tb: 4.00 },
]

const STATUS_STYLE: any = {
  live:      'badge-red',
  upcoming:  'badge-gold',
  completed: 'badge-gray',
}

export default function TournamentsPage() {
  const [selected, setSelected] = useState<number | null>(1)
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Trophy size={22} className="text-[#D4AF37]" />Tournaments</h1>
        <button className="btn-primary text-sm"><Plus size={15} />Create Tournament</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOURNAMENTS.map(t => (
          <button key={t.id} onClick={() => setSelected(t.id)}
            className={`card p-4 text-left transition-all ${selected === t.id ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5' : 'card-hover'}`}>
            <div className="flex items-start justify-between mb-3">
              <span className={`badge text-xs ${STATUS_STYLE[t.status]}`}>{t.status}</span>
              <span className="badge-gray text-xs">{t.format}</span>
            </div>
            <div className="font-semibold text-sm mb-2 line-clamp-2">{t.name}</div>
            <div className="flex items-center gap-3 text-xs text-[#6B6050]">
              <span className="flex items-center gap-1"><Users size={11} />{t.players}/{t.maxPlayers}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{t.timeControl}</span>
            </div>
            {t.status === 'live' && (
              <div className="mt-2">
                <div className="text-xs text-[#6B6050] mb-1">Round {t.currentRound}/{t.rounds}</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${(t.currentRound/t.rounds)*100}%` }} /></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <h3 className="section-title">Live Standings — {TOURNAMENTS.find(t => t.id === selected)?.name}</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="th text-center w-16">Rank</th>
                <th className="th">Player</th>
                <th className="th text-center">Rating</th>
                <th className="th text-center">Points</th>
                <th className="th text-center">Buchholz</th>
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map(s => (
                <tr key={s.rank} className="tr">
                  <td className="td text-center">
                    <span className={`font-bold ${s.rank === 1 ? 'text-[#D4AF37]' : s.rank === 2 ? 'text-[#C0C0C0]' : s.rank === 3 ? 'text-[#CD7F32]' : 'text-[#6B6050]'}`}>
                      {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-xs font-bold text-[#D4AF37]">{s.name[0]}</div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="td text-center font-mono">{s.rating}</td>
                  <td className="td text-center font-bold text-[#D4AF37]">{s.points}</td>
                  <td className="td text-center text-[#A09880]">{s.tb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
