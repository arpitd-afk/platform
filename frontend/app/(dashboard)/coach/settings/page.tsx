'use client'
import { useState } from 'react'
import { Settings, Save, Bell, Shield, User } from 'lucide-react'
export default function CoachSettingsPage() {
  const [name, setName] = useState('Coach Vikram')
  const [bio, setBio] = useState('FIDE rated coach specialising in tactics and middlegame strategy. 8+ years of coaching experience.')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSms, setNotifSms]     = useState(true)
  const Toggle = ({v,set}:{v:boolean,set:(b:boolean)=>void}) => (
    <button onClick={()=>set(!v)} className={`w-11 h-6 rounded-full transition-all relative ${v?'bg-[#D4AF37]':'bg-white/[0.10]'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${v?'left-6':'left-1'}`}/>
    </button>
  )
  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <h1 className="page-title flex items-center gap-2"><Settings size={22} className="text-[#A09880]"/>Settings</h1>
      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><User size={16} className="text-[#4ADE80]"/>Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#4ADE80]/20 flex items-center justify-center text-2xl font-bold text-[#4ADE80]">V</div>
          <button className="btn-secondary text-sm">Change Photo</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><label className="label">Email</label><input className="input" defaultValue="coach@demo.com"/></div>
          <div><label className="label">Phone</label><input className="input" defaultValue="+91 98765 43210"/></div>
          <div><label className="label">FIDE Rating</label><input className="input" defaultValue="2150"/></div>
        </div>
        <div><label className="label">Bio</label><textarea className="input h-24 resize-none" value={bio} onChange={e=>setBio(e.target.value)}/></div>
        <div><label className="label">Specialization</label><input className="input" defaultValue="Tactics & Middlegame Strategy"/></div>
        <button className="btn-primary flex items-center gap-2"><Save size={15}/>Save Profile</button>
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2"><Bell size={16} className="text-[#D4AF37]"/>Notifications</h3>
        {[
          {l:'Email reminders before class',v:notifEmail,set:setNotifEmail},
          {l:'SMS alerts for student absences',v:notifSms,set:setNotifSms},
        ].map((item,i)=>(
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
            <span className="text-sm text-[#A09880]">{item.l}</span>
            <Toggle v={item.v} set={item.set}/>
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2"><Shield size={16} className="text-[#60A5FA]"/>Security</h3>
        <button className="btn-secondary text-sm">Change Password</button>
      </div>
    </div>
  )
}
