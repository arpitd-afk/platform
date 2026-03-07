import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesAPI } from '../api'
import toast from 'react-hot-toast'

export const useBatches = (params?: any) =>
  useQuery({
    queryKey: ['batches', params],
    queryFn: () => batchesAPI.list(params).then(r => r.data.batches),
    staleTime: 30000,
  })

export const useBatch = (id?: string) =>
  useQuery({
    queryKey: ['batch', id],
    queryFn: () => batchesAPI.get(id!).then(r => r.data.batch),
    enabled: !!id,
  })

export const useBatchStudents = (id?: string) =>
  useQuery({
    queryKey: ['batch-students', id],
    queryFn: () => batchesAPI.students(id!).then(r => r.data.students),
    enabled: !!id,
  })

export const useCreateBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => batchesAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); toast.success('Batch created!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create batch'),
  })
}

export const useUpdateBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => batchesAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); toast.success('Batch updated!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update batch'),
  })
}

export const useDeleteBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => batchesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); toast.success('Batch removed') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete'),
  })
}

export const useEnrollStudent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ batchId, userId }: { batchId: string; userId: string }) => batchesAPI.enroll(batchId, userId),
    onSuccess: (_, { batchId }) => { qc.invalidateQueries({ queryKey: ['batch-students', batchId] }); toast.success('Student enrolled!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Enrollment failed'),
  })
}
