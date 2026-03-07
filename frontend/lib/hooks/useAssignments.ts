import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsAPI } from '../api'
import toast from 'react-hot-toast'

export const useAssignments = (params?: any) =>
  useQuery({
    queryKey: ['assignments', params],
    queryFn: () => assignmentsAPI.list(params).then(r => r.data.assignments),
    staleTime: 30000,
  })

export const useCreateAssignment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => assignmentsAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assignments'] }); toast.success('Assignment created!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create assignment'),
  })
}

export const useSubmitAssignment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, submission }: { id: string; submission: any }) => assignmentsAPI.submit(id, { submission }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assignments'] }); toast.success('Assignment submitted!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Submission failed'),
  })
}
