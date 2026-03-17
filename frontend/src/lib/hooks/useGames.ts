import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamesAPI } from '../api'
import toast from 'react-hot-toast'

export const useGames = (params?: any) =>
  useQuery({
    queryKey: ['games', params],
    queryFn: () => gamesAPI.list(params).then(r => r.data.games),
    staleTime: 10000,
  })

export const useGame = (id?: string) =>
  useQuery({
    queryKey: ['game', id],
    queryFn: () => gamesAPI.get(id!).then(r => r.data.game),
    enabled: !!id,
    refetchInterval: (q) => q.state.data?.status === 'active' ? 2000 : false,
  })

export const useCreateGame = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => gamesAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create game'),
  })
}

export const useResignGame = () =>
  useMutation({
    mutationFn: (id: string) => gamesAPI.resign(id),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to resign'),
  })

export const useAnalyzeGame = () =>
  useMutation({
    mutationFn: (id: string) => gamesAPI.analyze(id),
    onSuccess: () => toast.success('Analysis queued!'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Analysis failed'),
  })
