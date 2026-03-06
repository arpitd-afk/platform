'use client'
import { Trophy, Users, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react'

const TOURNAMENTS = [
  { id:'1', name:'Summer Open 2024',   format:'Swiss', status:'live',      players:48, myRank:5, myPoints:2.5, rounds:7, currentRound:3, timeControl:'10+5', registered:true  },
  { id:'2', name:'Beginner Cup',        format:'Round Robin', status:'upcoming', players:12, myRank:null, myPoints:null, rounds:5, currentRound:0, timeControl:'15+10', registered:true },
  { id:'3', name:'Blitz Championship',  format:'Arena', status:'upcoming',  players:32, myRank:null, myPoints:null, rounds:0, currentRound:0, timeControl:'3+2', registered:false },
  { id:'4', name:'Inter-Academy Cup',   format:'Knockout', status:'completed', players:32, myRank:3, myPoints:4, rounds:5, currentRound:5, timeControl:'10+0', registered:true },
]
const S:any={live:'badge-red',upcoming:'badge-gold',completed:'badge-gray'}

export default function StudentTournamentsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><Trophy size={22} className="text-[#D4AF37]"/>Tournaments</h1>
        <p className="text-[#6B6050] text-sm mt-1">Compete and track your rankings</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          {l:'Registered',v:TOURNAMENTS.filter(t=>t.registered).length,c:'#D4AF37'},
          {l:'Best Finish',v:'3rd 🥉',c:'#CD7F32'},
          {l:'Total Played',v:TOURNAMENTS.filter(t=>t.status==='completed'&&t.registered).length,c:'#60A5FA'},
        ].map(s=>(
          <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs text-[#6B6050]">{s.l}</div></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {TOURNAMENTS.map(t => (
          <div key={t.id} className={`card p-5 ${t.status==='live'?'border-red-400/30':''}`}>
            <div className="flex items-start justify-between mb-3">
              <span className={`badge text-xs ${S[t.status]}`}>{t.status==='live'?<><span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block animate-pulse mr-1"/>LIVE</>:t.status}</span>
              <span className="badge-gray text-xs">{t.format}</span>
            </div>
            <h3 className="font-semibold mb-2">{t.name}</h3>
            <div className="flex items-center gap-3 text-xs text-[#6B6050] mb-3">
              <span className="flex items-center gap-1"><Users size={11}/>{t.players} players</span>
              <span className="flex items-center gap-1"><Clock size={11}/>{t.timeControl}</span>
              {t.rounds>0 && <span>R{t.currentRound}/{t.rounds}</span>}
            </div>
            {t.myRank && (
              <div className="flex items-center gap-3 mb-3 p-3 bg-white/[0.04] rounded-xl">
                <div className="text-center"><div className="font-display text-xl font-bold text-[#D4AF37]">#{t.myRank}</div><div className="text-[10px] text-[#6B6050]">Rank</div></div>
                <div className="text-center"><div className="font-bold text-[#D4AF37]">{t.myPoints}</div><div className="text-[10px] text-[#6B6050]">Points</div></div>
              </div>
            )}
            {t.registered
              ? <div className="flex items-center gap-2 text-xs text-green-400"><CheckCircle2 size={13}/>Registered</div>
              : <button className="btn-primary text-sm w-full mt-1">Register Now</button>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
