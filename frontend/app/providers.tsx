'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false } },
  }))
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" toastOptions={{
          style: { background: '#FFFCF8', color: '#1C1107', border: '1px solid #E2D8CE', borderRadius: '12px', boxShadow: '0 4px 12px rgba(100,70,40,0.10)' },
          success: { iconTheme: { primary: '#C8961E', secondary: '#FFFCF8' } },
          error:   { iconTheme: { primary: '#DC2626', secondary: '#FFFCF8' } },
        }} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
