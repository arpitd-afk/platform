const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { puzzlesRouter } = require('./_combined');

const router = puzzlesRouter;

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: Lichess puzzle routes (kept intact)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/my-stats', async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_correct) as correct,
        ROUND(100.0*COUNT(*) FILTER (WHERE is_correct)/NULLIF(COUNT(*),0),1) as accuracy,
        COUNT(DISTINCT DATE(attempted_at)) as days_practiced,
        MAX(attempted_at) as last_attempted
       FROM puzzle_attempts WHERE user_id=$1`, [req.user.id]
    );
    res.json({ stats: result.rows[0] });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

router.get('/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await query(
      `SELECT pa.*, p.fen, p.rating as puzzle_rating, p.themes
       FROM puzzle_attempts pa JOIN puzzles p ON pa.puzzle_id=p.id
       WHERE pa.user_id=$1 ORDER BY pa.attempted_at DESC LIMIT $2`,
      [req.user.id, limit]
    );
    res.json({ history: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

router.get('/leaderboard', async (req, res) => {
  try {
    const { academyId, limit = 50 } = req.query;
    const id = academyId || req.user.academyId;

    const result = await query(
      `SELECT * FROM puzzle_leaderboard
       WHERE academy_id = $1
       ORDER BY total_score DESC, lichess_solved DESC
       LIMIT $2`,
      [id, parseInt(limit)]
    );
    res.json({ leaderboard: result.rows, academyId: id });
  } catch (e) {
    console.error('[leaderboard]', e);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
});

router.get('/my-rank', async (req, res) => {
  try {
    const result = await query(
      `SELECT rank, total_score, lichess_solved, custom_solved, mcq_points
       FROM (
         SELECT *, RANK() OVER (ORDER BY total_score DESC) AS rank
         FROM puzzle_leaderboard WHERE academy_id = $1
       ) ranked
       WHERE user_id = $2`,
      [req.user.academyId, req.user.id]
    );
    res.json({ rank: result.rows[0] || null });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM PUZZLES (Coach-created)
// ─────────────────────────────────────────────────────────────────────────────

// GET /puzzles/custom — list for academy (published for students, all for coaches)
router.get('/custom', async (req, res) => {
  try {
    const { difficulty, theme } = req.query;
    const isCoach = ['coach', 'academy_admin', 'super_admin'].includes(req.user.role);

    // Support records created before academy_id bug was fixed (stored NULL)
    const conditions = ['(cp.academy_id = $1 OR (cp.academy_id IS NULL AND cp.created_by = $2))'];
    const params = [req.user.academyId, req.user.id];

    if (!isCoach) conditions.push('cp.is_published = true');
    if (difficulty) { params.push(difficulty); conditions.push(`cp.difficulty = $${params.length}`); }
    if (theme) { params.push(`{${theme}}`); conditions.push(`cp.themes && $${params.length}`); }

    const result = await query(
      `SELECT cp.*, u.name as author_name,
        (SELECT COUNT(*) FROM custom_puzzle_attempts WHERE puzzle_id = cp.id AND is_correct = true) as solved_count,
        (SELECT 1 FROM custom_puzzle_attempts WHERE puzzle_id = cp.id AND user_id = $${params.length + 1} AND is_correct = true LIMIT 1) as solved_by_me
       FROM custom_puzzles cp
       LEFT JOIN users u ON cp.created_by = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY cp.created_at DESC`,
      [...params, req.user.id]
    );
    res.json({ puzzles: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

// GET /puzzles/custom/:id
router.get('/custom/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT cp.*, u.name as author_name,
        (SELECT 1 FROM custom_puzzle_attempts WHERE puzzle_id=cp.id AND user_id=$2 LIMIT 1) as attempted_by_me,
        (SELECT is_correct FROM custom_puzzle_attempts WHERE puzzle_id=cp.id AND user_id=$2 LIMIT 1) as my_result
       FROM custom_puzzles cp
       LEFT JOIN users u ON cp.created_by = u.id
       WHERE cp.id=$1`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Puzzle not found' });

    const puzzle = result.rows[0];
    // Hide solution from students who haven't solved it yet
    const isCoach = ['coach', 'academy_admin', 'super_admin'].includes(req.user.role);
    if (!isCoach && !puzzle.attempted_by_me) {
      puzzle.solution_moves = undefined;
      puzzle.solution_pgn = undefined;
    }

    res.json({ puzzle });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

// POST /puzzles/custom — coach creates
router.post('/custom', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { title, description, fen, solutionMoves, solutionPgn, difficulty = 'intermediate', themes = [], hint, isPublished = false } = req.body;
    if (!title || !fen || !solutionMoves) return res.status(400).json({ message: 'Title, FEN and solution moves required' });

    const id = uuidv4();
    await query(
      `INSERT INTO custom_puzzles (id, academy_id, created_by, title, description, fen, solution_moves, solution_pgn, difficulty, themes, hint, is_published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
      [id, req.user.academyId, req.user.id, title, description, fen, solutionMoves, solutionPgn, difficulty, themes, hint, isPublished]
    );
    res.status(201).json({ message: 'Puzzle created', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create puzzle' });
  }
});

// PUT /puzzles/custom/:id
router.put('/custom/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { title, description, fen, solutionMoves, solutionPgn, difficulty, themes, hint, isPublished } = req.body;
    await query(
      `UPDATE custom_puzzles SET
        title=$1, description=$2, fen=$3, solution_moves=$4, solution_pgn=$5,
        difficulty=$6, themes=$7, hint=$8, is_published=$9
       WHERE id=$10 AND academy_id=$11`,
      [title, description, fen, solutionMoves, solutionPgn, difficulty, themes, hint, isPublished, req.params.id, req.user.academyId]
    );
    res.json({ message: 'Updated' });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

// DELETE /puzzles/custom/:id
router.delete('/custom/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM custom_puzzles WHERE id=$1 AND academy_id=$2', [req.params.id, req.user.academyId]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// POST /puzzles/custom/:id/submit — student submits answer
router.post('/custom/:id/submit', async (req, res) => {
  try {
    const { moves, timeTakenMs } = req.body;
    const puzzle = await query('SELECT * FROM custom_puzzles WHERE id=$1 AND is_published=true', [req.params.id]);
    if (!puzzle.rows.length) return res.status(404).json({ message: 'Puzzle not found' });

    const p = puzzle.rows[0];
    const expected = p.solution_moves.trim().toLowerCase().split(/\s+/);
    const submitted = (moves || []).map((m) => m.trim().toLowerCase());
    const isCorrect = submitted.length > 0 && expected.every((m, i) => submitted[i] === m);

    await query(
      `INSERT INTO custom_puzzle_attempts (id, puzzle_id, user_id, is_correct, moves_played, time_taken_ms, attempted_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (puzzle_id, user_id) DO UPDATE SET
         is_correct=EXCLUDED.is_correct, moves_played=EXCLUDED.moves_played,
         time_taken_ms=EXCLUDED.time_taken_ms, attempted_at=NOW()`,
      [uuidv4(), req.params.id, req.user.id, isCorrect, moves?.join(' '), timeTakenMs]
    );

    if (isCorrect) {
      await query('UPDATE custom_puzzles SET times_solved=times_solved+1 WHERE id=$1', [req.params.id]);
    }

    res.json({
      isCorrect,
      solution: p.solution_moves,
      solutionPgn: p.solution_pgn,
      hint: p.hint,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to submit' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MCQ QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /puzzles/mcq — list
router.get('/mcq', async (req, res) => {
  try {
    const { difficulty, topic, includeAnswers } = req.query;
    const isCoach = ['coach', 'academy_admin', 'super_admin'].includes(req.user.role);
    const showAnswers = isCoach || includeAnswers === 'false'; // coaches always see answers

    const conditions = ['(q.academy_id = $1 OR (q.academy_id IS NULL AND q.created_by = $2))'];
    const params = [req.user.academyId, req.user.id];
    if (!isCoach) conditions.push('q.is_published = true');
    if (difficulty) { params.push(difficulty); conditions.push(`q.difficulty = $${params.length}`); }

    const questions = await query(
      `SELECT q.*,
        u.name as author_name,
        (SELECT 1 FROM mcq_attempts WHERE question_id=q.id AND user_id=$${params.length + 1} LIMIT 1) as attempted_by_me,
        (SELECT is_correct FROM mcq_attempts WHERE question_id=q.id AND user_id=$${params.length + 1} LIMIT 1) as my_correct
       FROM mcq_questions q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY q.created_at DESC`,
      [...params, req.user.id]
    );

    // Fetch options for each question
    const qIds = questions.rows.map((q) => q.id);
    let options = [];
    if (qIds.length > 0) {
      const optRes = await query(
        `SELECT * FROM mcq_options WHERE question_id = ANY($1::uuid[]) ORDER BY order_index`,
        [qIds]
      );
      options = optRes.rows;
    }

    const result = questions.rows.map((q) => ({
      ...q,
      options: options
        .filter((o) => o.question_id === q.id)
        .map((o) => ({
          ...o,
          // Hide is_correct from students until attempted
          is_correct: (isCoach || q.attempted_by_me) ? o.is_correct : undefined,
        })),
    }));

    res.json({ questions: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

// POST /puzzles/mcq — create question with options
router.post('/mcq', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { question, explanation, fen, difficulty = 'intermediate', topics = [], isPublished = false, allowMultiple = false, points = 1, options = [] } = req.body;
    if (!question) return res.status(400).json({ message: 'Question text required' });
    if (options.length < 2) return res.status(400).json({ message: 'At least 2 options required' });
    if (!options.some((o) => o.isCorrect)) return res.status(400).json({ message: 'At least one option must be marked correct' });

    const id = uuidv4();
    await query(
      `INSERT INTO mcq_questions (id, academy_id, created_by, question, explanation, fen, difficulty, topics, is_published, allow_multiple, points, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
      [id, req.user.academyId, req.user.id, question, explanation, fen || null, difficulty, topics, isPublished, allowMultiple, points]
    );

    for (let i = 0; i < options.length; i++) {
      await query(
        `INSERT INTO mcq_options (id, question_id, option_text, is_correct, order_index) VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), id, options[i].text, !!options[i].isCorrect, i]
      );
    }

    res.status(201).json({ message: 'Question created', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create question' });
  }
});

// PUT /puzzles/mcq/:id — update (replaces options)
router.put('/mcq/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { question, explanation, fen, difficulty, topics, isPublished, allowMultiple, points, options } = req.body;
    await query(
      `UPDATE mcq_questions SET question=$1, explanation=$2, fen=$3, difficulty=$4, topics=$5,
        is_published=$6, allow_multiple=$7, points=$8 WHERE id=$9 AND academy_id=$10`,
      [question, explanation, fen || null, difficulty, topics, isPublished, allowMultiple, points, req.params.id, req.user.academyId]
    );
    if (options) {
      await query('DELETE FROM mcq_options WHERE question_id=$1', [req.params.id]);
      for (let i = 0; i < options.length; i++) {
        await query(
          'INSERT INTO mcq_options (id, question_id, option_text, is_correct, order_index) VALUES ($1,$2,$3,$4,$5)',
          [uuidv4(), req.params.id, options[i].text, !!options[i].isCorrect, i]
        );
      }
    }
    res.json({ message: 'Updated' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// DELETE /puzzles/mcq/:id
router.delete('/mcq/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM mcq_questions WHERE id=$1 AND academy_id=$2', [req.params.id, req.user.academyId]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// POST /puzzles/mcq/:id/submit — student submits answer
router.post('/mcq/:id/submit', async (req, res) => {
  try {
    const { selectedOptionIds = [], timeTakenMs } = req.body;
    const qRes = await query(
      'SELECT q.*, array_agg(o.id) FILTER (WHERE o.is_correct) as correct_ids FROM mcq_questions q JOIN mcq_options o ON o.question_id=q.id WHERE q.id=$1 GROUP BY q.id',
      [req.params.id]
    );
    if (!qRes.rows.length) return res.status(404).json({ message: 'Question not found' });
    const q = qRes.rows[0];

    const correctIds = new Set(q.correct_ids || []);
    const selectedIds = new Set(selectedOptionIds);

    // Correct = selected set exactly equals correct set
    const isCorrect = correctIds.size === selectedIds.size &&
      [...correctIds].every((id) => selectedIds.has(id));

    const pointsEarned = isCorrect ? (q.points || 1) : 0;

    await query(
      `INSERT INTO mcq_attempts (id, question_id, user_id, selected_option_ids, is_correct, points_earned, time_taken_ms, attempted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (question_id, user_id) DO UPDATE SET
         selected_option_ids=EXCLUDED.selected_option_ids,
         is_correct=EXCLUDED.is_correct, points_earned=EXCLUDED.points_earned,
         time_taken_ms=EXCLUDED.time_taken_ms, attempted_at=NOW()`,
      [uuidv4(), req.params.id, req.user.id, selectedOptionIds, isCorrect, pointsEarned, timeTakenMs]
    );

    // Fetch options with correct flags for reveal
    const opts = await query('SELECT * FROM mcq_options WHERE question_id=$1 ORDER BY order_index', [req.params.id]);

    res.json({
      isCorrect,
      pointsEarned,
      correctOptionIds: q.correct_ids,
      explanation: q.explanation,
      options: opts.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to submit' });
  }
});

// GET /puzzles/:id (existing, kept)
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM puzzles WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ puzzle: result.rows[0] });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;