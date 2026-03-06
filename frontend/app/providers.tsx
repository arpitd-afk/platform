'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { AuthProvider } from '@/lib/auth-context'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1710',
              color: '#F5F0E8',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#4ADE80', secondary: '#0F0E0B' } },
            error:   { iconTheme: { primary: '#F87171', secondary: '#0F0E0B' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
