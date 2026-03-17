export type UserRole = 'super_admin' | 'academy_admin' | 'coach' | 'student' | 'parent';

export interface Academy {
  id: string;
  name: string;
  subdomain: string;
  owner_id?: string;
  plan: 'trial' | 'starter' | 'academy' | 'enterprise';
  is_active: boolean;
  logo_url?: string;
  theme: Record<string, any>;
  settings: Record<string, any>;
  max_students: number;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  academy_id?: string;
  rating: number;
  rating_deviation: number;
  avatar?: string;
  bio?: string;
  date_of_birth?: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
  assigned_coach_id?: string;
}

export interface Game {
  id: string;
  white_player_id?: string;
  black_player_id?: string;
  fen: string;
  pgn: string;
  opening_name?: string;
  opening_eco?: string;
  status: 'waiting' | 'active' | 'completed' | 'aborted';
  result?: {
    winner: 'white' | 'black' | null;
    reason: string;
  };
  white_rating_before?: number;
  black_rating_before?: number;
  white_rating_after?: number;
  black_rating_after?: number;
  time_control: string;
  white_time_ms: number;
  black_time_ms: number;
  increment_ms: number;
  mode: 'casual' | 'rated' | 'practice' | 'ai' | 'tournament' | 'classroom';
  tournament_id?: string;
  classroom_id?: string;
  analysis?: any;
  anti_cheat_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Classroom {
  id: string;
  academy_id: string;
  batch_id?: string;
  coach_id?: string;
  title: string;
  description?: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  duration_min: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  board_fen: string;
  pgn: string;
  created_at: string;
}

export interface Batch {
  id: string;
  academy_id: string;
  coach_id?: string;
  name: string;
  description?: string;
  level: string;
  max_students: number;
  schedule: string;
  is_active: boolean;
  created_at: string;
}

export interface Tournament {
  id: string;
  academy_id: string;
  organizer_id: string;
  name: string;
  description?: string;
  format: 'swiss' | 'round_robin' | 'knockout' | 'arena';
  status: 'registration' | 'upcoming' | 'live' | 'completed' | 'cancelled';
  starts_at: string;
  ends_at?: string;
  registration_deadline?: string;
  max_players: number;
  time_control: string;
  rounds: number;
  current_round: number;
  is_public: boolean;
  prize_pool: number;
  entry_fee: number;
  created_at: string;
}

export interface TournamentRegistration {
  tournament_id: string;
  player_id: string;
  registered_at: string;
  status: 'active' | 'withdrawn' | 'disqualified';
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  board_number: number;
  white_id?: string;
  black_id?: string;
  white_score?: number;
  black_score?: number;
  result?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  is_bye: boolean;
  game_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface TournamentStanding {
  tournament_id: string;
  player_id: string;
  rank: number;
  score: number;
  tiebreak1: number;
  tiebreak2: number;
  wins: number;
  draws: number;
  losses: number;
  updated_at: string;
}

export interface Puzzle {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  rating_deviation: number;
  popularity: number;
  nb_plays: number;
  themes: string[];
  game_url: string;
  opening_tags?: string[];
}

export interface CustomPuzzle {
  id: string;
  academy_id: string;
  created_by: string;
  title: string;
  description?: string;
  fen: string;
  solution_moves: string;
  solution_pgn?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  themes: string[];
  hint?: string;
  is_published: boolean;
  times_solved: number;
  created_at: string;
}

export interface MCQQuestion {
  id: string;
  academy_id: string;
  created_by: string;
  question: string;
  explanation?: string;
  fen?: string;
  difficulty: string;
  topics: string[];
  is_published: boolean;
  allow_multiple: boolean;
  points: number;
  created_at: string;
  options?: MCQOption[];
}

export interface MCQOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}
