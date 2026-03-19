import { Chess } from 'chess.js';
import { prisma } from '../lib/prisma';
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
      const whiteUser = await prisma.user.findUnique({ where: { id: whiteId }, select: { rating: true } });
      const blackUser = await prisma.user.findUnique({ where: { id: blackId }, select: { rating: true } });

      const whiteRating = whiteUser?.rating || 1200;
      const blackRating = blackUser?.rating || 1200;

      const newRatings = this.calculateNewRatings(whiteRating, blackRating, winner);

      await prisma.$transaction([
        prisma.user.update({ where: { id: whiteId }, data: { rating: newRatings.white } }),
        prisma.user.update({ where: { id: blackId }, data: { rating: newRatings.black } }),
        // Log rating history
        prisma.ratingHistory.create({
          data: {
            user_id: whiteId,
            rating: newRatings.white,
            change: newRatings.white - whiteRating,
          }
        }),
        prisma.ratingHistory.create({
          data: {
            user_id: blackId,
            rating: newRatings.black,
            change: newRatings.black - blackRating,
          }
        })
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
    const chess = new Chess();
    
    const [baseMinutes, incrementSeconds] = timeControl.split('+').map(Number);
    const baseTimeMs = (baseMinutes || 10) * 60 * 1000;
    const incrementMs = (incrementSeconds || 0) * 1000;

    return {
      id: '', // to be filled after DB creation
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

  static async getGameById(id: string): Promise<any | null> {
    // Try Redis session state first for active games
    try {
      const cached = await redisSession.getGameState(id);
      if (cached) return cached;
    } catch (err) {
      logger.error('Redis getGameState error:', err);
    }

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        white_player: { select: { name: true, rating: true, avatar: true } },
        black_player: { select: { name: true, rating: true, avatar: true } },
      },
    });

    if (!game) return null;

    return {
      ...game,
      white_name: game.white_player?.name,
      white_rating: game.white_player?.rating,
      white_avatar: game.white_player?.avatar,
      black_name: game.black_player?.name,
      black_rating: game.black_player?.rating,
      black_avatar: game.black_player?.avatar,
    };
  }

  static async listGames(params: { userId: string, status?: string, page?: number, limit?: number }) {
    const { userId, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ white_player_id: userId }, { black_player_id: userId }],
    };

    if (status) {
      where.status = status;
    }

    const games = await prisma.game.findMany({
      where,
      include: {
        white_player: { select: { name: true, rating: true } },
        black_player: { select: { name: true, rating: true } },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    });

    return {
      games: games.map(g => ({
        ...g,
        white_name: g.white_player?.name,
        white_rating: g.white_player?.rating,
        black_name: g.black_player?.name,
        black_rating: g.black_player?.rating,
      })),
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
    const initialTemp = this.initializeGame(whiteId, blackId, timeControl, mode);

    const game = await prisma.game.create({
      data: {
        white_player_id: whiteId,
        black_player_id: blackId,
        fen: initialTemp.fen,
        pgn: initialTemp.pgn,
        status: 'waiting',
        time_control: timeControl,
        white_time_ms: initialTemp.whiteTimeMs,
        black_time_ms: initialTemp.blackTimeMs,
        increment_ms: initialTemp.incrementMs,
        mode,
        tournament_id: tournamentId || null,
        classroom_id: classroomId || null,
      },
    });

    const gameState: GameState = {
      ...initialTemp,
      id: game.id,
    };

    await redisSession.setGameState(game.id, gameState);

    // Notify via socket
    if ((global as any).io) {
      (global as any).io.to(`user:${whiteId}`).emit('game:created', { gameId: game.id, color: 'white' });
      (global as any).io.to(`user:${blackId}`).emit('game:created', { gameId: game.id, color: 'black' });
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
    let gameOverResult: any | null = null;
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
      await prisma.game.update({
        where: { id: gameId },
        data: {
          fen: gameState.fen,
          pgn: gameState.pgn,
          status: gameState.status,
          result: gameState.result || undefined,
          updated_at: new Date(),
        },
      });

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

    await prisma.game.update({
      where: { id: gameId },
      data: { status: 'completed', result: gameState.result as any, updated_at: new Date() },
    });

    if (gameState.mode === 'rated') {
      await this.updateRatings(gameState.whiteId, gameState.blackId, winner);
    }

    if ((global as any).io) {
      (global as any).io.to(`game:${gameId}`).emit('game:over', { winner, reason: 'resignation' });
    }

    return gameState.result;
  }

  static async getAnalysis(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { analysis: true },
    });
    return game?.analysis;
  }

  static async analyze(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { analysis: true },
    });
    
    if (game?.analysis) return { message: 'Analysis already exists or is queued' };

    await prisma.game.update({
      where: { id: gameId },
      data: {
        analysis: { status: 'queued' } as any,
      },
    });
    return { message: 'Analysis queued' };
  }
}

export default GameService;
