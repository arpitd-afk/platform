const express = require('express');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { session, cache } = require('../config/redis');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
router.use(authenticate);

// POST /api/games - Create a new game
router.post('/', async (req, res) => {
  try {
    const {
      opponentId,
      timeControl = '10+5',
      mode = 'casual',
      tournamentId = null,
      classroomId = null,
      color = 'random',
    } = req.body;

    const gameId = uuidv4();
    const chess = new Chess();

    // Assign colors
    let whiteId, blackId;
    if (color === 'white') {
      whiteId = req.user.id;
      blackId = opponentId;
    } else if (color === 'black') {
      whiteId = opponentId;
      blackId = req.user.id;
    } else {
      // Random
      if (Math.random() > 0.5) {
        whiteId = req.user.id;
        blackId = opponentId;
      } else {
        whiteId = opponentId;
        blackId = req.user.id;
      }
    }

    // Parse time control (e.g., "10+5" = 10 min + 5 sec increment)
    const [baseMinutes, incrementSeconds] = timeControl.split('+').map(Number);
    const baseTimeMs = (baseMinutes || 10) * 60 * 1000;
    const incrementMs = (incrementSeconds || 0) * 1000;

    const gameState = {
      id: gameId,
      fen: chess.fen(),
      pgn: '',
      whiteId,
      blackId,
      mode,
      timeControl,
      whiteTimeMs: baseTimeMs,
      blackTimeMs: baseTimeMs,
      incrementMs,
      status: 'waiting',
      moves: [],
      createdAt: new Date().toISOString(),
    };

    await transaction(async (client) => {
      await client.query(
        `INSERT INTO games (id, white_player_id, black_player_id, fen, pgn, status, time_control,
          white_time_ms, black_time_ms, increment_ms, mode, tournament_id, classroom_id, created_at)
         VALUES ($1,$2,$3,$4,$5,'waiting',$6,$7,$8,$9,$10,$11,$12,NOW())`,
        [gameId, whiteId, blackId, chess.fen(), '', timeControl,
          baseTimeMs, baseTimeMs, incrementMs, mode, tournamentId, classroomId]
      );
    });

    await session.setGameState(gameId, gameState);

    // Notify players via socket
    if (req.io) {
      req.io.to(`user:${whiteId}`).emit('game:created', { gameId, color: 'white' });
      req.io.to(`user:${blackId}`).emit('game:created', { gameId, color: 'black' });
    }

    res.status(201).json({ message: 'Game created', gameId, gameState });
  } catch (error) {
    logger.error('Create game error:', error);
    res.status(500).json({ message: 'Failed to create game' });
  }
});

// GET /api/games/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try Redis cache first
    const cached = await session.getGameState(id);
    if (cached) return res.json({ game: cached });

    const result = await query(
      `SELECT g.*,
        wu.name as white_name, wu.rating as white_rating, wu.avatar as white_avatar,
        bu.name as black_name, bu.rating as black_rating, bu.avatar as black_avatar
       FROM games g
       LEFT JOIN users wu ON g.white_player_id = wu.id
       LEFT JOIN users bu ON g.black_player_id = bu.id
       WHERE g.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({ game: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get game' });
  }
});

// POST /api/games/:id/move - Make a move
router.post('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { move, timeLeftMs } = req.body; // move in UCI format e.g. "e2e4"

    const gameState = await session.getGameState(id);
    if (!gameState) {
      return res.status(404).json({ message: 'Game not found or expired' });
    }

    if (gameState.status !== 'active') {
      return res.status(400).json({ message: 'Game is not active' });
    }

    const chess = new Chess(gameState.fen);
    const isWhiteTurn = chess.turn() === 'w';
    const currentPlayerId = isWhiteTurn ? gameState.whiteId : gameState.blackId;

    if (req.user.id !== currentPlayerId) {
      return res.status(403).json({ message: 'Not your turn' });
    }

    // Validate and make move
    const result = chess.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move.length === 5 ? move[4] : 'q',
    });

    if (!result) {
      return res.status(400).json({ message: 'Illegal move' });
    }

    // Update game state
    const newMoveData = {
      san: result.san,
      uci: move,
      fen: chess.fen(),
      timestamp: Date.now(),
      timeLeftMs: timeLeftMs || (isWhiteTurn ? gameState.whiteTimeMs : gameState.blackTimeMs),
    };

    gameState.moves.push(newMoveData);
    gameState.fen = chess.fen();
    gameState.pgn = chess.pgn();

    // Update clocks with increment
    if (isWhiteTurn) {
      gameState.whiteTimeMs = (timeLeftMs || gameState.whiteTimeMs) + gameState.incrementMs;
    } else {
      gameState.blackTimeMs = (timeLeftMs || gameState.blackTimeMs) + gameState.incrementMs;
    }

    // Check game over
    let gameOverResult = null;
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        gameState.status = 'completed';
        gameOverResult = {
          winner: chess.turn() === 'w' ? 'black' : 'white',
          reason: 'checkmate',
        };
      } else if (chess.isDraw()) {
        gameState.status = 'completed';
        gameOverResult = { winner: null, reason: 'draw' };
      }
    }

    await session.setGameState(id, gameState);

    // Broadcast move to room
    if (req.io) {
      req.io.to(`game:${id}`).emit('game:move', {
        move: newMoveData,
        fen: chess.fen(),
        whiteTimeMs: gameState.whiteTimeMs,
        blackTimeMs: gameState.blackTimeMs,
        gameOver: gameOverResult,
      });
    }

    // Persist to DB periodically (every 10 moves or game over)
    if (gameState.moves.length % 10 === 0 || gameOverResult) {
      await query(
        'UPDATE games SET fen = $1, pgn = $2, status = $3, updated_at = NOW() WHERE id = $4',
        [chess.fen(), chess.pgn(), gameState.status, id]
      );

      if (gameOverResult) {
        await updateRatings(gameState, gameOverResult);
      }
    }

    res.json({ move: newMoveData, fen: chess.fen(), gameOver: gameOverResult });
  } catch (error) {
    logger.error('Move error:', error);
    res.status(500).json({ message: 'Failed to process move' });
  }
});

// POST /api/games/:id/resign
router.post('/:id/resign', async (req, res) => {
  try {
    const { id } = req.params;
    const gameState = await session.getGameState(id);
    if (!gameState) return res.status(404).json({ message: 'Game not found' });

    const isWhite = req.user.id === gameState.whiteId;
    const winner = isWhite ? 'black' : 'white';

    gameState.status = 'completed';
    gameState.result = { winner, reason: 'resignation' };
    await session.setGameState(id, gameState);

    await query(
      "UPDATE games SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify({ winner, reason: 'resignation' }), id]
    );

    if (req.io) {
      req.io.to(`game:${id}`).emit('game:over', { winner, reason: 'resignation' });
    }

    res.json({ message: 'Resigned', winner, reason: 'resignation' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resign' });
  }
});

// GET /api/games/:id/analysis - Request AI analysis
router.get('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const cached = await cache.get(`analysis:${id}`);
    if (cached) return res.json({ analysis: cached });

    res.json({ analysis: null, message: 'Analysis not ready yet. Request analysis first.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get analysis' });
  }
});

// POST /api/games/:id/analyze
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT pgn, fen FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Game not found' });

    // Queue analysis job (would use Bull queue in production)
    res.json({ message: 'Analysis queued. Results will be available shortly.', jobId: uuidv4() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to queue analysis' });
  }
});

// GET /api/games - Get games list
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, status } = req.query;
    const offset = (page - 1) * limit;
    const targetId = userId || req.user.id;

    let whereClause = '(g.white_player_id = $1 OR g.black_player_id = $1)';
    const params = [targetId, limit, offset];

    if (status) {
      whereClause += ` AND g.status = $${params.length + 1}`;
      params.splice(params.length - 2, 0, status);
    }

    const games = await query(
      `SELECT g.id, g.status, g.time_control, g.mode, g.created_at, g.result,
        wu.name as white_name, wu.rating as white_rating,
        bu.name as black_name, bu.rating as black_rating
       FROM games g
       LEFT JOIN users wu ON g.white_player_id = wu.id
       LEFT JOIN users bu ON g.black_player_id = bu.id
       WHERE ${whereClause}
       ORDER BY g.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      [targetId, limit, offset]
    );

    res.json({ games: games.rows, pagination: { page: Number(page), limit: Number(limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get games' });
  }
});

async function updateRatings(gameState, result) {
  try {
    const [white, black] = await Promise.all([
      query('SELECT rating FROM users WHERE id = $1', [gameState.whiteId]),
      query('SELECT rating FROM users WHERE id = $1', [gameState.blackId]),
    ]);

    const whiteRating = white.rows[0]?.rating || 1200;
    const blackRating = black.rows[0]?.rating || 1200;
    const K = 32;

    const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
    const expectedBlack = 1 - expectedWhite;

    let whiteScore, blackScore;
    if (result.winner === 'white') { whiteScore = 1; blackScore = 0; }
    else if (result.winner === 'black') { whiteScore = 0; blackScore = 1; }
    else { whiteScore = 0.5; blackScore = 0.5; }

    const newWhiteRating = Math.round(whiteRating + K * (whiteScore - expectedWhite));
    const newBlackRating = Math.round(blackRating + K * (blackScore - expectedBlack));

    await Promise.all([
      query('UPDATE users SET rating = $1 WHERE id = $2', [Math.max(100, newWhiteRating), gameState.whiteId]),
      query('UPDATE users SET rating = $1 WHERE id = $2', [Math.max(100, newBlackRating), gameState.blackId]),
    ]);
  } catch (err) {
    logger.error('Rating update error:', err);
  }
}

module.exports = router;
