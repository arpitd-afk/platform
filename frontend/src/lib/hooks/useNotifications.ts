import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '../api'

export const useNotifications = (params?: any) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsAPI.list(params).then(r => r.data.notifications),
    staleTime: 10000,
    refetchInterval: 30000,
  })

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsAPI.unreadCount().then(r => r.data.count),
    refetchInterval: 30000,
  })

export const useMarkRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useMarkAllRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })
}
