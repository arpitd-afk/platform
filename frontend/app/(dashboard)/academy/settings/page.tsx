'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAcademy } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { academiesAPI } from '@/lib/api'
import { PageLoading } from '@/components/shared/States'
import { Settings, Building2, Globe, Save, Loader2, Palette } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AcademySettingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: academy, isLoading } = useAcademy(user?.academyId)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [loaded, setLoaded] = useState(false)

  if (!loaded && academy) {
    setName(academy.name || ''); setSlug(academy.slug || '')
    setCity(academy.city || ''); setCountry(academy.country || 'India')
    setLoaded(true)
  }

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => academiesAPI.update(user!.academyId!, { name, slug, city, country }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academy'] }); toast.success('Settings saved!') },
    onError: () => toast.error('Failed to save'),
  })

  if (isLoading) return <PageLoading />

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2"><Settings size={22} style={{ color: 'var(--amber)' }} />Academy Settings</h1>

      <div className="card p-6 space-y-5">
        <h3 className="section-title flex items-center gap-2"><Building2 size={16} style={{ color: 'var(--amber)' }} />General</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Academy Name *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your Academy Name" />
          </div>
          <div>
            <label className="label">URL Slug</label>
            <div className="relative">
              <input className="input pl-10" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="my-academy" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>@</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{slug || 'your-slug'}.chessacademy.pro</p>
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" />
          </div>
          <div>
            <label className="label">Country</label>
            <select className="input" value={country} onChange={e => setCountry(e.target.value)}>
              {['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
          </div>
        </div>

        <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Current Plan</div>
              <div className="text-xs capitalize mt-0.5 badge badge-gold">{academy?.plan || 'trial'}</div>
            </div>
            <a href="/academy/billing" className="btn-secondary text-sm">Upgrade Plan</a>
          </div>
        </div>

        <button onClick={() => mutateAsync()} disabled={isPending} className="btn-primary flex items-center gap-2">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2 text-red-600"><Settings size={16} />Danger Zone</h3>
        <div className="rounded-xl p-4" style={{ background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
          <h4 className="font-medium text-sm text-red-700">Delete Academy</h4>
          <p className="text-xs text-red-600 mt-1">Permanently deletes all data including students, coaches, and classes. This cannot be undone.</p>
          <button className="mt-3 btn-danger text-xs py-2 px-4">Delete Academy</button>
        </div>
      </div>
    </div>
  )
}
