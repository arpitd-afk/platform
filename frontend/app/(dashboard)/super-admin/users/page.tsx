'use client'
import { useState } from 'react'
import { useUsers, useAcademies } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Avatar from '@/components/shared/Avatar'
import Modal from '@/components/shared/Modal'
import { Users, Search, Plus, Loader2, Eye, EyeOff, Trash2, Edit2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = ['all', 'super_admin', 'academy_admin', 'coach', 'student', 'parent']
const ROLE_COLOR: Record<string,string> = { super_admin:'#7C3AED', academy_admin:'#9A6E00', coach:'#15803D', student:'#1D4ED8', parent:'#BE185D' }

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { data: academies = [] } = useAcademies({})
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: 'Admin@123', phone: '', academyId: '', role: 'academy_admin' as string })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (d: any) => usersAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created!'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const handleSubmit = () => {
    if (!form.name || !form.email) return toast.error('Name and email required')
    mutateAsync({ ...form, academyId: form.academyId || undefined })
  }
  return (
    <Modal title="Create User" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Role *</label>
          <select className="input" value={form.role} onChange={e => up('role', e.target.value)}>
            <option value="academy_admin">Academy Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="coach">Coach</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name *</label><input className="input" placeholder="Full name" value={form.name} onChange={e => up('name', e.target.value)} autoFocus /></div>
          <div><label className="label">Email *</label><input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={e => up('email', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input className="input pr-10" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => up('password', e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7">
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          <div><label className="label">Phone</label><input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => up('phone', e.target.value)} /></div>
        </div>
        {form.role !== 'super_admin' && (
          <div>
            <label className="label">Assign to Academy</label>
            <select className="input" value={form.academyId} onChange={e => up('academyId', e.target.value)}>
              <option value="">Select academy...</option>
              {academies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create User
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function SuperAdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useUsers(roleFilter !== 'all' ? { role: roleFilter } : {})

  const filtered = users.filter((u: any) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleActive = async (u: any) => {
    try {
      await usersAPI.update(u.id, { is_active: !u.is_active })
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(u.is_active ? 'User deactivated' : 'User activated')
    } catch { toast.error('Failed') }
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-5 animate-fade-in">
      {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Users size={22} style={{ color: 'var(--amber)' }} />All Users</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={15} />Create User</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          {ROLES.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${roleFilter === r ? 'text-white' : ''}`}
              style={{
                background: roleFilter === r ? (r === 'all' ? 'var(--amber)' : ROLE_COLOR[r] || 'var(--amber)') : 'var(--bg-subtle)',
                color: roleFilter === r ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}>
              {r === 'all' ? 'All' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['super_admin', 'academy_admin', 'coach', 'student'].map(r => (
          <div key={r} className="stat-card">
            <div className="text-2xl font-display font-bold" style={{ color: ROLE_COLOR[r] }}>
              {users.filter((u: any) => u.role === r).length}
            </div>
            <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{r.replace('_', ' ')}s</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No users found" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="th">User</th><th className="th">Role</th><th className="th">Academy</th>
              <th className="th text-center">Rating</th><th className="th text-center">Status</th><th className="th text-center">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.id} className="tr">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size="sm" />
                      <div>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <span className="badge text-xs capitalize" style={{ background: `${ROLE_COLOR[u.role]}15`, color: ROLE_COLOR[u.role] }}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="td text-sm" style={{ color: 'var(--text-muted)' }}>{u.academy_name || '—'}</td>
                  <td className="td text-center font-mono text-sm font-semibold" style={{ color: 'var(--amber)' }}>{u.rating || '—'}</td>
                  <td className="td text-center">
                    <span className={`badge text-xs ${u.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="td text-center">
                    <button onClick={() => handleToggleActive(u)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${u.is_active !== false ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
