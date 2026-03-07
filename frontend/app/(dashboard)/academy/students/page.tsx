'use client'
import { useState, useRef } from 'react'
import { useUsers, useBatches } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import CreateUserModal from '@/components/shared/CreateUserModal'
import Avatar from '@/components/shared/Avatar'
import Modal from '@/components/shared/Modal'
import { GraduationCap, Search, Plus, Upload, Download, Loader2, Edit2, Trash2, Link2, Star, X } from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Edit Student Modal ─────────────────────────────────────── */
function EditStudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: batches = [] } = useBatches({})
  const [name, setName] = useState(student.name || '')
  const [batchId, setBatchId] = useState(student.batch_id || '')
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => usersAPI.update(student.id, { name, batch_id: batchId || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Student updated'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  })
  return (
    <Modal title="Edit Student" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="label">Full Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="label">Email</label><input className="input" value={student.email} disabled /></div>
        <div>
          <label className="label">Batch</label>
          <select className="input" value={batchId} onChange={e => setBatchId(e.target.value)}>
            <option value="">No batch</option>
            {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutateAsync()} disabled={isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Link Parent Modal ──────────────────────────────────────── */
function LinkParentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => usersAPI.linkParent(student.id, email),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(res.data.message)
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <Modal title={`Link Parent – ${student.name}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Enter the parent's email. If they don't have an account yet, one will be created automatically with a temporary password.
        </p>
        <div>
          <label className="label">Parent Email *</label>
          <input className="input" type="email" placeholder="parent@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && !isPending && email && mutateAsync()} />
        </div>
        <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
          <strong style={{ color: 'var(--text-mid)' }}>Note:</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>If a new parent account is created, the temporary password will be <strong className="font-mono">Parent@123</strong>. Share this with them.</span>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutateAsync()} disabled={isPending || !email} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Link Parent
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Bulk Import Modal ──────────────────────────────────────── */
function BulkImportModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { data: batches = [] } = useBatches({})
  const [batchId, setBatchId] = useState('')
  const [rows, setRows] = useState<{ name: string; email: string; phone: string; valid: boolean }[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const lines = (ev.target?.result as string).split('\n').filter(Boolean)
      const parsed = lines.slice(1).map(line => {
        const [name = '', email = '', phone = ''] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
        return { name, email, phone, valid: !!(name && email && email.includes('@')) }
      }).filter(r => r.name || r.email)
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('Name,Email,Phone\nArjun Sharma,arjun@email.com,9876543210\n')
    a.download = 'students-template.csv'; a.click()
  }

  const handleImport = async () => {
    const valid = rows.filter(r => r.valid)
    if (!valid.length) return toast.error('No valid rows found')
    setLoading(true)
    const results = await Promise.allSettled(
      valid.map(s => usersAPI.create({ name: s.name, email: s.email, password: 'Student@123', role: 'student', batchId: batchId || undefined }))
    )
    const ok = results.filter(r => r.status === 'fulfilled').length
    const fail = results.filter(r => r.status === 'rejected').length
    toast.success(`${ok} imported${fail ? `, ${fail} failed (duplicate emails?)` : ''}`)
    qc.invalidateQueries({ queryKey: ['users'] })
    setLoading(false)
    onClose()
  }

  return (
    <Modal title="Bulk Import Students" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Upload CSV with columns: Name, Email, Phone</p>
          <button onClick={downloadTemplate} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
            <Download size={12} /> Template
          </button>
        </div>
        <div onClick={() => fileRef.current?.click()}
          className="rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{ border: '2px dashed var(--border-md)', background: 'var(--bg-subtle)' }}
          onMouseEnter={e => (e.currentTarget as any).style.borderColor = 'var(--amber)'}
          onMouseLeave={e => (e.currentTarget as any).style.borderColor = 'var(--border-md)'}>
          <Upload size={22} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>
            {rows.length > 0 ? `${rows.length} rows loaded — click to change` : 'Click to upload CSV'}
          </p>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
        </div>
        {rows.length > 0 && (
          <>
            <div>
              <label className="label">Assign to Batch (optional)</label>
              <select className="input" value={batchId} onChange={e => setBatchId(e.target.value)}>
                <option value="">No batch</option>
                {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr><th className="th py-2">Name</th><th className="th py-2">Email</th><th className="th py-2 text-center">Valid</th></tr></thead>
                  <tbody>
                    {rows.slice(0, 20).map((r, i) => (
                      <tr key={i} className="tr" style={{ opacity: r.valid ? 1 : 0.4 }}>
                        <td className="td py-2">{r.name}</td>
                        <td className="td py-2 font-mono" style={{ color: 'var(--text-muted)' }}>{r.email}</td>
                        <td className="td py-2 text-center">{r.valid ? '✓' : <X size={11} className="inline text-red-500" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="text-green-600">{rows.filter(r => r.valid).length} valid rows</span>
              {rows.filter(r => !r.valid).length > 0 && <span className="text-red-500">{rows.filter(r => !r.valid).length} invalid (will be skipped)</span>}
            </div>
          </>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleImport} disabled={loading || rows.filter(r => r.valid).length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Import {rows.filter(r => r.valid).length} Students
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function AcademyStudentsPage() {
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [linking, setLinking] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const qc = useQueryClient()
  const { data: students = [], isLoading } = useUsers({ role: 'student' })
  const { data: batches = [] } = useBatches({})

  const filtered = students.filter((s: any) => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    const matchBatch = !batchFilter || s.batch_id === batchFilter
    return matchSearch && matchBatch
  })

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate student "${name}"? They won't be able to log in.`)) return
    setDeleting(id)
    try {
      await usersAPI.update(id, { is_active: false })
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Student deactivated')
    } catch { toast.error('Failed') }
    finally { setDeleting(null) }
  }

  if (isLoading) return <PageLoading />

  const avgRating = students.length
    ? Math.round(students.reduce((s: number, u: any) => s + (u.rating || 1200), 0) / students.length)
    : 0

  return (
    <div className="space-y-5 animate-fade-in">
      {showCreate && <CreateUserModal role="student" onClose={() => setShowCreate(false)} />}
      {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} />}
      {editing && <EditStudentModal student={editing} onClose={() => setEditing(null)} />}
      {linking && <LinkParentModal student={linking} onClose={() => setLinking(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2">
          <GraduationCap size={22} style={{ color: 'var(--amber)' }} /> Students
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulk(true)} className="btn-secondary text-sm flex items-center gap-2">
            <Upload size={14} /> Bulk Import
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length, color: 'var(--amber)' },
          { label: 'Avg. Rating', value: avgRating, color: '#1D4ED8' },
          { label: 'Batches', value: batches.length, color: '#15803D' },
          { label: 'Active Today', value: students.filter((s: any) => s.last_login_at && new Date(s.last_login_at) > new Date(Date.now() - 86400000)).length, color: '#BE185D' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm w-44" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
          <option value="">All Batches</option>
          {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="No students found" subtitle="Add students individually or import from CSV"
            action={<button onClick={() => setShowCreate(true)} className="btn-primary text-sm"><Plus size={14} /> Add Student</button>} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="th">Student</th>
              <th className="th">Batch</th>
              <th className="th text-center">Rating</th>
              <th className="th text-center">Joined</th>
              <th className="th text-center">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id} className="tr">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar user={s} size="sm" />
                      <div>
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    {s.batch_name
                      ? <span className="badge badge-gold text-xs">{s.batch_name}</span>
                      : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No batch</span>}
                  </td>
                  <td className="td text-center">
                    <div className="flex items-center justify-center gap-1 font-semibold" style={{ color: 'var(--amber)' }}>
                      <Star size={12} />{s.rating || 1200}
                    </div>
                  </td>
                  <td className="td text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditing(s)} className="btn-icon w-8 h-8" title="Edit"><Edit2 size={13} /></button>
                      <button onClick={() => setLinking(s)} className="btn-icon w-8 h-8" title="Link Parent" style={{ color: '#1D4ED8' }}><Link2 size={13} /></button>
                      <button onClick={() => handleDelete(s.id, s.name)} disabled={deleting === s.id} className="btn-icon w-8 h-8" style={{ color: '#DC2626' }} title="Deactivate">
                        {deleting === s.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Showing {filtered.length} of {students.length} students</span>
          </div>
        </div>
      )}
    </div>
  )
}
