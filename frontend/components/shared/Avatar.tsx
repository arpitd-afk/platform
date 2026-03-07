'use client'
import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { usersAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

const ROLE_BG: Record<string, string> = {
  super_admin: '#EDE9FE',
  academy_admin: 'rgba(200,150,30,0.12)',
  coach: '#DCFCE7',
  student: '#DBEAFE',
  parent: '#FCE7F3',
}
const ROLE_COLOR: Record<string, string> = {
  super_admin: '#7C3AED',
  academy_admin: '#9A6E00',
  coach: '#15803D',
  student: '#1D4ED8',
  parent: '#BE185D',
}

interface AvatarProps {
  user?: { id?: string; name?: string; avatar?: string; role?: string } | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean
  onUpdate?: (avatar: string) => void
  className?: string
}

const SIZES = {
  xs: { box: 'w-7 h-7', text: 'text-xs', camera: 12 },
  sm: { box: 'w-9 h-9', text: 'text-sm', camera: 14 },
  md: { box: 'w-11 h-11', text: 'text-sm', camera: 16 },
  lg: { box: 'w-16 h-16', text: 'text-xl', camera: 18 },
  xl: { box: 'w-24 h-24', text: 'text-3xl', camera: 22 },
}

export default function Avatar({ user, size = 'md', editable = false, onUpdate, className = '' }: AvatarProps) {
  const { updateUser } = useAuth()
  const [uploading, setUploading] = useState(false)
  const s = SIZES[size]
  const bg = ROLE_BG[user?.role || ''] || 'var(--bg-subtle)'
  const color = ROLE_COLOR[user?.role || ''] || 'var(--text-muted)'
  const initial = user?.name?.[0]?.toUpperCase() || '?'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')

    // Compress to max 300KB
    const canvas = document.createElement('canvas')
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      const MAX = 200
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL('image/jpeg', 0.85)
      URL.revokeObjectURL(url)

      setUploading(true)
      try {
        await usersAPI.uploadAvatar(user.id!, base64)
        updateUser({ avatar: base64 })
        onUpdate?.(base64)
        toast.success('Profile photo updated!')
      } catch {
        toast.error('Upload failed')
      } finally {
        setUploading(false)
      }
    }
    img.src = url
  }

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 rounded-full ${s.box} ${className}`}
      style={{ background: user?.avatar ? 'transparent' : bg }}>
      {user?.avatar ? (
        <img src={user.avatar} alt={user.name || ''} className={`${s.box} rounded-full object-cover`} />
      ) : (
        <span className={`${s.text} font-bold select-none`} style={{ color }}>{initial}</span>
      )}

      {editable && (
        <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group">
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
          {uploading
            ? <Loader2 size={s.camera} className="text-white animate-spin" />
            : <Camera size={s.camera} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
        </label>
      )}
    </div>
  )
}
