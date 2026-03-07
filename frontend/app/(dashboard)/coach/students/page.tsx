'use client'
import { useState } from 'react'
import { useUsers } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@/lib/api'
import { PageLoading, EmptyState } from '@/components/shared/States'
import CreateUserModal from '@/components/shared/CreateUserModal'
import Avatar from '@/components/shared/Avatar'
import Modal from '@/components/shared/Modal'
import { Users, Search, Plus, Link2, TrendingUp, Star, Loader2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

function LinkParentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => usersAPI.linkParent(student.id, email),
    onSuccess: (res: any) => { toast.success(res.data.message); qc.invalidateQueries({ queryKey: ['users'] }); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <Modal title={`Link Parent – ${student.name}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Enter the parent's email. A new parent account will be created if they don't have one (temp password: Parent@123).
        </p>
        <div>
          <label className="label">Parent Email *</label>
          <input className="input" type="email" placeholder="parent@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutateAsync()} disabled={isPending || !email} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />} Link Parent
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function CoachStudentsPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [linking, setLinking] = useState<any>(null)
  const router = useRouter()
  const { data: students = [], isLoading } = useUsers({ role: 'student' })

  const filtered = students.filter((s: any) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-5 animate-fade-in">
      {showCreate && <CreateUserModal role="student" onClose={() => setShowCreate(false)} />}
      {linking && <LinkParentModal student={linking} onClose={() => setLinking(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2"><Users size={22} style={{ color: 'var(--amber)' }} />My Students</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={15} />Add Student</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: students.length, color: 'var(--amber)' },
          { label: 'Avg. Rating', value: students.length ? Math.round(students.reduce((a: number, s: any) => a + (s.rating || 1200), 0) / students.length) : 0, color: '#1D4ED8' },
          { label: 'Active This Week', value: students.filter((s: any) => s.last_login_at && new Date(s.last_login_at) > new Date(Date.now() - 7 * 86400000)).length, color: '#15803D' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-9 text-sm" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No students yet" subtitle="Add your first student to get started"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary text-sm"><Plus size={14} />Add Student</button>} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any) => (
            <div key={s.id} className="card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar user={s} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{s.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg p-2" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="flex items-center justify-center gap-1 font-bold" style={{ color: 'var(--amber)' }}>
                    <Star size={11} />{s.rating || 1200}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rating</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="font-bold text-sm" style={{ color: '#1D4ED8' }}>{s.games_played || 0}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Games</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push(`/coach/analysis?student=${s.id}`)} className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5">
                  <TrendingUp size={12} /> Progress
                </button>
                <button onClick={() => setLinking(s)} className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5" style={{ color: '#1D4ED8' }}>
                  <Link2 size={12} /> Link Parent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
