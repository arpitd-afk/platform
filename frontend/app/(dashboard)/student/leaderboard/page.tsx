'use client'
import { Award, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const LEADERBOARD = [
  { rank:1,  prev:1,  name:'Sia Kapoor',    rating:1680, wins:42, streak:8,  academy:'Demo Chess Academy', you:false },
  { rank:2,  prev:3,  name:'Rohit Verma',   rating:1540, wins:38, streak:5,  academy:'Demo Chess Academy', you:false },
  { rank:3,  prev:2,  name:'Dev Sharma',    rating:1490, wins:35, streak:3,  academy:'Demo Chess Academy', you:false },
  { rank:4,  prev:5,  name:'Kiran Kumar',   rating:1120, wins:24, streak:2,  academy:'Demo Chess Academy', you:false },
  { rank:5,  prev:4,  name:'Aanya Singh',   rating:990,  wins:20, streak:4,  academy:'Demo Chess Academy', you:false },
  { rank:6,  prev:7,  name:'Arjun Sharma',  rating:1210, wins:22, streak:12, academy:'Demo Chess Academy', you:true  },
  { rank:7,  prev:6,  name:'Priya Nair',    rating:780,  wins:14, streak:1,  academy:'Demo Chess Academy', you:false },
  { rank:8,  prev:8,  name:'Meera Patel',   rating:650,  wins:8,  streak:0,  academy:'Demo Chess Academy', you:false },
]

export default function LeaderboardPage() {
  const me = LEADERBOARD.find(p=>p.you)
  const RankBadge = ({rank}:{rank:number}) => rank===1?<span className="text-2xl">🥇</span>:rank===2?<span className="text-2xl">🥈</span>:rank===3?<span className="text-2xl">🥉</span>:<span className="font-bold text-[#6B6050]">#{rank}</span>
  const ChangeIcon = ({curr,prev}:{curr:number,prev:number}) => curr<prev?<TrendingUp size={13} className="text-green-400"/>:curr>prev?<TrendingDown size={13} className="text-red-400"/>:<Minus size={13} className="text-[#6B6050]"/>

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><Award size={22} className="text-[#D4AF37]"/>Leaderboard</h1>
        <p className="text-[#6B6050] text-sm mt-1">Academy rankings — July 2024</p>
      </div>
      {me && (
        <div className="card p-5 border-[#D4AF37]/40 bg-[#D4AF37]/5">
          <div className="text-xs text-[#D4AF37] font-semibold mb-2">YOUR RANKING</div>
          <div className="flex items-center gap-4">
            <div className="font-display text-4xl font-bold text-[#D4AF37]">#{me.rank}</div>
            <div>
              <div className="font-semibold">{me.name}</div>
              <div className="text-sm text-[#A09880]">Rating: {me.rating} · {me.wins} wins · 🔥 {me.streak} streak</div>
            </div>
          </div>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <h3 className="section-title">Full Rankings</h3>
          <span className="badge-gray text-xs">{LEADERBOARD.length} students</span>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.07]"><th className="th w-20 text-center">Rank</th><th className="th">Student</th><th className="th text-center">Rating</th><th className="th text-center">Wins</th><th className="th text-center">Streak</th><th className="th text-center">Change</th></tr></thead>
          <tbody>
            {LEADERBOARD.map(p=>(
              <tr key={p.rank} className={`tr ${p.you?'bg-[#D4AF37]/5':''}`}>
                <td className="td text-center w-16"><RankBadge rank={p.rank}/></td>
                <td className="td">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${p.you?'bg-[#D4AF37]/20 text-[#D4AF37]':'bg-white/[0.07] text-[#A09880]'}`}>{p.name[0]}</div>
                    <div>
                      <span className={`font-medium text-sm ${p.you?'text-[#D4AF37]':''}`}>{p.name} {p.you&&<span className="text-xs ml-1 badge-gold">You</span>}</span>
                    </div>
                  </div>
                </td>
                <td className="td text-center font-mono font-bold">{p.rating}</td>
                <td className="td text-center">{p.wins}</td>
                <td className="td text-center">{p.streak>0?<span className="text-orange-400">🔥 {p.streak}</span>:<span className="text-[#6B6050]">—</span>}</td>
                <td className="td text-center"><ChangeIcon curr={p.rank} prev={p.prev}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
