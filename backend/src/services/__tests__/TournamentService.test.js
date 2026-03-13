const TournamentService = require('../TournamentService');

describe('TournamentService', () => {
  describe('generateSwissPairings', () => {
    it('should generate pairings for even number of players', () => {
      const players = [
        { player_id: 'p1', score: 2, whites_count: 1 },
        { player_id: 'p2', score: 2, whites_count: 1 },
        { player_id: 'p3', score: 1, whites_count: 1 },
        { player_id: 'p4', score: 1, whites_count: 1 },
      ];
      const existingMatches = [];

      const pairings = TournamentService.generateSwissPairings(players, existingMatches);

      expect(pairings).toHaveLength(2);
      expect(pairings[0].is_bye).toBe(false);
      expect(pairings[1].is_bye).toBe(false);
    });

    it('should assign a bye for odd number of players', () => {
      const players = [
        { player_id: 'p1', score: 2, had_bye: false },
        { player_id: 'p2', score: 1, had_bye: false },
        { player_id: 'p3', score: 0, had_bye: false },
      ];
      const existingMatches = [];

      const pairings = TournamentService.generateSwissPairings(players, existingMatches);

      expect(pairings).toHaveLength(2);
      const byePair = pairings.find(p => p.is_bye);
      expect(byePair).toBeDefined();
      expect(byePair.white_id).toBe('p3'); // Lowest score gets bye
    });
  });

  describe('generateRoundRobinPairings', () => {
    it('should generate pairings for a round', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4'];
      const pairings = TournamentService.generateRoundRobinPairings(playerIds, 1, 3);

      expect(pairings).toHaveLength(2);
      const allPaired = new Set();
      pairings.forEach(p => {
        allPaired.add(p.white_id);
        allPaired.add(p.black_id);
      });
      expect(allPaired.size).toBe(4);
    });
  });
});
