import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../api'

export const useStudentAnalytics = (id?: string, period = '30d') =>
  useQuery({
    queryKey: ['analytics-student', id, period],
    queryFn: () => analyticsAPI.student(id!, { period }).then(r => r.data),
    enabled: !!id,
    staleTime: 60000,
  })

export const useAcademyAnalytics = (id?: string, period = '30d') =>
  useQuery({
    queryKey: ['analytics-academy', id, period],
    queryFn: () => analyticsAPI.academy(id!, { period }).then(r => r.data),
    enabled: !!id,
    staleTime: 60000,
  })

export const useGlobalAnalytics = () =>
  useQuery({
    queryKey: ['analytics-global'],
    queryFn: () => analyticsAPI.global().then(r => r.data),
    staleTime: 120000,
  })
