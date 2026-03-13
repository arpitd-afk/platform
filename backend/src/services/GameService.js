const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class GameService {
  /**
   * Calculate new ratings based on ELO algorithm
   */
  static calculateNewRatings(whiteRating, blackRating, result) {
    const K = 32;
    const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
    const expectedBlack = 1 - expectedWhite;

    let whiteScore, blackScore;
    if (result.winner === 'white') { whiteScore = 1; blackScore = 0; }
    else if (result.winner === 'black') { whiteScore = 0; blackScore = 1; }
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
  static async updateRatings(whiteId, blackId, result) {
    try {
      const [whiteRes, blackRes] = await Promise.all([
        query('SELECT rating FROM users WHERE id = $1', [whiteId]),
        query('SELECT rating FROM users WHERE id = $1', [blackId]),
      ]);

      const whiteRating = whiteRes.rows[0]?.rating || 1200;
      const blackRating = blackRes.rows[0]?.rating || 1200;

      const newRatings = this.calculateNewRatings(whiteRating, blackRating, result);

      await Promise.all([
        query('UPDATE users SET rating = $1 WHERE id = $2', [newRatings.white, whiteId]),
        query('UPDATE users SET rating = $1 WHERE id = $2', [newRatings.black, blackId]),
      ]);
      
      return newRatings;
    } catch (err) {
      logger.error('Rating update error:', err);
      throw err;
    }
  }

  /**
   * Initialize a new game state
   */
  static initializeGame(whiteId, blackId, timeControl, mode) {
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
}

module.exports = GameService;
