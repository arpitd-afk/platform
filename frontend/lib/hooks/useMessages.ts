import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesAPI } from '../api'
import toast from 'react-hot-toast'

export const useConversations = () =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.conversations().then(r => r.data.conversations),
    refetchInterval: 10000,
  })

export const useMessages = (userId?: string) =>
  useQuery({
    queryKey: ['messages', userId],
    queryFn: () => messagesAPI.getMessages(userId!).then(r => r.data.messages),
    enabled: !!userId,
    refetchInterval: 5000,
  })

export const useContacts = () =>
  useQuery({
    queryKey: ['message-contacts'],
    queryFn: () => messagesAPI.contacts().then(r => r.data.contacts),
    staleTime: 60000,
  })

export const useSendMessage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string; content: string }) =>
      messagesAPI.send(receiverId, content),
    onSuccess: (_, { receiverId }) => {
      qc.invalidateQueries({ queryKey: ['messages', receiverId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('Failed to send message'),
  })
}
