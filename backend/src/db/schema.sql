-- ============================================================
-- Chess Academy Pro — Database Schema
-- PostgreSQL 15+
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy search (available on Neon)

-- ─── ACADEMIES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  subdomain     VARCHAR(100) UNIQUE NOT NULL,
  owner_id      UUID,
  plan          VARCHAR(50) DEFAULT 'trial' CHECK (plan IN ('trial','starter','academy','enterprise')),
  is_active     BOOLEAN DEFAULT true,
  logo_url      TEXT,
  theme         JSONB DEFAULT '{}',
  settings      JSONB DEFAULT '{}',
  max_students  INT DEFAULT 50,
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  stripe_customer_id   VARCHAR(200),
  stripe_subscription_id VARCHAR(200),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_academies_subdomain ON academies(subdomain);
CREATE INDEX idx_academies_owner ON academies(owner_id);

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  email         VARCHAR(300) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(50) NOT NULL CHECK (role IN ('super_admin','academy_admin','coach','student','parent')),
  academy_id    UUID REFERENCES academies(id) ON DELETE SET NULL,
  rating        INT DEFAULT 1200,
  rating_deviation INT DEFAULT 350,
  avatar        TEXT,
  bio           TEXT,
  date_of_birth DATE,
  phone         VARCHAR(30),
  is_active     BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  reset_token   VARCHAR(200),
  reset_token_expires TIMESTAMPTZ,
  preferences   JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_academy ON users(academy_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_name_trgm ON users USING gin(name gin_trgm_ops);

-- ─── STUDENT-PARENT RELATIONSHIPS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_student (
  parent_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- ─── BATCHES / CLASSES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID REFERENCES academies(id) ON DELETE CASCADE,
  coach_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  level         VARCHAR(50) DEFAULT 'beginner',
  max_students  INT DEFAULT 20,
  schedule      JSONB DEFAULT '[]', -- Array of {day, start_time, end_time}
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_batches_academy ON batches(academy_id);
CREATE INDEX idx_batches_coach ON batches(coach_id);

CREATE TABLE IF NOT EXISTS batch_enrollments (
  batch_id    UUID REFERENCES batches(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT true,
  PRIMARY KEY (batch_id, student_id)
);

-- ─── CLASSROOMS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classrooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID REFERENCES academies(id) ON DELETE CASCADE,
  batch_id      UUID REFERENCES batches(id) ON DELETE SET NULL,
  coach_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  duration_min  INT DEFAULT 60,
  status        VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  board_fen     TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn           TEXT DEFAULT '',
  recording_url TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classrooms_academy ON classrooms(academy_id);
CREATE INDEX idx_classrooms_coach ON classrooms(coach_id);
CREATE INDEX idx_classrooms_scheduled ON classrooms(scheduled_at);

CREATE TABLE IF NOT EXISTS classroom_attendance (
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ,
  left_at      TIMESTAMPTZ,
  duration_min INT DEFAULT 0,
  PRIMARY KEY (classroom_id, student_id)
);

-- ─── GAMES ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS games (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_player_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  black_player_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  fen               TEXT NOT NULL,
  pgn               TEXT DEFAULT '',
  opening_name      VARCHAR(200),
  opening_eco       VARCHAR(10),
  status            VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting','active','completed','aborted')),
  result            JSONB, -- {winner: 'white'|'black'|null, reason: string}
  white_rating_before INT,
  black_rating_before INT,
  white_rating_after  INT,
  black_rating_after  INT,
  time_control      VARCHAR(50) DEFAULT '10+5',
  white_time_ms     INT DEFAULT 600000,
  black_time_ms     INT DEFAULT 600000,
  increment_ms      INT DEFAULT 5000,
  mode              VARCHAR(50) DEFAULT 'casual' CHECK (mode IN ('casual','rated','practice','ai','tournament','classroom')),
  tournament_id     UUID,
  classroom_id      UUID,
  analysis          JSONB, -- Stockfish analysis results
  anti_cheat_score  FLOAT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_white ON games(white_player_id);
CREATE INDEX idx_games_black ON games(black_player_id);
CREATE INDEX idx_games_tournament ON games(tournament_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created ON games(created_at DESC);

-- ─── TOURNAMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tournaments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID REFERENCES academies(id) ON DELETE CASCADE,
  organizer_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  name            VARCHAR(300) NOT NULL,
  description     TEXT,
  format          VARCHAR(50) DEFAULT 'swiss' CHECK (format IN ('swiss','round_robin','arena','knockout')),
  status          VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming','registration','live','completed','cancelled')),
  is_public       BOOLEAN DEFAULT true,
  time_control    VARCHAR(50) DEFAULT '10+5',
  rounds          INT DEFAULT 5,
  current_round   INT DEFAULT 0,
  max_players     INT DEFAULT 64,
  min_rating      INT,
  max_rating      INT,
  entry_fee       DECIMAL(10,2) DEFAULT 0,
  prize_pool      DECIMAL(10,2) DEFAULT 0,
  prize_structure JSONB DEFAULT '[]',
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  registration_ends_at TIMESTAMPTZ,
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_academy ON tournaments(academy_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  seed          INT,
  is_confirmed  BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tournament_id, player_id)
);

CREATE TABLE IF NOT EXISTS tournament_standings (
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  rank          INT,
  score         DECIMAL(5,1) DEFAULT 0,
  tiebreak1     DECIMAL(8,2) DEFAULT 0, -- Buchholz
  tiebreak2     DECIMAL(8,2) DEFAULT 0, -- Sonneborn-Berger
  wins          INT DEFAULT 0,
  draws         INT DEFAULT 0,
  losses        INT DEFAULT 0,
  PRIMARY KEY (tournament_id, player_id)
);

-- ─── ASSIGNMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  batch_id      UUID REFERENCES batches(id) ON DELETE SET NULL,
  student_id    UUID REFERENCES users(id) ON DELETE SET NULL, -- If assigned to individual
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  type          VARCHAR(50) DEFAULT 'puzzle' CHECK (type IN ('puzzle','opening','endgame','game_analysis','video','custom')),
  content       JSONB DEFAULT '{}',
  due_date      TIMESTAMPTZ,
  max_attempts  INT DEFAULT 3,
  is_auto_graded BOOLEAN DEFAULT true,
  passing_score  INT DEFAULT 70,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INT DEFAULT 1,
  submission    JSONB DEFAULT '{}',
  score         INT,
  feedback      TEXT,
  graded_by     UUID REFERENCES users(id),
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  graded_at     TIMESTAMPTZ
);

-- ─── PUZZLES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS puzzles (
  id            VARCHAR(50) PRIMARY KEY,
  fen           TEXT NOT NULL,
  moves         TEXT NOT NULL, -- Space-separated UCI moves
  rating        INT DEFAULT 1200,
  rating_deviation INT DEFAULT 80,
  popularity    INT DEFAULT 0,
  nb_plays      INT DEFAULT 0,
  themes        TEXT[], -- Array of theme tags
  game_url      TEXT,
  opening_tags  TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_puzzles_rating ON puzzles(rating);
CREATE INDEX idx_puzzles_themes ON puzzles USING gin(themes);

CREATE TABLE IF NOT EXISTS puzzle_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id     VARCHAR(50) REFERENCES puzzles(id),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  is_correct    BOOLEAN,
  time_taken_ms INT,
  attempted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTENT / LESSONS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID REFERENCES academies(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  content       JSONB DEFAULT '{}',
  pgn           TEXT DEFAULT '',
  video_url     TEXT,
  thumbnail_url TEXT,
  level         VARCHAR(50) DEFAULT 'beginner',
  tags          TEXT[],
  is_published  BOOLEAN DEFAULT false,
  order_index   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID REFERENCES academies(id) ON DELETE CASCADE,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  level         VARCHAR(50) DEFAULT 'beginner',
  price         DECIMAL(10,2) DEFAULT 0,
  is_published  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id   UUID REFERENCES lessons(id) ON DELETE CASCADE,
  order_index INT DEFAULT 0,
  PRIMARY KEY (course_id, lesson_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(300) NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ─── BILLING ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID REFERENCES academies(id) ON DELETE CASCADE,
  amount        DECIMAL(10,2) NOT NULL,
  currency      VARCHAR(10) DEFAULT 'INR',
  status        VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  plan          VARCHAR(50),
  billing_period_start TIMESTAMPTZ,
  billing_period_end   TIMESTAMPTZ,
  payment_id    VARCHAR(200),
  razorpay_order_id   VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  invoice_url   TEXT,
  gst_number    VARCHAR(50),
  gst_amount    DECIMAL(10,2),
  description   TEXT,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANTI-CHEAT ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cheat_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       UUID REFERENCES games(id) ON DELETE CASCADE,
  reported_user UUID REFERENCES users(id) ON DELETE CASCADE,
  reporter_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  engine_similarity FLOAT,
  suspicious_moves TEXT[],
  status        VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','reviewed','confirmed','dismissed')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RATING HISTORY ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rating_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id     UUID REFERENCES games(id) ON DELETE SET NULL,
  rating      INT NOT NULL,
  change      INT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rating_history_user ON rating_history(user_id, recorded_at DESC);

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  UUID REFERENCES academies(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  title       VARCHAR(300) NOT NULL,
  body        TEXT NOT NULL,
  target_role VARCHAR(50), -- null = all
  is_pinned   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTION PLANS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly  DECIMAL(10,2),
  max_students  INT,
  max_coaches   INT,
  features      JSONB DEFAULT '[]',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default plans
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, max_students, max_coaches, features)
VALUES
  ('Starter', 'starter', 2999, 29990, 50, 2, '["live_classroom","basic_analytics","puzzle_trainer","email_support"]'),
  ('Academy', 'academy', 9999, 99990, 500, 20, '["live_classroom","advanced_analytics","ai_analysis","tournaments","parent_dashboard","custom_subdomain","priority_support"]'),
  ('Enterprise', 'enterprise', NULL, NULL, -1, -1, '["all_features","white_label","custom_domain","api_access","dedicated_server","sla","24x7_support"]')
ON CONFLICT (slug) DO NOTHING;

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_academies_updated_at
  BEFORE UPDATE ON academies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, is_read, created_at DESC);

-- ─── LESSON PROGRESS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed  BOOLEAN DEFAULT false,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name  TEXT,
  actor_role  TEXT,
  academy_id  UUID REFERENCES academies(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_academy ON activity_logs(academy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor  ON activity_logs(actor_id, created_at DESC);

-- ─── TOURNAMENT MATCHES ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tournament_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  round           INT NOT NULL,
  board_number    INT DEFAULT 1,
  white_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  black_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  is_bye          BOOLEAN DEFAULT false,
  result          VARCHAR(20) CHECK (result IN ('white','black','draw','forfeit_white','forfeit_black')),
  white_score     DECIMAL(3,1),
  black_score     DECIMAL(3,1),
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  game_id         UUID REFERENCES games(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round);

-- ─── Ensure tournament status includes 'registration' ────────────────────────
-- Run manually if upgrading from previous version:
-- ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
-- ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check
--   CHECK (status IN ('upcoming','registration','live','completed','cancelled'));

-- ─── INVOICE UPDATES (Razorpay fields) ───────────────────────────────────────
-- Run if upgrading from a version without these columns:
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ─── CUSTOM PUZZLES (coach-created) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_puzzles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID REFERENCES academies(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  fen           TEXT NOT NULL,
  solution_moves TEXT NOT NULL,        -- space-separated UCI e.g. "e2e4 d7d5"
  solution_pgn  TEXT,                  -- human-readable SAN for display
  difficulty    VARCHAR(50) DEFAULT 'intermediate',
  themes        TEXT[] DEFAULT '{}',
  hint          TEXT,
  is_published  BOOLEAN DEFAULT false,
  times_solved  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custom_puzzles_academy ON custom_puzzles(academy_id);

CREATE TABLE IF NOT EXISTS custom_puzzle_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id     UUID REFERENCES custom_puzzles(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  is_correct    BOOLEAN NOT NULL DEFAULT false,
  moves_played  TEXT,
  time_taken_ms INT,
  attempted_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(puzzle_id, user_id)           -- one attempt per student per puzzle (can upsert)
);

-- ─── MCQ QUESTIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mcq_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID REFERENCES academies(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  question      TEXT NOT NULL,
  explanation   TEXT,                  -- shown after submission
  fen           TEXT,                  -- optional chess position image
  difficulty    VARCHAR(50) DEFAULT 'intermediate',
  topics        TEXT[] DEFAULT '{}',
  is_published  BOOLEAN DEFAULT false,
  allow_multiple BOOLEAN DEFAULT false, -- true = select all that apply
  points        INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcq_options (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID REFERENCES mcq_questions(id) ON DELETE CASCADE,
  option_text   TEXT NOT NULL,
  is_correct    BOOLEAN DEFAULT false,
  order_index   INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mcq_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID REFERENCES mcq_questions(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  selected_option_ids UUID[],
  is_correct    BOOLEAN NOT NULL DEFAULT false,
  points_earned INT DEFAULT 0,
  time_taken_ms INT,
  attempted_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- ─── PUZZLE LEADERBOARD VIEW ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW puzzle_leaderboard AS
SELECT
  u.id AS user_id,
  u.name,
  u.avatar,
  u.academy_id,
  u.rating,
  -- Lichess puzzles solved
  COUNT(DISTINCT pa.id) FILTER (WHERE pa.is_correct) AS lichess_solved,
  -- Custom puzzles solved
  COUNT(DISTINCT cpa.id) FILTER (WHERE cpa.is_correct) AS custom_solved,
  -- MCQ points
  COALESCE(SUM(ma.points_earned), 0) AS mcq_points,
  -- Total score
  COUNT(DISTINCT pa.id) FILTER (WHERE pa.is_correct)
    + COUNT(DISTINCT cpa.id) FILTER (WHERE cpa.is_correct)
    + COALESCE(SUM(ma.points_earned), 0) AS total_score
FROM users u
LEFT JOIN puzzle_attempts pa ON pa.user_id = u.id
LEFT JOIN custom_puzzle_attempts cpa ON cpa.user_id = u.id
LEFT JOIN mcq_attempts ma ON ma.user_id = u.id
WHERE u.role = 'student' AND u.is_active = true
GROUP BY u.id, u.name, u.avatar, u.academy_id, u.rating;


-- ─── BATCH GROUP MESSAGES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batch_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    UUID REFERENCES batches(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batch_messages_batch ON batch_messages(batch_id, created_at DESC);