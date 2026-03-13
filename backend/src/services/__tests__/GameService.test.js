const GameService = require('../GameService');

describe('GameService', () => {
  describe('calculateNewRatings', () => {
    it('should correctly update ratings for white win', () => {
      const whiteRating = 1200;
      const blackRating = 1200;
      const result = { winner: 'white' };
      
      const newRatings = GameService.calculateNewRatings(whiteRating, blackRating, result);
      
      expect(newRatings.white).toBeGreaterThan(1200);
      expect(newRatings.black).toBeLessThan(1200);
      expect(newRatings.white + newRatings.black).toBe(2400);
    });

    it('should correctly update ratings for black win', () => {
      const whiteRating = 1200;
      const blackRating = 1200;
      const result = { winner: 'black' };
      
      const newRatings = GameService.calculateNewRatings(whiteRating, blackRating, result);
      
      expect(newRatings.white).toBeLessThan(1200);
      expect(newRatings.black).toBeGreaterThan(1200);
      expect(newRatings.white + newRatings.black).toBe(2400);
    });

    it('should correctly update ratings for draw', () => {
      const whiteRating = 1500; // Stronger player
      const blackRating = 1200; // Weaker player
      const result = { winner: null }; // Draw
      
      const newRatings = GameService.calculateNewRatings(whiteRating, blackRating, result);
      
      // Stronger player should lose some points in a draw
      expect(newRatings.white).toBeLessThan(1500);
      expect(newRatings.black).toBeGreaterThan(1200);
    });
  });

  describe('initializeGame', () => {
    it('should initialize game with correct data', () => {
      const whiteId = 'w1';
      const blackId = 'b1';
      const timeControl = '10+5';
      const mode = 'ranked';

      const game = GameService.initializeGame(whiteId, blackId, timeControl, mode);

      expect(game.whiteId).toBe(whiteId);
      expect(game.blackId).toBe(blackId);
      expect(game.timeControl).toBe(timeControl);
      expect(game.whiteTimeMs).toBe(10 * 60 * 1000);
      expect(game.incrementMs).toBe(5 * 1000);
      expect(game.status).toBe('waiting');
      expect(game.moves).toHaveLength(0);
    });
  });
});
