-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "academies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "subdomain" VARCHAR(100) NOT NULL,
    "owner_id" UUID,
    "plan" VARCHAR(50) DEFAULT 'trial',
    "is_active" BOOLEAN DEFAULT true,
    "logo_url" TEXT,
    "theme" JSONB DEFAULT '{}',
    "settings" JSONB DEFAULT '{}',
    "max_students" INTEGER DEFAULT 50,
    "trial_ends_at" TIMESTAMPTZ,
    "subscription_ends_at" TIMESTAMPTZ,
    "stripe_customer_id" VARCHAR(200),
    "stripe_subscription_id" VARCHAR(200),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(300) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "academy_id" UUID,
    "rating" INTEGER DEFAULT 1200,
    "rating_deviation" INTEGER DEFAULT 350,
    "avatar" TEXT,
    "bio" TEXT,
    "date_of_birth" DATE,
    "phone" VARCHAR(30),
    "is_active" BOOLEAN DEFAULT true,
    "email_verified" BOOLEAN DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "reset_token" VARCHAR(200),
    "reset_token_expires" TIMESTAMPTZ,
    "preferences" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "assigned_coach_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student" (
    "parent_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "parent_student_pkey" PRIMARY KEY ("parent_id","student_id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "coach_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "level" VARCHAR(50) DEFAULT 'beginner',
    "max_students" INTEGER DEFAULT 20,
    "schedule" TEXT DEFAULT '',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_enrollments" (
    "batch_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "enrolled_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "batch_enrollments_pkey" PRIMARY KEY ("batch_id","student_id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "batch_id" UUID,
    "coach_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "duration_min" INTEGER DEFAULT 60,
    "status" VARCHAR(50) DEFAULT 'scheduled',
    "board_fen" TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    "pgn" TEXT DEFAULT '',
    "recording_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_attendance" (
    "classroom_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ,
    "left_at" TIMESTAMPTZ,
    "duration_min" INTEGER DEFAULT 0,

    CONSTRAINT "classroom_attendance_pkey" PRIMARY KEY ("classroom_id","student_id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "white_player_id" UUID,
    "black_player_id" UUID,
    "fen" TEXT NOT NULL,
    "pgn" TEXT DEFAULT '',
    "opening_name" VARCHAR(200),
    "opening_eco" VARCHAR(10),
    "status" VARCHAR(50) DEFAULT 'waiting',
    "result" JSONB,
    "white_rating_before" INTEGER,
    "black_rating_before" INTEGER,
    "white_rating_after" INTEGER,
    "black_rating_after" INTEGER,
    "time_control" VARCHAR(50) DEFAULT '10+5',
    "white_time_ms" INTEGER DEFAULT 600000,
    "black_time_ms" INTEGER DEFAULT 600000,
    "increment_ms" INTEGER DEFAULT 5000,
    "mode" VARCHAR(50) DEFAULT 'casual',
    "tournament_id" UUID,
    "classroom_id" UUID,
    "analysis" JSONB,
    "anti_cheat_score" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "organizer_id" UUID,
    "name" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "format" VARCHAR(50) DEFAULT 'swiss',
    "status" VARCHAR(50) DEFAULT 'upcoming',
    "is_public" BOOLEAN DEFAULT true,
    "time_control" VARCHAR(50) DEFAULT '10+5',
    "rounds" INTEGER DEFAULT 5,
    "current_round" INTEGER DEFAULT 0,
    "max_players" INTEGER DEFAULT 64,
    "min_rating" INTEGER,
    "max_rating" INTEGER,
    "entry_fee" DECIMAL(10,2) DEFAULT 0,
    "prize_pool" DECIMAL(10,2) DEFAULT 0,
    "prize_structure" JSONB DEFAULT '[]',
    "starts_at" TIMESTAMPTZ,
    "ends_at" TIMESTAMPTZ,
    "registration_ends_at" TIMESTAMPTZ,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_registrations" (
    "tournament_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "seed" INTEGER,
    "is_confirmed" BOOLEAN DEFAULT true,
    "registered_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("tournament_id","player_id")
);

-- CreateTable
CREATE TABLE "tournament_standings" (
    "tournament_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "rank" INTEGER,
    "score" DECIMAL(5,1) DEFAULT 0,
    "tiebreak1" DECIMAL(8,2) DEFAULT 0,
    "tiebreak2" DECIMAL(8,2) DEFAULT 0,
    "wins" INTEGER DEFAULT 0,
    "draws" INTEGER DEFAULT 0,
    "losses" INTEGER DEFAULT 0,

    CONSTRAINT "tournament_standings_pkey" PRIMARY KEY ("tournament_id","player_id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID,
    "batch_id" UUID,
    "student_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) DEFAULT 'puzzle',
    "content" JSONB DEFAULT '{}',
    "due_date" TIMESTAMPTZ,
    "max_attempts" INTEGER DEFAULT 3,
    "is_auto_graded" BOOLEAN DEFAULT true,
    "passing_score" INTEGER DEFAULT 70,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "attempt_number" INTEGER DEFAULT 1,
    "submission" JSONB DEFAULT '{}',
    "score" INTEGER,
    "feedback" TEXT,
    "graded_by" UUID,
    "submitted_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "graded_at" TIMESTAMPTZ,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" VARCHAR(50) NOT NULL,
    "fen" TEXT NOT NULL,
    "moves" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 1200,
    "rating_deviation" INTEGER DEFAULT 80,
    "popularity" INTEGER DEFAULT 0,
    "nb_plays" INTEGER DEFAULT 0,
    "themes" TEXT[],
    "game_url" TEXT,
    "opening_tags" TEXT[],
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzle_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "puzzle_id" VARCHAR(50) NOT NULL,
    "user_id" UUID NOT NULL,
    "is_correct" BOOLEAN,
    "time_taken_ms" INTEGER,
    "attempted_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puzzle_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "author_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "content" JSONB DEFAULT '{}',
    "pgn" TEXT DEFAULT '',
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "level" VARCHAR(50) DEFAULT 'beginner',
    "tags" TEXT[],
    "is_published" BOOLEAN DEFAULT false,
    "order_index" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "level" VARCHAR(50) DEFAULT 'beginner',
    "price" DECIMAL(10,2) DEFAULT 0,
    "is_published" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "course_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "order_index" INTEGER DEFAULT 0,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("course_id","lesson_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "body" TEXT,
    "data" JSONB DEFAULT '{}',
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'INR',
    "status" VARCHAR(50) DEFAULT 'pending',
    "plan" VARCHAR(50),
    "billing_period_start" TIMESTAMPTZ,
    "billing_period_end" TIMESTAMPTZ,
    "payment_id" VARCHAR(200),
    "razorpay_order_id" VARCHAR(100),
    "razorpay_payment_id" VARCHAR(100),
    "invoice_url" TEXT,
    "gst_number" VARCHAR(50),
    "gst_amount" DECIMAL(10,2),
    "description" TEXT,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheat_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "game_id" UUID,
    "reported_user" UUID,
    "reporter_id" UUID,
    "engine_similarity" DOUBLE PRECISION,
    "suspicious_moves" TEXT[],
    "status" VARCHAR(50) DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cheat_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "game_id" UUID,
    "rating" INTEGER NOT NULL,
    "change" INTEGER NOT NULL,
    "recorded_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "author_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "body" TEXT NOT NULL,
    "target_role" VARCHAR(50),
    "is_pinned" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "price_monthly" DECIMAL(10,2),
    "price_yearly" DECIMAL(10,2),
    "max_students" INTEGER,
    "max_coaches" INTEGER,
    "features" JSONB DEFAULT '[]',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" UUID,
    "receiver_id" UUID,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "completed" BOOLEAN DEFAULT false,
    "watched_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("user_id","lesson_id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "actor_name" TEXT,
    "actor_role" TEXT,
    "academy_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "metadata" JSONB DEFAULT '{}',
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "board_number" INTEGER DEFAULT 1,
    "white_id" UUID,
    "black_id" UUID,
    "is_bye" BOOLEAN DEFAULT false,
    "result" VARCHAR(20),
    "white_score" DECIMAL(3,1),
    "black_score" DECIMAL(3,1),
    "status" VARCHAR(20) DEFAULT 'pending',
    "game_id" UUID,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_puzzles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "created_by" UUID,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "fen" TEXT NOT NULL,
    "solution_moves" TEXT NOT NULL,
    "solution_pgn" TEXT,
    "difficulty" VARCHAR(50) DEFAULT 'intermediate',
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hint" TEXT,
    "is_published" BOOLEAN DEFAULT false,
    "times_solved" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_puzzle_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "puzzle_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "moves_played" TEXT,
    "time_taken_ms" INTEGER,
    "attempted_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_puzzle_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID,
    "created_by" UUID,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "fen" TEXT,
    "difficulty" VARCHAR(50) DEFAULT 'intermediate',
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_published" BOOLEAN DEFAULT false,
    "allow_multiple" BOOLEAN DEFAULT false,
    "points" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcq_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN DEFAULT false,
    "order_index" INTEGER DEFAULT 0,

    CONSTRAINT "mcq_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "selected_option_ids" UUID[],
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "points_earned" INTEGER DEFAULT 0,
    "time_taken_ms" INTEGER,
    "attempted_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcq_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID,
    "sender_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_number" VARCHAR(50) NOT NULL,
    "academy_id" UUID,
    "student_id" UUID,
    "batch_id" UUID,
    "status" VARCHAR(20) DEFAULT 'draft',
    "currency" VARCHAR(10) DEFAULT 'INR',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) DEFAULT 18.00,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(10,2) DEFAULT 0,
    "line_items" JSONB DEFAULT '[]',
    "notes" TEXT,
    "due_date" DATE,
    "period_from" DATE,
    "period_to" DATE,
    "paid_at" TIMESTAMPTZ,
    "payment_method" VARCHAR(50),
    "payment_ref" VARCHAR(200),
    "issued_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academies_subdomain_key" ON "academies"("subdomain");

-- CreateIndex
CREATE INDEX "idx_academies_subdomain" ON "academies"("subdomain");

-- CreateIndex
CREATE INDEX "idx_academies_owner" ON "academies"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_academy" ON "users"("academy_id");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_assigned_coach" ON "users"("assigned_coach_id");

-- CreateIndex
CREATE INDEX "idx_users_rating_desc" ON "users"("rating" DESC);

-- CreateIndex
CREATE INDEX "idx_parent_student_student" ON "parent_student"("student_id");

-- CreateIndex
CREATE INDEX "idx_batches_academy" ON "batches"("academy_id");

-- CreateIndex
CREATE INDEX "idx_batches_coach" ON "batches"("coach_id");

-- CreateIndex
CREATE INDEX "idx_batch_enrollments_student" ON "batch_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_academy" ON "classrooms"("academy_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_coach" ON "classrooms"("coach_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_scheduled" ON "classrooms"("scheduled_at");

-- CreateIndex
CREATE INDEX "idx_classroom_attendance_student" ON "classroom_attendance"("student_id");

-- CreateIndex
CREATE INDEX "idx_games_white" ON "games"("white_player_id");

-- CreateIndex
CREATE INDEX "idx_games_black" ON "games"("black_player_id");

-- CreateIndex
CREATE INDEX "idx_games_tournament" ON "games"("tournament_id");

-- CreateIndex
CREATE INDEX "idx_games_status" ON "games"("status");

-- CreateIndex
CREATE INDEX "idx_games_created" ON "games"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_games_players_status" ON "games"("white_player_id", "black_player_id", "status");

-- CreateIndex
CREATE INDEX "idx_tournaments_academy" ON "tournaments"("academy_id");

-- CreateIndex
CREATE INDEX "idx_tournaments_status" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "idx_assignment_submissions_student" ON "assignment_submissions"("student_id");

-- CreateIndex
CREATE INDEX "idx_puzzles_rating" ON "puzzles"("rating");

-- CreateIndex
CREATE INDEX "idx_puzzle_attempts_user" ON "puzzle_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_rating_history_user" ON "rating_history"("user_id", "recorded_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "idx_messages_sender" ON "messages"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_messages_receiver" ON "messages"("receiver_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_academy" ON "activity_logs"("academy_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_actor" ON "activity_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_tournament_matches_tournament" ON "tournament_matches"("tournament_id");

-- CreateIndex
CREATE INDEX "idx_tournament_matches_round" ON "tournament_matches"("tournament_id", "round");

-- CreateIndex
CREATE INDEX "idx_custom_puzzles_academy" ON "custom_puzzles"("academy_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_puzzle_attempts_puzzle_id_user_id_key" ON "custom_puzzle_attempts"("puzzle_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mcq_attempts_question_id_user_id_key" ON "mcq_attempts"("question_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_batch_messages_batch" ON "batch_messages"("batch_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "student_invoices_invoice_number_key" ON "student_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_student_invoices_academy" ON "student_invoices"("academy_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_student_invoices_student" ON "student_invoices"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_student_invoices_status" ON "student_invoices"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_coach_id_fkey" FOREIGN KEY ("assigned_coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_attendance" ADD CONSTRAINT "classroom_attendance_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_attendance" ADD CONSTRAINT "classroom_attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_white_player_id_fkey" FOREIGN KEY ("white_player_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_black_player_id_fkey" FOREIGN KEY ("black_player_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "puzzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheat_reports" ADD CONSTRAINT "cheat_reports_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheat_reports" ADD CONSTRAINT "cheat_reports_reported_user_fkey" FOREIGN KEY ("reported_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheat_reports" ADD CONSTRAINT "cheat_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_puzzles" ADD CONSTRAINT "custom_puzzles_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_puzzles" ADD CONSTRAINT "custom_puzzles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_puzzle_attempts" ADD CONSTRAINT "custom_puzzle_attempts_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "custom_puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_puzzle_attempts" ADD CONSTRAINT "custom_puzzle_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_questions" ADD CONSTRAINT "mcq_questions_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_questions" ADD CONSTRAINT "mcq_questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_options" ADD CONSTRAINT "mcq_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "mcq_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_attempts" ADD CONSTRAINT "mcq_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "mcq_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_attempts" ADD CONSTRAINT "mcq_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_messages" ADD CONSTRAINT "batch_messages_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_messages" ADD CONSTRAINT "batch_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoices" ADD CONSTRAINT "student_invoices_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoices" ADD CONSTRAINT "student_invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoices" ADD CONSTRAINT "student_invoices_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

