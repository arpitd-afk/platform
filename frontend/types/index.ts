// ─── Core Types ─────────────────────────────────────────────

export type UserRole = 'super_admin' | 'academy_admin' | 'coach' | 'student' | 'parent'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  rating: number
  academyId?: string
  academyName?: string
  avatar?: string
  bio?: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface Academy {
  id: string
  name: string
  subdomain: string
  plan: 'trial' | 'starter' | 'academy' | 'enterprise'
  isActive: boolean
  logoUrl?: string
  maxStudents: number
  studentCount?: number
  coachCount?: number
  monthlyRevenue?: number
  createdAt: string
  ownerName?: string
}

export interface Batch {
  id: string
  academyId: string
  coachId: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  maxStudents: number
  studentCount?: number
  coachName?: string
  isActive: boolean
  schedule?: string
}

export interface Classroom {
  id: string
  academyId: string
  batchId: string
  coachId: string
  title: string
  description?: string
  scheduledAt: string
  durationMin: number
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  boardFen?: string
  pgn?: string
  recordingUrl?: string
  coachName?: string
  batchName?: string
  attendeeCount?: number
}

export interface Game {
  id: string
  whitePlayerId: string
  blackPlayerId: string
  whitePlayerName?: string
  blackPlayerName?: string
  status: 'pending' | 'active' | 'completed' | 'abandoned'
  result?: 'white' | 'black' | 'draw' | null
  pgn?: string
  fen?: string
  timeControl?: string
  whiteRatingBefore?: number
  blackRatingBefore?: number
  whiteRatingAfter?: number
  blackRatingAfter?: number
  createdAt: string
  endedAt?: string
  moveCount?: number
}

export interface Tournament {
  id: string
  academyId: string
  name: string
  format: 'swiss' | 'round_robin' | 'arena' | 'knockout'
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  timeControl: string
  rounds: number
  currentRound: number
  maxPlayers: number
  playerCount?: number
  isPublic: boolean
  startsAt: string
  prizePool?: number
  organizerName?: string
  isRegistered?: boolean
  myRank?: number
  myPoints?: number
}

export interface TournamentStanding {
  rank: number
  userId: string
  playerName: string
  rating: number
  points: number
  tiebreak1: number
  wins: number
  draws: number
  losses: number
}

export interface Assignment {
  id: string
  title: string
  description: string
  type: 'opening' | 'tactics' | 'endgame' | 'analysis' | 'game_play'
  coachId: string
  coachName?: string
  batchId?: string
  studentId?: string
  dueDate: string
  status: 'active' | 'completed'
  submissionCount?: number
  totalCount?: number
  // student view
  submissionStatus?: 'pending' | 'submitted' | 'graded' | 'overdue'
  grade?: number
  feedback?: string
  submittedAt?: string
}

export interface Puzzle {
  id: string
  fen: string
  moves: string
  rating: number
  themes: string[]
  nbPlays: number
}

export interface PuzzleAttempt {
  puzzleId: string
  isCorrect: boolean
  timeTaken: number
  movesPlayed: string[]
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

export interface RatingHistory {
  date: string
  rating: number
  gameId?: string
}

export interface StudentStats {
  rating: number
  totalGames: number
  wins: number
  draws: number
  losses: number
  winRate: number
  puzzlesSolved: number
  puzzleAccuracy: number
  attendanceRate: number
  homeworkRate: number
  ratingHistory: RatingHistory[]
}

export interface Invoice {
  id: string
  academyId: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue'
  period: string
  paidAt?: string
  dueDate: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  maxStudents: number
  features: string[]
}

// ─── API Response Types ──────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Form Types ──────────────────────────────────────────────

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  role: UserRole
  academyName?: string
  academySubdomain?: string
}

export interface CreateClassroomForm {
  title: string
  description?: string
  batchId: string
  scheduledAt: string
  durationMin: number
}

export interface CreateTournamentForm {
  name: string
  format: Tournament['format']
  timeControl: string
  rounds: number
  maxPlayers: number
  isPublic: boolean
  startsAt: string
  prizePool?: number
}

export interface CreateAssignmentForm {
  title: string
  description: string
  type: Assignment['type']
  batchId?: string
  studentId?: string
  dueDate: string
}

export interface SubmitAssignmentForm {
  content: string
  pgn?: string
  screenshotUrl?: string
}
