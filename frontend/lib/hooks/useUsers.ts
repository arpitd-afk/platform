import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '../api'
import toast from 'react-hot-toast'

export const useUsers = (params?: any) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: () => usersAPI.list(params).then(r => r.data.users),
    staleTime: 30000,
  })

export const useUser = (id?: string) =>
  useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.get(id!).then(r => r.data.user),
    enabled: !!id,
  })

export const useUserStats = (id?: string) =>
  useQuery({
    queryKey: ['user-stats', id],
    queryFn: () => usersAPI.stats(id!).then(r => r.data),
    enabled: !!id,
  })

export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersAPI.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['user', id] })
      toast.success('Profile updated!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  })
}
