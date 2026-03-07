'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@/lib/api'
import { useBatches } from '@/lib/hooks'
import Modal from '@/components/shared/Modal'
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateUserModalProps {
  role: 'academy_admin' | 'coach' | 'student' | 'parent'
  onClose: () => void
  onSuccess?: (user: any) => void
}

const ROLE_LABELS: Record<string, string> = {
  academy_admin: 'Academy Admin',
  coach: 'Coach',
  student: 'Student',
  parent: 'Parent',
}

export default function CreateUserModal({ role, onClose, onSuccess }: CreateUserModalProps) {
  const qc = useQueryClient()
  const { data: batches = [] } = useBatches({})
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: 'Chess@123', phone: '', batchId: '',
    city: '', academyId: '',
  })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: any) => usersAPI.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(`${ROLE_LABELS[role]} created successfully!`)
      onSuccess?.(res.data)
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create user'),
  })

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.email.trim()) return toast.error('Email is required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    mutateAsync({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      role,
      batchId: form.batchId || undefined,
    })
  }

  return (
    <Modal title={`Add ${ROLE_LABELS[role]}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="e.g. Arjun Sharma" value={form.name} onChange={e => up('name', e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" placeholder="arjun@example.com" value={form.email} onChange={e => up('email', e.target.value)} />
          </div>
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
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => up('phone', e.target.value)} />
          </div>
        </div>

        {role === 'student' && batches.length > 0 && (
          <div>
            <label className="label">Assign to Batch (optional)</label>
            <select className="input" value={form.batchId} onChange={e => up('batchId', e.target.value)}>
              <option value="">No batch yet</option>
              {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
          <strong style={{ color: 'var(--text-mid)' }}>Login credentials</strong>
          <div style={{ color: 'var(--text-muted)' }} className="mt-1">
            Email: <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>{form.email || '—'}</span>
            <span className="mx-2">·</span>
            Password: <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>{form.password}</span>
          </div>
          <div className="mt-0.5" style={{ color: 'var(--text-muted)' }}>Share these with the new {ROLE_LABELS[role].toLowerCase()} so they can log in.</div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {isPending ? 'Creating...' : `Create ${ROLE_LABELS[role]}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
