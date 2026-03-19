import { prisma } from "../lib/prisma";
import { CustomPuzzle, MCQQuestion, Puzzle } from "../types/models";
import { Prisma } from "@prisma/client";

export class PuzzleService {
  /**
   * Get user puzzle stats
   */
  static async getStats(userId: string) {
    const attempts = await prisma.puzzleAttempt.findMany({
      where: { user_id: userId },
      include: { puzzle: { select: { themes: true } } },
      orderBy: { attempted_at: "desc" },
    });

    if (attempts.length === 0) {
      return {
        total: 0,
        correct: 0,
        accuracy: 0,
        days_practiced: 0,
        daily_streak: 0,
        last_attempted: null,
        theme_stats: {},
      };
    }

    const total = attempts.length;
    const correctAttempts = attempts.filter((a) => a.is_correct);
    const correct = correctAttempts.length;
    const accuracy = ((correct / total) * 100).toFixed(1);

    // Calculate days practiced and streak
    const dates = attempts
      .map((a) => a.attempted_at?.toISOString().split("T")[0])
      .filter(Boolean) as string[];
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    const daysPracticed = uniqueDates.length;

    let dailyStreak = 0;
    if (uniqueDates.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        dailyStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const d1 = new Date(uniqueDates[i]);
          const d2 = new Date(uniqueDates[i+1]);
          const diff = (d1.getTime() - d2.getTime()) / 86400000;
          if (diff <= 1.1) { // allow for small floating point diffs
            dailyStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Theme breakdown
    const themeStats: Record<string, { total: number; correct: number }> = {};
    attempts.forEach((a) => {
      a.puzzle.themes.forEach((theme) => {
        if (!themeStats[theme]) themeStats[theme] = { total: 0, correct: 0 };
        themeStats[theme].total++;
        if (a.is_correct) themeStats[theme].correct++;
      });
    });

    return {
      total,
      correct,
      accuracy,
      days_practiced: daysPracticed,
      daily_streak: dailyStreak,
      last_attempted: attempts[0].attempted_at,
      theme_stats: themeStats,
    };
  }

  /**
   * Get user puzzle history
   */
  static async getHistory(userId: string, limit: number = 20) {
    const history = await prisma.puzzleAttempt.findMany({
      where: { user_id: userId },
      include: {
        puzzle: { select: { fen: true, rating: true, themes: true } },
      },
      orderBy: { attempted_at: "desc" },
      take: limit,
    });

    return history.map((h) => ({
      ...h,
      fen: h.puzzle.fen,
      puzzle_rating: h.puzzle.rating,
      themes: h.puzzle.themes,
    }));
  }

  /**
   * Get academy leaderboard
   */
  static async getLeaderboard(academyId: string, limit: number = 50) {
    // puzzle_leaderboard is a VIEW, so we use $queryRaw
    // We cast BigInt columns (counts, sums) to integer for JSON serializability
    const result = await prisma.$queryRaw`
      SELECT 
        user_id, name, avatar, academy_id, rating,
        CAST(lichess_solved AS integer) as lichess_solved,
        CAST(custom_solved AS integer) as custom_solved,
        CAST(mcq_points AS integer) as mcq_points,
        CAST(total_score AS integer) as total_score
      FROM puzzle_leaderboard
      WHERE academy_id = CAST(${academyId} AS UUID)
      ORDER BY total_score DESC, lichess_solved DESC
      LIMIT ${limit}
    `;
    return result as any[];
  }

  /**
   * Get user rank in academy
   */
  static async getMyRank(userId: string, academyId: string) {
    const result: any[] = await prisma.$queryRaw`
      SELECT 
        CAST(rank AS integer) as rank,
        CAST(total_score AS integer) as total_score,
        CAST(lichess_solved AS integer) as lichess_solved,
        CAST(custom_solved AS integer) as custom_solved,
        CAST(mcq_points AS integer) as mcq_points
      FROM (
        SELECT *, RANK() OVER (ORDER BY total_score DESC) AS rank
        FROM puzzle_leaderboard WHERE academy_id = CAST(${academyId} AS UUID)
      ) ranked
      WHERE user_id = CAST(${userId} AS UUID)
    `;
    return result[0] || null;
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

    const where: any = {
      OR: [
        { academy_id: academyId },
        { AND: [{ academy_id: null }, { created_by: userId }] },
      ],
    };

    if (!isCoach) where.is_published = true;
    if (difficulty) where.difficulty = difficulty;
    if (theme) where.themes = { has: theme };

    const puzzles = await prisma.customPuzzle.findMany({
      where,
      include: {
        author: { select: { name: true } },
        _count: {
          select: {
            attempts: { where: { is_correct: true } },
          },
        },
        attempts: {
          where: { user_id: userId, is_correct: true },
          take: 1,
          select: { id: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return puzzles.map((p) => ({
      ...p,
      author_name: p.author?.name,
      solved_count: p._count.attempts,
      solved_by_me: p.attempts.length > 0 ? 1 : 0,
    }));
  }

  static async getCustomPuzzleById(id: string, userId: string, role: string) {
    const puzzle = await prisma.customPuzzle.findUnique({
      where: { id },
      include: {
        author: { select: { name: true } },
        attempts: {
          where: { user_id: userId },
          take: 1,
        },
      },
    });

    if (!puzzle) return null;

    const myAttempt = puzzle.attempts[0];
    const result = {
      ...puzzle,
      author_name: puzzle.author?.name,
      attempted_by_me: !!myAttempt,
      my_result: myAttempt?.is_correct ?? null,
    };

    const isCoach = ["coach", "academy_admin", "super_admin"].includes(role);
    if (!isCoach && !result.attempted_by_me) {
      (result as any).solution_moves = "";
      (result as any).solution_pgn = "";
    }
    return result;
  }

  static async createCustomPuzzle(data: any) {
    const academy_id = data.academy_id ?? data.academyId ?? null;
    const created_by = data.created_by ?? data.createdBy ?? null;
    const solution_moves = data.solution_moves ?? data.solutionMoves ?? "";
    const solution_pgn = data.solution_pgn ?? data.solutionPgn ?? null;
    const is_published = data.is_published ?? data.isPublished ?? false;
    const { title, description, fen, difficulty, themes, hint } = data;

    const puzzle = await prisma.customPuzzle.create({
      data: {
        academy_id,
        created_by,
        title,
        description: description || null,
        fen,
        solution_moves,
        solution_pgn,
        difficulty: (difficulty as any) || "intermediate",
        themes: themes || [],
        hint: hint || null,
        is_published,
      },
    });
    return puzzle.id;
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

    await prisma.customPuzzle.update({
      where: { id, academy_id: academyId },
      data: {
        title,
        description,
        fen,
        solution_moves: solutionMoves,
        solution_pgn: solutionPgn,
        difficulty,
        themes: themes || [],
        hint,
        is_published: isPublished,
      },
    });
  }

  static async deleteCustomPuzzle(id: string, academyId: string) {
    await prisma.customPuzzle.delete({
      where: { id, academy_id: academyId },
    });
  }

  static async submitCustomPuzzleAttempt(
    puzzleId: string,
    userId: string,
    moves: string[],
    timeTakenMs: number,
  ) {
    const puzzle = await prisma.customPuzzle.findUnique({
      where: { id: puzzleId },
    });
    if (!puzzle) throw new Error("Puzzle not found");

    const expected = puzzle.solution_moves.trim().toLowerCase().split(/\s+/);
    const submitted = (moves || []).map((m: any) => m.trim().toLowerCase());
    const isCorrect =
      submitted.length > 0 &&
      expected.every((m: any, i: number) => submitted[i] === m);

    await prisma.customPuzzleAttempt.upsert({
      where: { puzzle_id_user_id: { puzzle_id: puzzleId, user_id: userId } },
      create: {
        puzzle_id: puzzleId,
        user_id: userId,
        is_correct: isCorrect,
        moves_played: moves?.join(" "),
        time_taken_ms: timeTakenMs,
      },
      update: {
        is_correct: isCorrect,
        moves_played: moves?.join(" "),
        time_taken_ms: timeTakenMs,
        attempted_at: new Date(),
      },
    });

    if (isCorrect) {
      await prisma.customPuzzle.update({
        where: { id: puzzleId },
        data: { times_solved: { increment: 1 } },
      });
    }

    return {
      isCorrect,
      solution: puzzle.solution_moves,
      solutionPgn: puzzle.solution_pgn,
      hint: puzzle.hint,
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

    const where: any = {
      OR: [
        { academy_id: academyId },
        { AND: [{ academy_id: null }, { created_by: userId }] },
      ],
    };
    if (!isCoach) where.is_published = true;
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.mcqQuestion.findMany({
      where,
      include: {
        author: { select: { name: true } },
        options: { orderBy: { order_index: "asc" } },
        attempts: {
          where: { user_id: userId },
          take: 1,
        },
      },
      orderBy: { created_at: "desc" },
    });

    return questions.map((q) => {
      const myAttempt = q.attempts[0];
      return {
        ...q,
        author_name: q.author?.name,
        attempted_by_me: !!myAttempt,
        my_correct: myAttempt?.is_correct ?? null,
        options: q.options.map((o) => ({
          ...o,
          is_correct: isCoach || !!myAttempt ? o.is_correct : undefined,
        })),
      };
    });
  }

  static async getMcqById(id: string, userId: string, role: string) {
    const isCoach = ["coach", "academy_admin", "super_admin"].includes(role);
    const question = await prisma.mcqQuestion.findUnique({
      where: { id },
      include: {
        author: { select: { name: true } },
        options: { orderBy: { order_index: "asc" } },
        attempts: {
          where: { user_id: userId },
          take: 1,
        },
      },
    });

    if (!question) return null;

    const myAttempt = question.attempts[0];
    return {
      ...question,
      author_name: question.author?.name,
      attempted_by_me: !!myAttempt,
      my_correct: myAttempt?.is_correct ?? null,
      options: question.options.map((o) => ({
        ...o,
        is_correct: isCoach || !!myAttempt ? o.is_correct : undefined,
      })),
    };
  }

  static async submitMcqAttempt(
    questionId: string,
    userId: string,
    selectedOptionIds: string[],
    timeTakenMs: number,
  ) {
    const q = await prisma.mcqQuestion.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!q) throw new Error("Question not found");

    const correctIds = new Set(
      q.options.filter((o) => o.is_correct).map((o) => o.id),
    );
    const selectedIds = new Set(selectedOptionIds);
    const isCorrect =
      correctIds.size === selectedIds.size &&
      [...correctIds].every((id) => selectedIds.has(id));
    const pointsEarned = isCorrect ? q.points || 1 : 0;

    await prisma.mcqAttempt.upsert({
      where: {
        question_id_user_id: { question_id: questionId, user_id: userId },
      },
      create: {
        question_id: questionId,
        user_id: userId,
        selected_option_ids: selectedOptionIds,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken_ms: timeTakenMs,
      },
      update: {
        selected_option_ids: selectedOptionIds,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken_ms: timeTakenMs,
        attempted_at: new Date(),
      },
    });

    return {
      isCorrect,
      pointsEarned,
      correctOptionIds: Array.from(correctIds),
      explanation: q.explanation,
      options: q.options,
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

    const result = await prisma.mcqQuestion.create({
      data: {
        academy_id: academyId,
        created_by: createdBy,
        question,
        explanation,
        fen: fen || null,
        difficulty,
        topics: topics || [],
        is_published: isPublished,
        allow_multiple: allowMultiple,
        points,
        options: {
          create: options.map((o: any, i: number) => ({
            option_text: o.text,
            is_correct: !!o.isCorrect,
            order_index: i,
          })),
        },
      },
    });
    return result.id;
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

    await prisma.$transaction(async (tx) => {
      await tx.mcqQuestion.update({
        where: { id, academy_id: academyId },
        data: {
          question,
          explanation,
          fen: fen || null,
          difficulty,
          topics: topics || [],
          is_published: isPublished,
          allow_multiple: allowMultiple,
          points,
        },
      });

      if (options) {
        await tx.mcqOption.deleteMany({ where: { question_id: id } });
        await tx.mcqOption.createMany({
          data: options.map((o: any, i: number) => ({
            question_id: id,
            option_text: o.text,
            is_correct: !!o.isCorrect,
            order_index: i,
          })),
        });
      }
    });
  }

  static async deleteMcq(id: string, academyId: string) {
    await prisma.mcqQuestion.delete({
      where: { id, academy_id: academyId },
    });
  }

  static async getPuzzleById(id: string) {
    const puzzle = await prisma.puzzle.findUnique({ where: { id } });
    return puzzle;
  }

  static async getDailyPuzzle() {
    // This is a simple approximation of the original query
    const puzzle = await prisma.puzzle.findFirst({
      orderBy: [{ nb_plays: "asc" }, { rating: "desc" }],
    });
    return puzzle;
  }

  static async getRandomPuzzle(difficulty: string = "intermediate") {
    const ratingRanges: Record<string, [number, number]> = {
      beginner: [800, 1200],
      intermediate: [1200, 1600],
      advanced: [1600, 2000],
      expert: [2000, 3000],
    };
    const [min, max] = ratingRanges[difficulty] || [1000, 1800];

    // Prisma doesn't have a built-in ORDER BY RANDOM().
    // We can use a raw query or fetch a random one from a count.
    const count = await prisma.puzzle.count({
      where: { rating: { gte: min, lte: max } },
    });

    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);
    const puzzles = await prisma.puzzle.findMany({
      where: { rating: { gte: min, lte: max } },
      take: 1,
      skip: skip,
    });

    return puzzles[0] || null;
  }
}

export default PuzzleService;
