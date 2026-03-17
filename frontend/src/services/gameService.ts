import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../lib/db';
import { redisSession } from '../lib/redis';
import logger from '../lib/logger';
import { Game } from '../types/models';

export interface GameMove {
  san: string;
  uci: string;
  fen: string;
  timestamp: number;
  timeLeftMs: number;
}

export interface GameState {
  id: string;
  fen: string;
  pgn: string;
  whiteId: string;
  blackId: string;
  mode: Game['mode'];
  timeControl: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  incrementMs: number;
  status: Game['status'];
  moves: GameMove[];
  createdAt: string;
  result?: Game['result'];
}

export class GameService {
  /**
   * Calculate new ratings based on ELO algorithm
   */
  static calculateNewRatings(whiteRating: number, blackRating: number, winner: 'white' | 'black' | null) {
    const K = 32;
    const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
    const expectedBlack = 1 - expectedWhite;

    let whiteScore: number, blackScore: number;
    if (winner === 'white') { whiteScore = 1; blackScore = 0; }
    else if (winner === 'black') { whiteScore = 0; blackScore = 1; }
    else { whiteScore = 0.5; blackScore = 0.5; }

    const newWhiteRating = Math.round(whiteRating + K * (whiteScore - expectedWhite));
    const newBlackRating = Math.round(blackRating + K * (blackScore - expectedBlack));

    return {
      white: Math.max(100, newWhiteRating),
      black: Math.max(100, newBlackRating)
    };
  }

  /**
   * Update user ratings in DB
   */
  static async updateRatings(whiteId: string, blackId: string, winner: 'white' | 'black' | null) {
    try {
      const [whiteRes, blackRes] = await Promise.all([
        query('SELECT rating FROM users WHERE id = $1', [whiteId]),
        query('SELECT rating FROM users WHERE id = $1', [blackId]),
      ]);

      const whiteRating = whiteRes.rows[0]?.rating || 1200;
      const blackRating = blackRes.rows[0]?.rating || 1200;

      const newRatings = this.calculateNewRatings(whiteRating, blackRating, winner);

      await Promise.all([
        query('UPDATE users SET rating = $1 WHERE id = $2', [newRatings.white, whiteId]),
        query('UPDATE users SET rating = $1 WHERE id = $2', [newRatings.black, blackId]),
      ]);
      
      return newRatings;
    } catch (err: any) {
      logger.error('Rating update error:', err);
      throw err;
    }
  }

  /**
   * Initialize a new game state
   */
  static initializeGame(whiteId: string, blackId: string, timeControl: string, mode: Game['mode']): GameState {
    const gameId = uuidv4();
    const chess = new Chess();
    
    const [baseMinutes, incrementSeconds] = timeControl.split('+').map(Number);
    const baseTimeMs = (baseMinutes || 10) * 60 * 1000;
    const incrementMs = (incrementSeconds || 0) * 1000;

    return {
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
  }

  static async getGameById(id: string): Promise<Game | null> {
    // Try Redis session state first for active games
    try {
      const cached = await redisSession.getGameState(id);
      if (cached) return cached as unknown as Game;
    } catch (err) {
      logger.error('Redis getGameState error:', err);
    }

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

    if (result.rows.length === 0) return null;
    return result.rows[0] as Game;
  }

  static async listGames(params: { userId: string, status?: string, page?: number, limit?: number }) {
    const { userId, status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let whereClause = '(g.white_player_id = $1 OR g.black_player_id = $1)';
    const queryParams: any[] = [userId, limit, offset];

    if (status) {
      whereClause += ` AND g.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    const result = await query(
      `SELECT g.id, g.status, g.time_control, g.mode, g.created_at, g.result,
        wu.name as white_name, wu.rating as white_rating,
        bu.name as black_name, bu.rating as black_rating
       FROM games g
       LEFT JOIN users wu ON g.white_player_id = wu.id
       LEFT JOIN users bu ON g.black_player_id = bu.id
       WHERE ${whereClause}
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      queryParams
    );

    return {
      games: result.rows,
      pagination: { page, limit }
    };
  }

  static async createGame(data: {
    whiteId: string,
    blackId: string,
    timeControl?: string,
    mode?: Game['mode'],
    tournamentId?: string,
    classroomId?: string
  }) {
    const { whiteId, blackId, timeControl = '10+5', mode = 'casual', tournamentId, classroomId } = data;
    const gameState = this.initializeGame(whiteId, blackId, timeControl, mode);

    await query(
      `INSERT INTO games (id, white_player_id, black_player_id, fen, pgn, status, time_control,
        white_time_ms, black_time_ms, increment_ms, mode, tournament_id, classroom_id, created_at)
       VALUES ($1,$2,$3,$4,$5,'waiting',$6,$7,$8,$9,$10,$11,$12,NOW())`,
      [gameState.id, whiteId, blackId, gameState.fen, '', timeControl,
        gameState.whiteTimeMs, gameState.blackTimeMs, gameState.incrementMs, mode, tournamentId || null, classroomId || null]
    );

    await redisSession.setGameState(gameState.id, gameState);

    // Notify via socket
    if ((global as any).io) {
      (global as any).io.to(`user:${whiteId}`).emit('game:created', { gameId: gameState.id, color: 'white' });
      (global as any).io.to(`user:${blackId}`).emit('game:created', { gameId: gameState.id, color: 'black' });
    }

    return gameState;
  }

  static async makeMove(gameId: string, userId: string, move: string, timeLeftMs?: number) {
    const gameState = await redisSession.getGameState(gameId) as GameState;
    if (!gameState) throw new Error('Game not found or expired');
    if (gameState.status !== 'active' && gameState.status !== 'waiting') {
        throw new Error('Game is not active');
    }

    const chess = new Chess(gameState.fen);
    const isWhiteTurn = chess.turn() === 'w';
    const currentPlayerId = isWhiteTurn ? gameState.whiteId : gameState.blackId;

    if (userId !== currentPlayerId) throw new Error('Not your turn');

    // Validate and make move
    const result = chess.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move.length === 5 ? move[4] : 'q' as any,
    });

    if (!result) throw new Error('Illegal move');

    // Activate game on first move
    if (gameState.status === 'waiting') gameState.status = 'active';

    // Update game state
    const newMoveData: GameMove = {
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
    let gameOverResult: Game['result'] | null = null;
    if (chess.isGameOver()) {
      gameState.status = 'completed';
      if (chess.isCheckmate()) {
        gameOverResult = {
          winner: chess.turn() === 'w' ? 'black' : 'white',
          reason: 'checkmate',
        };
      } else if (chess.isDraw()) {
        gameOverResult = { winner: null, reason: 'draw' };
      } else {
        gameOverResult = { winner: null, reason: 'other' };
      }
      gameState.result = gameOverResult;
    }

    await redisSession.setGameState(gameId, gameState);

    // Broadcast move
    if ((global as any).io) {
      (global as any).io.to(`game:${gameId}`).emit('game:move', {
        move: newMoveData,
        fen: gameState.fen,
        whiteTimeMs: gameState.whiteTimeMs,
        blackTimeMs: gameState.blackTimeMs,
        gameOver: gameOverResult,
      });
    }

    // Persist to DB periodically (every 10 moves or game over)
    if (gameState.moves.length % 10 === 0 || gameOverResult) {
      await query(
        'UPDATE games SET fen = $1, pgn = $2, status = $3, result = $4, updated_at = NOW() WHERE id = $5',
        [gameState.fen, gameState.pgn, gameState.status, gameState.result ? JSON.stringify(gameState.result) : null, gameId]
      );

      if (gameOverResult && gameState.mode === 'rated') {
        await this.updateRatings(gameState.whiteId, gameState.blackId, gameOverResult.winner);
      }
    }

    return { gameState, move: newMoveData, gameOver: gameOverResult };
  }

  static async resign(gameId: string, userId: string) {
    const gameState = await redisSession.getGameState(gameId) as GameState;
    if (!gameState) throw new Error('Game not found');

    const isWhite = userId === gameState.whiteId;
    const winner: 'white' | 'black' = isWhite ? 'black' : 'white';

    gameState.status = 'completed';
    gameState.result = { winner, reason: 'resignation' };
    
    await redisSession.setGameState(gameId, gameState);

    await query(
      "UPDATE games SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(gameState.result), gameId]
    );

    if (gameState.mode === 'rated') {
      await this.updateRatings(gameState.whiteId, gameState.blackId, winner);
    }

    if ((global as any).io) {
      (global as any).io.to(`game:${gameId}`).emit('game:over', { winner, reason: 'resignation' });
    }

    return gameState.result;
  }

  static async getAnalysis(gameId: string) {
    const result = await query('SELECT * FROM game_analysis WHERE game_id=$1', [gameId]);
    return result.rows[0] || null;
  }

  static async analyze(gameId: string) {
    const existing = await query('SELECT id FROM game_analysis WHERE game_id=$1', [gameId]);
    if (existing.rows.length > 0) return { message: 'Analysis already exists or is queued' };

    await query(
      'INSERT INTO game_analysis (id, game_id, status, created_at) VALUES ($1, $2, $3, NOW())',
      [uuidv4(), gameId, 'queued']
    );
    return { message: 'Analysis queued' };
  }
}

export default GameService;
