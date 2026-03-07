import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import {
  usersAPI, academiesAPI, batchesAPI, classroomsAPI, gamesAPI,
  tournamentsAPI, assignmentsAPI, puzzlesAPI, analyticsAPI,
  notificationsAPI, billingAPI, contentAPI, parentAPI
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const KEYS = {
  users:         (p?: any)   => ['users', p],
  user:          (id: string) => ['user', id],
  userStats:     (id: string) => ['user-stats', id],
  userGames:     (id: string) => ['user-games', id],
  ratingHistory: (id: string) => ['rating-history', id],
  academies:     (p?: any)   => ['academies', p],
  academy:       (id: string) => ['academy', id],
  academyStats:  (id: string) => ['academy-stats', id],
  batches:       (p?: any)   => ['batches', p],
  batch:         (id: string) => ['batch', id],
  batchStudents: (id: string) => ['batch-students', id],
  classrooms:    (p?: any)   => ['classrooms', p],
  classroom:     (id: string) => ['classroom', id],
  classroomAttendance: (id: string) => ['classroom-attendance', id],
  games:         (p?: any)   => ['games', p],
  game:          (id: string) => ['game', id],
  tournaments:   (p?: any)   => ['tournaments', p],
  tournament:    (id: string) => ['tournament', id],
  tournamentStandings: (id: string) => ['tournament-standings', id],
  tournamentPairings:  (id: string) => ['tournament-pairings', id],
  tournamentPlayers:   (id: string) => ['tournament-players', id],
  assignments:   (p?: any)   => ['assignments', p],
  assignment:    (id: string) => ['assignment', id],
  assignmentSubmissions: (id: string) => ['assignment-submissions', id],
  puzzleDaily:   ()          => ['puzzle-daily'],
  puzzleRandom:  (p?: any)   => ['puzzle-random', p],
  puzzleStats:   ()          => ['puzzle-stats'],
  analytics:     (type: string, id: string, p?: any) => ['analytics', type, id, p],
  notifications: (p?: any)   => ['notifications', p],
  notifCount:    ()          => ['notif-count'],
  billing:       (id: string) => ['billing', id],
  billingPlans:  ()          => ['billing-plans'],
  children:      ()          => ['children'],
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
function useMut<T>(mutFn: (data: T) => Promise<any>, opts?: {
  successMsg?: string
  invalidate?: string[][]
  onSuccess?: (data: any) => void
}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: mutFn,
    onSuccess: (data) => {
      if (opts?.successMsg) toast.success(opts.successMsg)
      opts?.invalidate?.forEach(key => qc.invalidateQueries({ queryKey: key }))
      opts?.onSuccess?.(data)
    },
  })
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => usersAPI.get('me').then(r => r.data.user), staleTime: 60_000 })
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useUsers(params?: any) {
  return useQuery({
    queryKey: KEYS.users(params),
    queryFn: () => usersAPI.list(params).then(r => r.data),
  })
}
export function useUser(id: string) {
  return useQuery({
    queryKey: KEYS.user(id),
    queryFn: () => usersAPI.get(id).then(r => r.data.user),
    enabled: !!id,
  })
}
export function useUserStats(id: string, params?: any) {
  return useQuery({
    queryKey: KEYS.userStats(id),
    queryFn: () => usersAPI.stats(id, params).then(r => r.data),
    enabled: !!id,
  })
}
export function useRatingHistory(id: string) {
  return useQuery({
    queryKey: KEYS.ratingHistory(id),
    queryFn: () => usersAPI.ratingHistory(id).then(r => r.data.history),
    enabled: !!id,
  })
}
export function useUpdateUser(id: string) {
  return useMut((data: any) => usersAPI.update(id, data), {
    successMsg: 'Profile updated',
    invalidate: [KEYS.user(id), ['me']],
  })
}
export function useUpdateUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => usersAPI.updateStatus(id, active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status updated') },
  })
}

// ─── Academies ────────────────────────────────────────────────────────────────
export function useAcademies(params?: any) {
  return useQuery({
    queryKey: KEYS.academies(params),
    queryFn: () => academiesAPI.list(params).then(r => r.data),
  })
}
export function useAcademy(id: string) {
  return useQuery({
    queryKey: KEYS.academy(id),
    queryFn: () => academiesAPI.get(id).then(r => r.data.academy),
    enabled: !!id,
  })
}
export function useAcademyStats(id: string) {
  return useQuery({
    queryKey: KEYS.academyStats(id),
    queryFn: () => academiesAPI.stats(id).then(r => r.data),
    enabled: !!id,
  })
}
export function useAcademyStudents(id: string, params?: any) {
  return useQuery({
    queryKey: ['academy-students', id, params],
    queryFn: () => academiesAPI.students(id, params).then(r => r.data),
    enabled: !!id,
  })
}
export function useSuspendAcademy() {
  return useMut((id: string) => academiesAPI.suspend(id), {
    successMsg: 'Academy suspended',
    invalidate: [['academies']],
  })
}
export function useActivateAcademy() {
  return useMut((id: string) => academiesAPI.activate(id), {
    successMsg: 'Academy activated',
    invalidate: [['academies']],
  })
}
export function useUpdateAcademy(id: string) {
  return useMut((data: any) => academiesAPI.update(id, data), {
    successMsg: 'Academy updated',
    invalidate: [KEYS.academy(id), ['academies']],
  })
}

// ─── Batches ──────────────────────────────────────────────────────────────────
export function useBatches(params?: any) {
  return useQuery({
    queryKey: KEYS.batches(params),
    queryFn: () => batchesAPI.list(params).then(r => r.data.batches),
  })
}
export function useBatch(id: string) {
  return useQuery({
    queryKey: KEYS.batch(id),
    queryFn: () => batchesAPI.get(id).then(r => r.data.batch),
    enabled: !!id,
  })
}
export function useBatchStudents(id: string) {
  return useQuery({
    queryKey: KEYS.batchStudents(id),
    queryFn: () => batchesAPI.students(id).then(r => r.data.students),
    enabled: !!id,
  })
}
export function useCreateBatch() {
  return useMut((data: any) => batchesAPI.create(data), {
    successMsg: 'Batch created',
    invalidate: [['batches']],
  })
}
export function useUpdateBatch(id: string) {
  return useMut((data: any) => batchesAPI.update(id, data), {
    successMsg: 'Batch updated',
    invalidate: [KEYS.batch(id), ['batches']],
  })
}
export function useDeleteBatch() {
  return useMut((id: string) => batchesAPI.delete(id), {
    successMsg: 'Batch removed',
    invalidate: [['batches']],
  })
}
export function useEnrollStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ batchId, userId }: { batchId: string; userId: string }) => batchesAPI.enroll(batchId, userId),
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: KEYS.batchStudents(batchId) })
      toast.success('Student enrolled')
    },
  })
}

// ─── Classrooms ───────────────────────────────────────────────────────────────
export function useClassrooms(params?: any) {
  return useQuery({
    queryKey: KEYS.classrooms(params),
    queryFn: () => classroomsAPI.list(params).then(r => r.data.classrooms),
  })
}
export function useClassroom(id: string) {
  return useQuery({
    queryKey: KEYS.classroom(id),
    queryFn: () => classroomsAPI.get(id).then(r => r.data.classroom),
    enabled: !!id,
  })
}
export function useClassroomAttendance(id: string) {
  return useQuery({
    queryKey: KEYS.classroomAttendance(id),
    queryFn: () => classroomsAPI.attendance(id).then(r => r.data.attendance),
    enabled: !!id,
  })
}
export function useCreateClassroom() {
  return useMut((data: any) => classroomsAPI.create(data), {
    successMsg: 'Class scheduled',
    invalidate: [['classrooms']],
  })
}
export function useUpdateClassroom(id: string) {
  return useMut((data: any) => classroomsAPI.update(id, data), {
    successMsg: 'Class updated',
    invalidate: [KEYS.classroom(id), ['classrooms']],
  })
}
export function useStartClassroom() {
  return useMut((id: string) => classroomsAPI.start(id), {
    successMsg: 'Class started!',
    invalidate: [['classrooms']],
  })
}
export function useEndClassroom() {
  return useMut((id: string) => classroomsAPI.end(id), {
    successMsg: 'Class ended',
    invalidate: [['classrooms']],
  })
}

// ─── Games ────────────────────────────────────────────────────────────────────
export function useGames(params?: any) {
  return useQuery({
    queryKey: KEYS.games(params),
    queryFn: () => gamesAPI.list(params).then(r => r.data.games),
  })
}
export function useGame(id: string) {
  return useQuery({
    queryKey: KEYS.game(id),
    queryFn: () => gamesAPI.get(id).then(r => r.data.game),
    enabled: !!id,
  })
}
export function usePlayerGames(userId: string, params?: any) {
  return useQuery({
    queryKey: KEYS.userGames(userId),
    queryFn: () => gamesAPI.playerHistory(userId, params).then(r => r.data.games),
    enabled: !!userId,
  })
}
export function useCreateGame() {
  return useMut((data: any) => gamesAPI.create(data), {
    invalidate: [['games']],
  })
}
export function useAnalyzeGame() {
  return useMut((id: string) => gamesAPI.analyze(id), {
    successMsg: 'Analysis started',
    invalidate: [['game']],
  })
}

// ─── Tournaments ──────────────────────────────────────────────────────────────
export function useTournaments(params?: any) {
  return useQuery({
    queryKey: KEYS.tournaments(params),
    queryFn: () => tournamentsAPI.list(params).then(r => r.data.tournaments),
  })
}
export function useTournament(id: string) {
  return useQuery({
    queryKey: KEYS.tournament(id),
    queryFn: () => tournamentsAPI.get(id).then(r => r.data.tournament),
    enabled: !!id,
  })
}
export function useTournamentStandings(id: string) {
  return useQuery({
    queryKey: KEYS.tournamentStandings(id),
    queryFn: () => tournamentsAPI.standings(id).then(r => r.data.standings),
    enabled: !!id,
    refetchInterval: 30_000,
  })
}
export function useTournamentPlayers(id: string) {
  return useQuery({
    queryKey: KEYS.tournamentPlayers(id),
    queryFn: () => tournamentsAPI.players(id).then(r => r.data.players),
    enabled: !!id,
  })
}
export function useTournamentPairings(id: string) {
  return useQuery({
    queryKey: KEYS.tournamentPairings(id),
    queryFn: () => tournamentsAPI.pairings(id).then(r => r.data.pairings),
    enabled: !!id,
    refetchInterval: 15_000,
  })
}
export function useCreateTournament() {
  return useMut((data: any) => tournamentsAPI.create(data), {
    successMsg: 'Tournament created!',
    invalidate: [['tournaments']],
  })
}
export function useRegisterTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.register(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.tournament(id) })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
      toast.success('Registered successfully!')
    },
  })
}
export function useUnregisterTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.unregister(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.tournament(id) })
      toast.success('Unregistered')
    },
  })
}
export function useStartTournament() {
  return useMut((id: string) => tournamentsAPI.start(id), {
    successMsg: 'Tournament started!',
    invalidate: [['tournaments']],
  })
}

// ─── Assignments ──────────────────────────────────────────────────────────────
export function useAssignments(params?: any) {
  return useQuery({
    queryKey: KEYS.assignments(params),
    queryFn: () => assignmentsAPI.list(params).then(r => r.data.assignments),
  })
}
export function useAssignment(id: string) {
  return useQuery({
    queryKey: KEYS.assignment(id),
    queryFn: () => assignmentsAPI.get(id).then(r => r.data),
    enabled: !!id,
  })
}
export function useAssignmentSubmissions(id: string) {
  return useQuery({
    queryKey: KEYS.assignmentSubmissions(id),
    queryFn: () => assignmentsAPI.submissions(id).then(r => r.data.submissions),
    enabled: !!id,
  })
}
export function useCreateAssignment() {
  return useMut((data: any) => assignmentsAPI.create(data), {
    successMsg: 'Assignment created',
    invalidate: [['assignments']],
  })
}
export function useSubmitAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assignmentsAPI.submit(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.assignment(id) })
      qc.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Assignment submitted!')
    },
  })
}
export function useGradeAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assignmentsAPI.grade(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.assignmentSubmissions(id) })
      toast.success('Grade saved')
    },
  })
}

// ─── Puzzles ──────────────────────────────────────────────────────────────────
export function useDailyPuzzle() {
  return useQuery({
    queryKey: KEYS.puzzleDaily(),
    queryFn: () => puzzlesAPI.daily().then(r => r.data.puzzle),
    staleTime: 60 * 60 * 1000,
  })
}
export function useRandomPuzzle(params?: any) {
  return useQuery({
    queryKey: KEYS.puzzleRandom(params),
    queryFn: () => puzzlesAPI.random(params).then(r => r.data.puzzle),
  })
}
export function usePuzzleStats() {
  return useQuery({
    queryKey: KEYS.puzzleStats(),
    queryFn: () => puzzlesAPI.myStats().then(r => r.data.stats),
  })
}
export function useSubmitPuzzle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => puzzlesAPI.submit(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.puzzleStats() })
    },
  })
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export function useStudentAnalytics(id: string, period = '30d') {
  return useQuery({
    queryKey: KEYS.analytics('student', id, period),
    queryFn: () => analyticsAPI.student(id, { period }).then(r => r.data),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}
export function useAcademyAnalytics(id: string, period = '30d') {
  return useQuery({
    queryKey: KEYS.analytics('academy', id, period),
    queryFn: () => analyticsAPI.academy(id, { period }).then(r => r.data),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}
export function usePlatformAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'platform'],
    queryFn: () => analyticsAPI.platform().then(r => r.data),
    staleTime: 5 * 60_000,
  })
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function useNotifications(params?: any) {
  return useQuery({
    queryKey: KEYS.notifications(params),
    queryFn: () => notificationsAPI.list(params).then(r => r.data.notifications),
    refetchInterval: 30_000,
  })
}
export function useNotifCount() {
  return useQuery({
    queryKey: KEYS.notifCount(),
    queryFn: () => notificationsAPI.unreadCount().then(r => r.data.count),
    refetchInterval: 30_000,
  })
}
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: KEYS.notifCount() })
    },
  })
}
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: KEYS.notifCount() })
      toast.success('All marked as read')
    },
  })
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export function useBillingPlans() {
  return useQuery({
    queryKey: KEYS.billingPlans(),
    queryFn: () => billingAPI.plans().then(r => r.data.plans),
    staleTime: 60 * 60_000,
  })
}
export function useInvoices(academyId: string) {
  return useQuery({
    queryKey: KEYS.billing(academyId),
    queryFn: () => billingAPI.invoices(academyId).then(r => r.data.invoices),
    enabled: !!academyId,
  })
}
export function useMyInvoices() {
  return useQuery({
    queryKey: ['my-invoices'],
    queryFn: () => billingAPI.myInvoices().then(r => r.data.invoices),
  })
}

// ─── Parent ───────────────────────────────────────────────────────────────────
export function useMyChildren() {
  return useQuery({
    queryKey: KEYS.children(),
    queryFn: () => parentAPI.children().then(r => r.data.children),
  })
}
export function useChildAnalytics(childId: string) {
  return useQuery({
    queryKey: ['child-analytics', childId],
    queryFn: () => analyticsAPI.student(childId).then(r => r.data),
    enabled: !!childId,
  })
}
export function useChildAttendance(childId: string) {
  return useQuery({
    queryKey: ['child-attendance', childId],
    queryFn: () => parentAPI.childAttendance(childId).then(r => r.data.attendance),
    enabled: !!childId,
  })
}
