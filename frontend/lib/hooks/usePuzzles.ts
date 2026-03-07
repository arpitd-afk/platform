import { useQuery, useMutation } from '@tanstack/react-query'
import { puzzlesAPI } from '../api'

export const useDailyPuzzle = () =>
  useQuery({
    queryKey: ['puzzle-daily'],
    queryFn: () => puzzlesAPI.daily().then(r => r.data.puzzle),
    staleTime: 3600000,
  })

export const useRandomPuzzle = (difficulty?: string) =>
  useQuery({
    queryKey: ['puzzle-random', difficulty],
    queryFn: () => puzzlesAPI.random({ difficulty }).then(r => r.data.puzzle),
  })

export const useSubmitPuzzle = () =>
  useMutation({
    mutationFn: ({ id, moves, timeTakenMs }: { id: string; moves: string[]; timeTakenMs?: number }) =>
      puzzlesAPI.submit(id, { moves, timeTakenMs }),
  })
