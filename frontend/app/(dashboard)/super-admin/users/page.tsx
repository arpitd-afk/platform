'use client'
import { useState } from 'react'
import { Users, Search, Shield, UserCheck, GraduationCap, User, Users2 } from 'lucide-react'
const USERS = [
  {id:'1',name:'Rahul Sharma',email:'rahul@elite.com',role:'academy_admin',academy:'Elite Chess Mumbai',joined:'Jan 15',active:true},
  {id:'2',name:'Vikram Nair',email:'vikram@elite.com',role:'coach',academy:'Elite Chess Mumbai',joined:'Jan 20',active:true},
  {id:'3',name:'Arjun Student',email:'arjun@example.com',role:'student',academy:'Elite Chess Mumbai',joined:'Feb 1',active:true},
  {id:'4',name:'Priya Patel',email:'priya@delhi.com',role:'academy_admin',academy:'Delhi Chess Academy',joined:'Feb 10',active:true},
  {id:'5',name:'Coach Kumar',email:'kumar@delhi.com',role:'coach',academy:'Delhi Chess Academy',joined:'Feb 15',active:true},
  {id:'6',name:'Dev Parent',email:'dev@example.com',role:'parent',academy:'Elite Chess Mumbai',joined:'Mar 5',active:false},
]
const ROLE_ICON:any={academy_admin:Shield,coach:UserCheck,student:GraduationCap,parent:Users2,super_admin:Shield}
const ROLE_COLOR:any={academy_admin:'#D4AF37',coach:'#4ADE80',student:'#60A5FA',parent:'#F472B6',super_admin:'#A78BFA'}
export default function SuperAdminUsersPage() {
  const [search,setSearch]=useState('')
  const [role,setRole]=useState('all')
  const filtered=USERS.filter(u=>(u.name.toLowerCase().includes(search.toLowerCase())||u.email.includes(search))&&(role==='all'||u.role===role))
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Users size={22} className="text-[#A78BFA]"/>All Users</h1>
      <div className="grid grid-cols-5 gap-3">
        {['academy_admin','coach','student','parent','super_admin'].map(r=>{
          const count=USERS.filter(u=>u.role===r).length
          const Icon=ROLE_ICON[r]
          return (
            <div key={r} className="stat-card cursor-pointer" onClick={()=>setRole(r)}>
              <Icon size={16} style={{color:ROLE_COLOR[r]}} className="mb-2"/>
              <div className="font-display text-xl font-bold" style={{color:ROLE_COLOR[r]}}>{count}</div>
              <div className="text-[10px] text-[#6B6050] capitalize">{r.replace('_',' ')}</div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..." className="input pl-9"/></div>
        <div className="flex items-center gap-1 card p-1 rounded-xl">
          {['all','academy_admin','coach','student','parent'].map(r=>(
            <button key={r} onClick={()=>setRole(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${role===r?'bg-[#A78BFA]/15 text-[#A78BFA]':'text-[#6B6050] hover:text-[#A09880]'}`}>{r.replace('_',' ')}</button>
          ))}
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.07]"><th className="th">User</th><th className="th">Role</th><th className="th">Academy</th><th className="th">Joined</th><th className="th text-center">Status</th></tr></thead>
          <tbody>
            {filtered.map(u=>{
              const Icon=ROLE_ICON[u.role]||User
              return (
                <tr key={u.id} className="tr">
                  <td className="td"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center font-bold text-sm">{u.name[0]}</div><div><div className="font-medium text-sm">{u.name}</div><div className="text-xs text-[#6B6050]">{u.email}</div></div></div></td>
                  <td className="td"><div className="flex items-center gap-1.5 text-xs capitalize" style={{color:ROLE_COLOR[u.role]}}><Icon size={13}/>{u.role.replace('_',' ')}</div></td>
                  <td className="td text-sm text-[#A09880]">{u.academy}</td>
                  <td className="td text-sm text-[#6B6050]">{u.joined}</td>
                  <td className="td text-center"><span className={`badge text-xs ${u.active?'badge-green':'badge-gray'}`}>{u.active?'Active':'Inactive'}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
