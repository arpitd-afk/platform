'use client'
import { useState } from 'react'
import { Settings, Save, Globe, Bell, Shield, Palette } from 'lucide-react'
export default function AcademySettingsPage() {
  const [name, setName] = useState('Demo Chess Academy')
  const [email, setEmail] = useState('contact@demo-academy.com')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [emailNotif, setEmailNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(false)
  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <h1 className="page-title flex items-center gap-2"><Settings size={22} className="text-[#A09880]"/>Academy Settings</h1>
      <div className="card p-6 space-y-5">
        <h3 className="section-title flex items-center gap-2"><Globe size={16} className="text-[#60A5FA]"/>General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Academy Name</label><input className="input" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><label className="label">Contact Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div><label className="label">Phone</label><input className="input" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
          <div><label className="label">Subdomain</label><div className="flex items-center"><input className="input rounded-r-none border-r-0" defaultValue="demo-academy"/><span className="input rounded-l-none border-l-0 text-[#6B6050] whitespace-nowrap text-xs">.chessacademy.pro</span></div></div>
        </div>
        <div><label className="label">Bio / Description</label><textarea className="input h-24 resize-none" defaultValue="Premier chess academy focused on holistic development of chess skills."/></div>
        <button className="btn-primary flex items-center gap-2"><Save size={15}/>Save Changes</button>
      </div>
      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><Bell size={16} className="text-[#D4AF37]"/>Notifications</h3>
        {[{l:'Email notifications for new enrollments',v:emailNotif,set:setEmailNotif},{l:'SMS alerts for missed classes',v:smsNotif,set:setSmsNotif}].map((item,i)=>(
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
            <span className="text-sm text-[#A09880]">{item.l}</span>
            <button onClick={()=>item.set(!item.v)} className={`w-11 h-6 rounded-full transition-all relative ${item.v?'bg-[#D4AF37]':'bg-white/[0.10]'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.v?'left-6':'left-1'}`}/>
            </button>
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2"><Shield size={16} className="text-[#4ADE80]"/>Security</h3>
        <button className="btn-secondary text-sm">Change Password</button>
        <div className="text-xs text-[#6B6050]">Last password change: 3 months ago</div>
      </div>
    </div>
  )
}
