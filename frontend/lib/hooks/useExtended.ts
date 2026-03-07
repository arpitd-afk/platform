import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extUsersAPI, contentExtAPI, billingExtAPI } from '../api'
import toast from 'react-hot-toast'

export const useRatingHistory = (id?: string, limit = 30) =>
  useQuery({
    queryKey: ['rating-history', id, limit],
    queryFn: () => extUsersAPI.ratingHistory(id!, limit).then(r => r.data.history),
    enabled: !!id,
    staleTime: 60000,
  })

export const useMyChildren = () =>
  useQuery({
    queryKey: ['my-children'],
    queryFn: () => extUsersAPI.myChildren().then(r => r.data.children),
    staleTime: 30000,
  })

export const useStudentAttendance = (id?: string) =>
  useQuery({
    queryKey: ['attendance', id],
    queryFn: () => extUsersAPI.attendance(id!).then(r => r.data.attendance),
    enabled: !!id,
    staleTime: 30000,
  })

export const useLeaderboard = (academyId?: string) =>
  useQuery({
    queryKey: ['leaderboard', academyId],
    queryFn: () => extUsersAPI.leaderboard(academyId!).then(r => r.data.leaderboard),
    enabled: !!academyId,
    staleTime: 60000,
  })

export const useChildrenProgress = (parentId?: string) =>
  useQuery({
    queryKey: ['children-progress', parentId],
    queryFn: () => extUsersAPI.childrenProgress(parentId!).then(r => r.data.progress),
    enabled: !!parentId,
    staleTime: 30000,
  })

export const useLessons = (params?: any) =>
  useQuery({
    queryKey: ['lessons', params],
    queryFn: () => contentExtAPI.lessons(params).then(r => r.data.lessons),
    staleTime: 60000,
  })

export const useMyLessonProgress = () =>
  useQuery({
    queryKey: ['lesson-progress'],
    queryFn: () => contentExtAPI.myProgress().then(r => r.data.progress),
    staleTime: 30000,
  })

export const useCompleteLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contentExtAPI.completeLesson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-progress'] }),
  })
}

export const useMyInvoices = () =>
  useQuery({
    queryKey: ['my-invoices'],
    queryFn: () => billingExtAPI.myInvoices().then(r => r.data.invoices),
    staleTime: 60000,
  })

export const useSubscription = (academyId?: string) =>
  useQuery({
    queryKey: ['subscription', academyId],
    queryFn: () => billingExtAPI.subscription(academyId!).then(r => r.data.subscription),
    enabled: !!academyId,
    staleTime: 60000,
  })
