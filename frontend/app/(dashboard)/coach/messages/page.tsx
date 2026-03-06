'use client'
import { useState } from 'react'
import { MessageSquare, Send, Search } from 'lucide-react'

const CONTACTS = [
  { id:'1', name:'Arjun Sharma',   role:'student', lastMsg:'Thanks coach!', time:'2m', unread:0, avatar:'A' },
  { id:'2', name:'Priya Nair',     role:'student', lastMsg:'When is the next class?', time:'1h', unread:2, avatar:'P' },
  { id:'3', name:'Rohit Verma',    role:'student', lastMsg:'I solved all puzzles', time:'3h', unread:0, avatar:'R' },
  { id:'4', name:'Vikram Academy', role:'admin',   lastMsg:'Upcoming schedule update', time:'1d', unread:1, avatar:'V' },
  { id:'5', name:'Meera Patel',    role:'student', lastMsg:'I missed class today', time:'1d', unread:0, avatar:'M' },
]
const MESSAGES:any = {
  '2': [
    { id:1, from:'Priya Nair', me:false, text:'Hi coach, when is the next class?', time:'10:30 AM' },
    { id:2, from:'me', me:true, text:'Tomorrow at 2 PM, same link as usual!', time:'10:32 AM' },
    { id:3, from:'Priya Nair', me:false, text:'When is the next class?', time:'11:15 AM' },
  ],
  '1': [
    { id:1, from:'me', me:true, text:'Great work on today\'s puzzles Arjun!', time:'9:00 AM' },
    { id:2, from:'Arjun Sharma', me:false, text:'Thanks coach!', time:'9:05 AM' },
  ]
}

export default function CoachMessagesPage() {
  const [active, setActive] = useState('2')
  const [msg, setMsg] = useState('')
  const contact = CONTACTS.find(c => c.id === active)
  const messages = MESSAGES[active] || []

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] flex gap-4">
      {/* Contacts */}
      <div className="w-72 card flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-white/[0.07]">
          <h2 className="section-title mb-3">Messages</h2>
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050]"/><input placeholder="Search..." className="input pl-9 h-9 text-sm"/></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] ${active===c.id?'bg-white/[0.05]':''}`}>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center font-bold text-[#D4AF37] flex-shrink-0">{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><span className="font-medium text-sm">{c.name}</span><span className="text-[10px] text-[#6B6050]">{c.time}</span></div>
                <div className="text-xs text-[#6B6050] truncate mt-0.5">{c.lastMsg}</div>
              </div>
              {c.unread > 0 && <span className="w-5 h-5 bg-[#D4AF37] text-[#0F0E0B] text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>
      {/* Chat */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
          <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 flex items-center justify-center font-bold text-[#D4AF37]">{contact?.avatar}</div>
          <div><div className="font-semibold text-sm">{contact?.name}</div><div className="text-xs text-[#6B6050] capitalize">{contact?.role}</div></div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((m:any) => (
            <div key={m.id} className={`flex ${m.me?'justify-end':'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${m.me?'bg-[#D4AF37]/20 text-[#F5F0E8]':'bg-white/[0.07] text-[#F5F0E8]'}`}>
                <p>{m.text}</p>
                <p className="text-[10px] text-[#6B6050] mt-1 text-right">{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/[0.07] flex gap-2">
          <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setMsg('')} placeholder="Type a message..." className="input flex-1 h-10"/>
          <button className="btn-primary px-4 h-10"><Send size={15}/></button>
        </div>
      </div>
    </div>
  )
}
