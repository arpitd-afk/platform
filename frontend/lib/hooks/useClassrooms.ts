import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classroomsAPI } from '../api'
import toast from 'react-hot-toast'

export const useClassrooms = (params?: any) =>
  useQuery({
    queryKey: ['classrooms', params],
    queryFn: () => classroomsAPI.list(params).then(r => r.data.classrooms),
    staleTime: 20000,
  })

export const useClassroom = (id?: string) =>
  useQuery({
    queryKey: ['classroom', id],
    queryFn: () => classroomsAPI.get(id!).then(r => r.data.classroom),
    enabled: !!id,
  })

export const useCreateClassroom = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => classroomsAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classrooms'] }); toast.success('Class scheduled!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create class'),
  })
}
