'use client'
import { useState } from 'react'
import { Settings, Save, Bell, Shield, Globe, Server } from 'lucide-react'
export default function SuperAdminSettingsPage() {
  const [m1,sm1]=useState(true),[m2,sm2]=useState(true),[m3,sm3]=useState(false)
  const Toggle=({v,set}:{v:boolean,set:(b:boolean)=>void})=>(
    <button onClick={()=>set(!v)} className={`w-11 h-6 rounded-full transition-all relative ${v?'bg-[#D4AF37]':'bg-white/[0.10]'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${v?'left-6':'left-1'}`}/></button>
  )
  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <h1 className="page-title flex items-center gap-2"><Settings size={22} className="text-[#A09880]"/>Platform Settings</h1>
      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><Globe size={16} className="text-[#60A5FA]"/>Platform Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Platform Name</label><input className="input" defaultValue="ChessAcademy Pro"/></div>
          <div><label className="label">Support Email</label><input className="input" defaultValue="support@chessacademy.pro"/></div>
          <div><label className="label">Primary Domain</label><input className="input" defaultValue="chessacademy.pro"/></div>
          <div><label className="label">Default Currency</label><select className="input"><option>INR (₹)</option><option>USD ($)</option></select></div>
        </div>
        <button className="btn-primary flex items-center gap-2"><Save size={15}/>Save Changes</button>
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2"><Bell size={16} className="text-[#D4AF37]"/>Alerts</h3>
        {[{l:'Email when new academy registers',v:m1,set:sm1},{l:'Alert on payment failures',v:m2,set:sm2},{l:'Daily usage digest',v:m3,set:sm3}].map((item,i)=>(
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
            <span className="text-sm text-[#A09880]">{item.l}</span>
            <Toggle v={item.v} set={item.set}/>
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2"><Server size={16} className="text-[#4ADE80]"/>System Status</h3>
        {[{s:'Database',v:'Healthy',c:'#4ADE80'},{s:'Redis Cache',v:'Healthy',c:'#4ADE80'},{s:'WebSocket Server',v:'Healthy',c:'#4ADE80'},{s:'Storage (S3)',v:'Healthy',c:'#4ADE80'}].map(s=>(
          <div key={s.s} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-[#A09880]">{s.s}</span>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/><span className="text-xs" style={{color:s.c}}>{s.v}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}
