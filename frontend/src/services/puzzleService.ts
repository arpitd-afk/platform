import { v4 as uuidv4 } from "uuid";
import { query, transaction } from "../lib/db";
import { CustomPuzzle, MCQQuestion, Puzzle } from "../types/models";

export class PuzzleService {
  /**
   * Get user puzzle stats
   */
  static async getStats(userId: string) {
    const result = await query(
      `SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_correct) as correct,
        ROUND(100.0*COUNT(*) FILTER (WHERE is_correct)/NULLIF(COUNT(*),0),1) as accuracy,
        COUNT(DISTINCT DATE(attempted_at)) as days_practiced,
        MAX(attempted_at) as last_attempted
       FROM puzzle_attempts WHERE user_id=$1`,
      [userId],
    );
    return result.rows[0];
  }

  /**
   * Get user puzzle history
   */
  static async getHistory(userId: string, limit: number = 20) {
    const result = await query(
      `SELECT pa.*, p.fen, p.rating as puzzle_rating, p.themes
       FROM puzzle_attempts pa JOIN puzzles p ON pa.puzzle_id=p.id
       WHERE pa.user_id=$1 ORDER BY pa.attempted_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  /**
   * Get academy leaderboard
   */
  static async getLeaderboard(academyId: string, limit: number = 50) {
    const result = await query(
      `SELECT * FROM puzzle_leaderboard
       WHERE academy_id = $1
       ORDER BY total_score DESC, lichess_solved DESC
       LIMIT $2`,
      [academyId, limit],
    );
    return result.rows;
  }

  /**
   * Get user rank in academy
   */
  static async getMyRank(userId: string, academyId: string) {
    const result = await query(
      `SELECT rank, total_score, lichess_solved, custom_solved, mcq_points
       FROM (
         SELECT *, RANK() OVER (ORDER BY total_score DESC) AS rank
         FROM puzzle_leaderboard WHERE academy_id = $1
       ) ranked
       WHERE user_id = $2`,
      [academyId, userId],
    );
    return result.rows[0] || null;
  }

  /**
   * Get custom puzzles for academy
   */
  static async getCustomPuzzles(params: {
    academyId: string;
    userId: string;
    role: string;
    difficulty?: string;
    theme?: string;
  }) {
    const { academyId, userId, role, difficulty, theme } = params;
    const isCoach = ["coach", "academy_admin", "super_admin"].includes(role);

    const conditions = [
      "(cp.academy_id = $1 OR (cp.academy_id IS NULL AND cp.created_by = $2))",
    ];
    const queryParams: any[] = [academyId, userId];

    if (!isCoach) conditions.push("cp.is_published = true");
    if (difficulty) {
      queryParams.push(difficulty);
      conditions.push(`cp.difficulty = $${queryParams.length}`);
    }
    if (theme) {
      queryParams.push(`{${theme}}`);
      conditions.push(`cp.themes && $${queryParams.length}`);
    }

    const result = await query(
      `SELECT cp.*, u.name as author_name,
        (SELECT COUNT(*) FROM custom_puzzle_attempts WHERE puzzle_id = cp.id AND is_correct = true) as solved_count,
        (SELECT 1 FROM custom_puzzle_attempts WHERE puzzle_id = cp.id AND user_id = $${queryParams.length + 1} AND is_correct = true LIMIT 1) as solved_by_me
       FROM custom_puzzles cp
       LEFT JOIN users u ON cp.created_by = u.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY cp.created_at DESC`,
      [...queryParams, userId],
    );
    return result.rows;
  }

  static async getCustomPuzzleById(id: string, userId: string, role: string) {
    const result = await query(
      `SELECT cp.*, u.name as author_name,
        (SELECT 1 FROM custom_puzzle_attempts WHERE puzzle_id=cp.id AND user_id=$2 LIMIT 1) as attempted_by_me,
        (SELECT is_correct FROM custom_puzzle_attempts WHERE puzzle_id=cp.id AND user_id=$2 LIMIT 1) as my_result
       FROM custom_puzzles cp
       LEFT JOIN users u ON cp.created_by = u.id
       WHERE cp.id=$1`,
      [id, userId],
    );
    if (!result.rows.length) return null;

    const puzzle = result.rows[0];
    const isCoach = ["coach", "academy_admin", "super_admin"].includes(role);
    if (!isCoach && !puzzle.attempted_by_me) {
      puzzle.solution_moves = undefined;
      puzzle.solution_pgn = undefined;
    }
    return puzzle;
  }

  static async createCustomPuzzle(data: any) {
    const {
      academyId,
      createdBy,
      title,
      description,
      fen,
      solutionMoves,
      solutionPgn,
      difficulty,
      themes,
      hint,
      isPublished,
    } = data;
    const id = uuidv4();
    await query(
      `INSERT INTO custom_puzzles (id, academy_id, created_by, title, description, fen, solution_moves, solution_pgn, difficulty, themes, hint, is_published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
      [
        id,
        academyId,
        createdBy,
        title,
        description,
        fen,
        solutionMoves,
        solutionPgn,
        difficulty,
        themes,
        hint,
        isPublished,
      ],
    );
    return id;
  }

  static async updateCustomPuzzle(id: string, academyId: string, data: any) {
    const {
      title,
      description,
      fen,
      solutionMoves,
      solutionPgn,
      difficulty,
      themes,
      hint,
      isPublished,
    } = data;
    await query(
      `UPDATE custom_puzzles SET
        title=$1, description=$2, fen=$3, solution_moves=$4, solution_pgn=$5,
        difficulty=$6, themes=$7, hint=$8, is_published=$9
       WHERE id=$10 AND academy_id=$11`,
      [
        title,
        description,
        fen,
        solutionMoves,
        solutionPgn,
        difficulty,
        themes,
        hint,
        isPublished,
        id,
        academyId,
      ],
    );
  }

  static async deleteCustomPuzzle(id: string, academyId: string) {
    await query("DELETE FROM custom_puzzles WHERE id=$1 AND academy_id=$2", [
      id,
      academyId,
    ]);
  }

  static async submitCustomPuzzleAttempt(
    puzzleId: string,
    userId: string,
    moves: string[],
    timeTakenMs: number,
  ) {
    const puzzleRes = await query("SELECT * FROM custom_puzzles WHERE id=$1", [
      puzzleId,
    ]);
    if (!puzzleRes.rows.length) throw new Error("Puzzle not found");

    const p = puzzleRes.rows[0];
    const expected = p.solution_moves.trim().toLowerCase().split(/\s+/);
    const submitted = (moves || []).map((m: any) => m.trim().toLowerCase());
    const isCorrect =
      submitted.length > 0 &&
      expected.every((m: any, i: number) => submitted[i] === m);

    await query(
      `INSERT INTO custom_puzzle_attempts (id, puzzle_id, user_id, is_correct, moves_played, time_taken_ms, attempted_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (puzzle_id, user_id) DO UPDATE SET
         is_correct=EXCLUDED.is_correct, moves_played=EXCLUDED.moves_played,
         time_taken_ms=EXCLUDED.time_taken_ms, attempted_at=NOW()`,
      [uuidv4(), puzzleId, userId, isCorrect, moves?.join(" "), timeTakenMs],
    );

    if (isCorrect) {
      await query(
        "UPDATE custom_puzzles SET times_solved = times_solved + 1 WHERE id = $1",
        [puzzleId],
      );
    }

    return {
      isCorrect,
      solution: p.solution_moves,
      solutionPgn: p.solution_pgn,
      hint: p.hint,
    };
  }

  static async getMcqs(params: {
    academyId: string;
    userId: string;
    role: string;
    difficulty?: string;
  }) {
    const { academyId, userId, role, difficulty } = params;
    const isCoach = ["coach", "academy_admin", "super_admin"].includes(role);

    const conditions = [
      "(q.academy_id = $1 OR (q.academy_id IS NULL AND q.created_by = $2))",
    ];
    const queryParams: any[] = [academyId, userId];
    if (!isCoach) conditions.push("q.is_published = true");
    if (difficulty) {
      queryParams.push(difficulty);
      conditions.push(`q.difficulty = $${queryParams.length}`);
    }

    const questionsRes = await query(
      `SELECT q.*, u.name as author_name,
        (SELECT 1 FROM mcq_attempts WHERE question_id=q.id AND user_id=$${queryParams.length + 1} LIMIT 1) as attempted_by_me,
        (SELECT is_correct FROM mcq_attempts WHERE question_id=q.id AND user_id=$${queryParams.length + 1} LIMIT 1) as my_correct
       FROM mcq_questions q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY q.created_at DESC`,
      [...queryParams, userId],
    );

    const questions = questionsRes.rows;
    const qIds = questions.map((q) => q.id);
    if (qIds.length === 0) return [];

    const optionsRes = await query(
      `SELECT * FROM mcq_options WHERE question_id = ANY($1::uuid[]) ORDER BY order_index`,
      [qIds],
    );
    const options = optionsRes.rows;

    return questions.map((q) => ({
      ...q,
      options: options
        .filter((o) => o.question_id === q.id)
        .map((o) => ({
          ...o,
          is_correct: isCoach || q.attempted_by_me ? o.is_correct : undefined,
        })),
    }));
  }

  static async getMcqById(id: string, userId: string, role: string) {
    const isCoach = ["coach", "academy_admin", "super_admin"].includes(role);
    const result = await query(
      `SELECT q.*, u.name as author_name,
        (SELECT 1 FROM mcq_attempts WHERE question_id=q.id AND user_id=$2 LIMIT 1) as attempted_by_me,
        (SELECT is_correct FROM mcq_attempts WHERE question_id=q.id AND user_id=$2 LIMIT 1) as my_correct
       FROM mcq_questions q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id=$1`,
      [id, userId],
    );

    if (!result.rows.length) return null;
    const q = result.rows[0];

    const optionsRes = await query(
      `SELECT * FROM mcq_options WHERE question_id = $1 ORDER BY order_index`,
      [id],
    );
    const options = optionsRes.rows;

    return {
      ...q,
      options: options.map((o) => ({
        ...o,
        is_correct: isCoach || q.attempted_by_me ? o.is_correct : undefined,
      })),
    };
  }

  static async submitMcqAttempt(
    questionId: string,
    userId: string,
    selectedOptionIds: string[],
    timeTakenMs: number,
  ) {
    const qRes = await query(
      "SELECT q.*, array_agg(o.id) FILTER (WHERE o.is_correct) as correct_ids FROM mcq_questions q JOIN mcq_options o ON o.question_id=q.id WHERE q.id=$1 GROUP BY q.id",
      [questionId],
    );
    if (!qRes.rows.length) throw new Error("Question not found");
    const q = qRes.rows[0];

    const correctIds = new Set<string>(q.correct_ids || []);
    const selectedIds = new Set(selectedOptionIds);
    const isCorrect =
      correctIds.size === selectedIds.size &&
      [...correctIds].every((id) => selectedIds.has(id));
    const pointsEarned = isCorrect ? q.points || 1 : 0;

    await query(
      `INSERT INTO mcq_attempts (id, question_id, user_id, selected_option_ids, is_correct, points_earned, time_taken_ms, attempted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (question_id, user_id) DO UPDATE SET
         selected_option_ids=EXCLUDED.selected_option_ids,
         is_correct=EXCLUDED.is_correct, points_earned=EXCLUDED.points_earned,
         time_taken_ms=EXCLUDED.time_taken_ms, attempted_at=NOW()`,
      [
        uuidv4(),
        questionId,
        userId,
        selectedOptionIds,
        isCorrect,
        pointsEarned,
        timeTakenMs,
      ],
    );

    const opts = await query(
      "SELECT * FROM mcq_options WHERE question_id=$1 ORDER BY order_index",
      [questionId],
    );

    return {
      isCorrect,
      pointsEarned,
      correctOptionIds: q.correct_ids,
      explanation: q.explanation,
      options: opts.rows,
    };
  }

  static async createMcq(data: any) {
    const {
      academyId,
      createdBy,
      question,
      explanation,
      fen,
      difficulty = "intermediate",
      topics = [],
      isPublished = false,
      allowMultiple = false,
      points = 1,
      options = [],
    } = data;
    const id = uuidv4();
    await transaction(async (client: any) => {
      await client.query(
        `INSERT INTO mcq_questions (id, academy_id, created_by, question, explanation, fen, difficulty, topics, is_published, allow_multiple, points, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
        [
          id,
          academyId,
          createdBy,
          question,
          explanation,
          fen || null,
          difficulty,
          topics,
          isPublished,
          allowMultiple,
          points,
        ],
      );
      for (let i = 0; i < options.length; i++) {
        await client.query(
          `INSERT INTO mcq_options (id, question_id, option_text, is_correct, order_index) VALUES ($1,$2,$3,$4,$5)`,
          [uuidv4(), id, options[i].text, !!options[i].isCorrect, i],
        );
      }
    });
    return id;
  }

  static async updateMcq(id: string, academyId: string, data: any) {
    const {
      question,
      explanation,
      fen,
      difficulty,
      topics,
      isPublished,
      allowMultiple,
      points,
      options,
    } = data;
    await transaction(async (client: any) => {
      await client.query(
        `UPDATE mcq_questions SET question=$1, explanation=$2, fen=$3, difficulty=$4, topics=$5,
          is_published=$6, allow_multiple=$7, points=$8 WHERE id=$9 AND academy_id=$10`,
        [
          question,
          explanation,
          fen || null,
          difficulty,
          topics,
          isPublished,
          allowMultiple,
          points,
          id,
          academyId,
        ],
      );
      if (options) {
        await client.query("DELETE FROM mcq_options WHERE question_id=$1", [
          id,
        ]);
        for (let i = 0; i < options.length; i++) {
          await client.query(
            "INSERT INTO mcq_options (id, question_id, option_text, is_correct, order_index) VALUES ($1,$2,$3,$4,$5)",
            [uuidv4(), id, options[i].text, !!options[i].isCorrect, i],
          );
        }
      }
    });
  }

  static async deleteMcq(id: string, academyId: string) {
    await query("DELETE FROM mcq_questions WHERE id=$1 AND academy_id=$2", [
      id,
      academyId,
    ]);
  }

  static async getPuzzleById(id: string) {
    const result = await query("SELECT * FROM puzzles WHERE id=$1", [id]);
    return result.rows[0] || null;
  }

  static async getDailyPuzzle() {
    const result = await query(
      "SELECT * FROM puzzles ORDER BY nb_plays ASC, rating DESC LIMIT 1",
    );
    return result.rows[0] || null;
  }

  static async getRandomPuzzle(difficulty: string = "intermediate") {
    const ratingRanges: Record<string, [number, number]> = {
      beginner: [800, 1200],
      intermediate: [1200, 1600],
      advanced: [1600, 2000],
      expert: [2000, 3000],
    };
    const [min, max] = ratingRanges[difficulty] || [1000, 1800];
    const result = await query(
      "SELECT * FROM puzzles WHERE rating BETWEEN $1 AND $2 ORDER BY RANDOM() LIMIT 1",
      [min, max],
    );
    return result.rows[0] || null;
  }
}

export default PuzzleService;
