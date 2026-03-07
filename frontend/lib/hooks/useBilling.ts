import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingAPI } from '../api'
import toast from 'react-hot-toast'

export const usePlans = () =>
  useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingAPI.plans().then(r => r.data.plans),
    staleTime: 300000,
  })

export const useInvoices = (academyId?: string) =>
  useQuery({
    queryKey: ['invoices', academyId],
    queryFn: () => billingAPI.invoices(academyId!).then(r => r.data.invoices),
    enabled: !!academyId,
    staleTime: 60000,
  })

export const useUpgradePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ academyId, plan }: { academyId: string; plan: string }) => billingAPI.upgrade(academyId, plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academy'] }); toast.success('Plan upgraded!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Upgrade failed'),
  })
}
