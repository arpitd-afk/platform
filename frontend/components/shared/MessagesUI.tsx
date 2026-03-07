'use client'
import { useState, useRef, useEffect } from 'react'
import { useConversations, useMessages, useContacts, useSendMessage } from '@/lib/hooks'
import { useAuth } from '@/lib/auth-context'
import { Send, Search, MessageSquare, User, Loader2 } from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import { formatDistanceToNow } from 'date-fns'

const ROLE_COLOR: Record<string, string> = {
  coach: '#15803D', student: '#1D4ED8', academy_admin: '#9A6E00',
  parent: '#BE185D', super_admin: '#7C3AED',
}

export default function MessagesUI() {
  const { user } = useAuth()
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')
  const [showContacts, setShowContacts] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isLoading: convLoading } = useConversations()
  const { data: contacts = [] } = useContacts()
  const { data: messages = [], isLoading: msgLoading } = useMessages(selectedContact?.id)
  const send = useSendMessage()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !selectedContact) return
    await send.mutateAsync({ receiverId: selectedContact.id, content: text })
    setText('')
  }

  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredConvos = conversations.filter((c: any) =>
    (c.other_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectUser = (u: any) => { setSelectedContact(u); setShowContacts(false) }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 card overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-[var(--border)] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold text-sm flex-1">Messages</h2>
            <button onClick={() => setShowContacts(!showContacts)}
              className="btn-primary text-xs py-1.5 px-3">+ New</button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." className="input pl-8 py-1.5 text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showContacts ? (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">New Conversation</div>
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-[var(--text-muted)] text-sm">No contacts available</div>
              ) : filteredContacts.map((c: any) => (
                <button key={c.id} onClick={() => selectUser(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <Avatar user={c} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs capitalize" style={{ color: ROLE_COLOR[c.role] }}>{c.role?.replace('_', ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {convLoading ? (
                <div className="p-6 text-center"><Loader2 size={18} className="text-[var(--amber)] animate-spin mx-auto" /></div>
              ) : filteredConvos.length === 0 ? (
                <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                  <MessageSquare size={28} className="mx-auto mb-2 text-[#3A3530]" />
                  No conversations yet.<br />Click "+ New" to start one.
                </div>
              ) : filteredConvos.map((c: any) => (
                <button key={c.other_user} onClick={() => selectUser({ id: c.other_user, name: c.other_name, role: c.other_role })}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left border-b border-[var(--border)] ${selectedContact?.id === c.other_user ? 'bg-[var(--bg-subtle)]' : ''}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 relative"
                    style={{ background: `${ROLE_COLOR[c.other_role]}20`, color: ROLE_COLOR[c.other_role] }}>
                    {c.other_name?.[0] || '?'}
                    {c.sender_id !== user?.id && !c.is_read && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#D4AF37] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{c.other_name}</span>
                      <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-1">
                        {c.last_at ? formatDistanceToNow(new Date(c.last_at), { addSuffix: false }) : ''}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{c.last_message}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedContact ? (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)]">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: `${ROLE_COLOR[selectedContact.role]}20`, color: ROLE_COLOR[selectedContact.role] }}>
                {selectedContact.name?.[0] || '?'}
              </div>
              <div>
                <div className="font-semibold text-sm">{selectedContact.name}</div>
                <div className="text-xs capitalize" style={{ color: ROLE_COLOR[selectedContact.role] }}>
                  {selectedContact.role?.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center pt-8"><Loader2 size={20} className="text-[var(--amber)] animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center pt-12">
                  <MessageSquare size={32} className="mx-auto mb-3 text-[#3A3530]" />
                  <p className="text-[var(--text-muted)] text-sm">No messages yet. Say hello! 👋</p>
                </div>
              ) : messages.map((m: any) => {
                const isMe = m.sender_id === user?.id
                return (
                  <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                        {m.sender_name?.[0] || '?'}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-[#D4AF37]/20 text-[var(--text)] rounded-tr-sm' : 'bg-white/[0.07] text-[#E5DFD3] rounded-tl-sm'}`}>
                        {m.content}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] px-1">
                        {m.created_at ? formatDistanceToNow(new Date(m.created_at), { addSuffix: true }) : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-3 p-4 border-t border-[var(--border)]">
              <input value={text} onChange={e => setText(e.target.value)}
                placeholder={`Message ${selectedContact.name}...`}
                className="input flex-1 text-sm" autoComplete="off" />
              <button type="submit" disabled={!text.trim() || send.isPending}
                className="btn-primary w-10 h-10 p-0 flex items-center justify-center flex-shrink-0">
                {send.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center">
              <MessageSquare size={28} className="text-[#3A3530]" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-mid)]">Your Messages</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Select a conversation or start a new one</p>
            </div>
            <button onClick={() => setShowContacts(true)} className="btn-primary text-sm">
              Start New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
