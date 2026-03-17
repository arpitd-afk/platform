import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { academiesAPI } from '../api'
import toast from 'react-hot-toast'

export const useAcademies = (params?: any) =>
  useQuery({
    queryKey: ['academies', params],
    queryFn: () => academiesAPI.list(params).then(r => r.data.academies),
    staleTime: 30000,
  })

export const useAcademy = (id?: string) =>
  useQuery({
    queryKey: ['academy', id],
    queryFn: () => academiesAPI.get(id!).then(r => r.data.academy),
    enabled: !!id,
  })

export const useUpdateAcademy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => academiesAPI.update(id, data),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: ['academy', id] }); toast.success('Academy updated!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  })
}

export const useSuspendAcademy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academiesAPI.suspend(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academies'] }); toast.success('Academy suspended') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
}

export const useActivateAcademy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academiesAPI.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academies'] }); toast.success('Academy activated') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
}
