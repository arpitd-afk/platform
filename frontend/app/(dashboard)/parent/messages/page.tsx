'use client'
import MessagesUI from '@/components/shared/MessagesUI'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="space-y-4 animate-fade-in h-full">
      <h1 className="page-title flex items-center gap-2">
        <MessageSquare size={22} className="text-[#15803D]" />Messages
      </h1>
      <MessagesUI />
    </div>
  )
}
