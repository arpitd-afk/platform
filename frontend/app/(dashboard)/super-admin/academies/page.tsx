'use client'
import { useState } from 'react'
import { useAcademies } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { academiesAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import Modal from '@/components/shared/Modal'
import { Building2, Search, Plus, Loader2, Eye, EyeOff, Globe, Users, CheckCircle2, XCircle, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_COLOR: Record<string,string> = { trial:'#6B7280', starter:'#1D4ED8', academy:'#9A6E00', enterprise:'#7C3AED' }
const PLAN_BG:    Record<string,string> = { trial:'#F3F4F6', starter:'#DBEAFE', academy:'rgba(200,150,30,0.12)', enterprise:'#EDE9FE' }

/* ── Create Academy Modal ───────────────────────────────────── */
function CreateAcademyModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: '', slug: '', city: '', country: 'India', plan: 'trial',
    ownerName: '', ownerEmail: '', ownerPassword: 'Admin@123',
  })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (d: any) => academiesAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academies'] }); toast.success('Academy created!'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create academy'),
  })

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Academy name is required')
    if (!form.ownerEmail.trim()) return toast.error('Owner email is required')
    if (!form.ownerName.trim()) return toast.error('Owner name is required')
    const slug = form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    mutateAsync({ ...form, slug })
  }

  return (
    <Modal title="Create New Academy" onClose={onClose} size="lg">
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-mid)' }}>Academy Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Academy Name *</label><input className="input" placeholder="Anand Chess Academy" value={form.name} onChange={e => up('name', e.target.value)} autoFocus /></div>
            <div><label className="label">URL Slug</label><input className="input" placeholder="auto-generated" value={form.slug} onChange={e => up('slug', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><label className="label">City</label><input className="input" placeholder="Bengaluru" value={form.city} onChange={e => up('city', e.target.value)} /></div>
            <div><label className="label">Plan</label>
              <select className="input" value={form.plan} onChange={e => up('plan', e.target.value)}>
                <option value="trial">Trial (14 days free)</option>
                <option value="starter">Starter – ₹999/mo</option>
                <option value="academy">Academy – ₹2,499/mo</option>
                <option value="enterprise">Enterprise – Custom</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-mid)' }}>Academy Admin Account</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Admin Name *</label><input className="input" placeholder="Full name" value={form.ownerName} onChange={e => up('ownerName', e.target.value)} /></div>
            <div><label className="label">Admin Email *</label><input className="input" type="email" placeholder="admin@academy.com" value={form.ownerEmail} onChange={e => up('ownerEmail', e.target.value)} /></div>
          </div>
          <div className="mt-4">
            <label className="label">Password for Admin</label>
            <div className="relative">
              <input className="input pr-10" type={showPass ? 'text' : 'password'} value={form.ownerPassword} onChange={e => up('ownerPassword', e.target.value)} />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7">
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
          <strong style={{ color: 'var(--text-mid)' }}>Login credentials for the academy admin:</strong>
          <div className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Email: <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>{form.ownerEmail || '—'}</span>
            &nbsp;·&nbsp; Password: <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>{form.ownerPassword}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Academy
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Edit Academy Modal ─────────────────────────────────────── */
function EditAcademyModal({ academy, onClose }: { academy: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: academy.name || '', plan: academy.plan || 'trial', city: academy.city || '' })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => academiesAPI.update(academy.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academies'] }); toast.success('Academy updated!'); onClose() },
    onError: () => toast.error('Update failed'),
  })
  return (
    <Modal title="Edit Academy" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="label">Academy Name</label><input className="input" value={form.name} onChange={e => up('name', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">City</label><input className="input" value={form.city} onChange={e => up('city', e.target.value)} /></div>
          <div><label className="label">Plan</label>
            <select className="input" value={form.plan} onChange={e => up('plan', e.target.value)}>
              <option value="trial">Trial</option><option value="starter">Starter</option>
              <option value="academy">Academy</option><option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutateAsync()} disabled={isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function AcademiesPage() {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const qc = useQueryClient()
  const { data: academies = [], isLoading } = useAcademies({})

  const filtered = academies.filter((a: any) => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.name?.toLowerCase().includes(q) || a.owner_email?.toLowerCase().includes(q)
    const matchPlan = planFilter === 'all' || a.plan === planFilter || (planFilter === 'active' && a.status === 'active') || (planFilter === 'suspended' && a.status === 'suspended')
    return matchSearch && matchPlan
  })

  const handleToggle = async (a: any) => {
    try {
      if (a.status === 'active') await academiesAPI.suspend(a.id)
      else await academiesAPI.activate(a.id)
      qc.invalidateQueries({ queryKey: ['academies'] })
      toast.success(a.status === 'active' ? 'Academy suspended' : 'Academy activated')
    } catch { toast.error('Failed') }
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-5 animate-fade-in">
      {showCreate && <CreateAcademyModal onClose={() => setShowCreate(false)} />}
      {editing && <EditAcademyModal academy={editing} onClose={() => setEditing(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2"><Building2 size={22} style={{ color: 'var(--amber)' }} />Academies</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={15} />Create Academy</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: academies.length, color: 'var(--amber)' },
          { label: 'Active', value: academies.filter((a: any) => a.status === 'active').length, color: '#15803D' },
          { label: 'Suspended', value: academies.filter((a: any) => a.status === 'suspended').length, color: '#DC2626' },
          { label: 'Enterprise', value: academies.filter((a: any) => a.plan === 'enterprise').length, color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search academies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm w-44" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="all">All Plans</option>
          <option value="trial">Trial</option><option value="starter">Starter</option>
          <option value="academy">Academy</option><option value="enterprise">Enterprise</option>
          <option value="active">Active</option><option value="suspended">Suspended</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No academies found"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary text-sm"><Plus size={14} />Create Academy</button>} /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="th">Academy</th><th className="th">Owner</th>
              <th className="th text-center">Students</th><th className="th text-center">Plan</th>
              <th className="th text-center">Status</th><th className="th text-center">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id} className="tr">
                  <td className="td">
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <Globe size={10} />{a.slug || 'no-slug'}.chessacademy.pro
                    </div>
                  </td>
                  <td className="td">
                    <div className="text-sm">{a.owner_name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.owner_email}</div>
                  </td>
                  <td className="td text-center">
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Users size={13} style={{ color: 'var(--text-muted)' }} />{a.student_count || 0}
                    </div>
                  </td>
                  <td className="td text-center">
                    <span className="badge capitalize text-xs" style={{ background: PLAN_BG[a.plan] || '#F3F4F6', color: PLAN_COLOR[a.plan] || '#6B7280' }}>
                      {a.plan}
                    </span>
                  </td>
                  <td className="td text-center">
                    {a.status === 'active'
                      ? <span className="badge badge-green text-xs flex items-center justify-center gap-1"><CheckCircle2 size={10} />Active</span>
                      : <span className="badge badge-red text-xs flex items-center justify-center gap-1"><XCircle size={10} />Suspended</span>}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditing(a)} className="btn-icon w-8 h-8" title="Edit"><Edit2 size={13} /></button>
                      <button onClick={() => handleToggle(a)}
                        className="text-xs px-3 py-1 rounded-lg font-medium transition-all"
                        style={{ color: a.status === 'active' ? '#DC2626' : '#15803D', background: a.status === 'active' ? '#FEE2E2' : '#DCFCE7' }}>
                        {a.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
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
