'use client'
import { useState } from 'react'
import { Settings, Save, Bell, Shield, User } from 'lucide-react'
export default function ParentSettingsPage() {
  const [n1,sn1]=useState(true),[n2,sn2]=useState(true),[n3,sn3]=useState(false)
  const Toggle=({v,set}:{v:boolean,set:(b:boolean)=>void})=>(
    <button onClick={()=>set(!v)} className={`w-11 h-6 rounded-full transition-all relative ${v?'bg-[#D4AF37]':'bg-white/[0.10]'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${v?'left-6':'left-1'}`}/></button>
  )
  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <h1 className="page-title flex items-center gap-2"><Settings size={22} className="text-[#A09880]"/>Settings</h1>
      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><User size={16} className="text-[#A78BFA]"/>Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" defaultValue="Parent User"/></div>
          <div><label className="label">Email</label><input className="input" defaultValue="parent@demo.com"/></div>
          <div><label className="label">Phone</label><input className="input" defaultValue="+91 98765 43210"/></div>
          <div><label className="label">City</label><input className="input" defaultValue="Mumbai"/></div>
        </div>
        <button className="btn-primary flex items-center gap-2"><Save size={15}/>Save</button>
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2"><Bell size={16} className="text-[#D4AF37]"/>Notifications</h3>
        {[
          {l:'Email class reminders 1 hour before',v:n1,set:sn1},
          {l:'SMS alerts when child misses class',v:n2,set:sn2},
          {l:'Weekly progress report email',v:n3,set:sn3},
        ].map((item,i)=>(
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
            <span className="text-sm text-[#A09880]">{item.l}</span>
            <Toggle v={item.v} set={item.set}/>
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2"><Shield size={16} className="text-[#4ADE80]"/>Security</h3>
        <button className="btn-secondary text-sm">Change Password</button>
      </div>
    </div>
  )
}
