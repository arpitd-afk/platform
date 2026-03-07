import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tournamentsAPI } from '../api'
import toast from 'react-hot-toast'

export const useTournaments = (params?: any) =>
  useQuery({
    queryKey: ['tournaments', params],
    queryFn: () => tournamentsAPI.list(params).then(r => r.data.tournaments),
    staleTime: 30000,
  })

export const useTournament = (id?: string) =>
  useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsAPI.get(id!).then(r => r.data.tournament),
    enabled: !!id,
  })

export const useTournamentStandings = (id?: string) =>
  useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => tournamentsAPI.standings(id!).then(r => r.data.standings),
    enabled: !!id,
    refetchInterval: 15000,
  })

export const useCreateTournament = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => tournamentsAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournaments'] }); toast.success('Tournament created!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create'),
  })
}

export const useRegisterTournament = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.register(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournaments'] }); toast.success('Registered successfully!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Registration failed'),
  })
}
