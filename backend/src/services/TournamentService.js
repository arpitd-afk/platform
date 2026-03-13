const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

class TournamentService {
  /**
   * Swiss Pairing Algorithm
   */
  static generateSwissPairings(players, existingMatches) {
    const played = new Set(
      existingMatches.map(m => `${m.white_id}:${m.black_id}`)
    );
    const hasPlayed = (a, b) => played.has(`${a}:${b}`) || played.has(`${b}:${a}`);

    const pool = [...players];
    const pairs = [];
    const paired = new Set();

    let byePlayer = null;
    if (pool.length % 2 === 1) {
      for (let i = pool.length - 1; i >= 0; i--) {
        if (!pool[i].had_bye) {
          byePlayer = pool[i];
          pool.splice(i, 1);
          break;
        }
      }
      if (!byePlayer) {
        byePlayer = pool.pop();
      }
      pairs.push({ white_id: byePlayer.player_id, black_id: null, is_bye: true });
      paired.add(byePlayer.player_id);
    }

    for (let i = 0; i < pool.length; i++) {
      if (paired.has(pool[i].player_id)) continue;
      
      let found = false;
      for (let j = i + 1; j < pool.length; j++) {
        if (paired.has(pool[j].player_id)) continue;
        if (!hasPlayed(pool[i].player_id, pool[j].player_id)) {
          const [white, black] =
            (pool[i].whites_count || 0) <= (pool[j].whites_count || 0)
              ? [pool[i], pool[j]]
              : [pool[j], pool[i]];
          pairs.push({ white_id: white.player_id, black_id: black.player_id, is_bye: false });
          paired.add(pool[i].player_id);
          paired.add(pool[j].player_id);
          found = true;
          break;
        }
      }

      // If no opponent found that they haven't played, pair with ANY available
      if (!found) {
        for (let j = i + 1; j < pool.length; j++) {
          if (!paired.has(pool[j].player_id)) {
            pairs.push({ white_id: pool[i].player_id, black_id: pool[j].player_id, is_bye: false });
            paired.add(pool[i].player_id);
            paired.add(pool[j].player_id);
            break;
          }
        }
      }
    }
    return pairs;
  }

  /**
   * Round Robin Pairing Algorithm
   */
  static generateRoundRobinPairings(playerIds, round, totalRounds) {
    const n = playerIds.length % 2 === 0 ? playerIds.length : playerIds.length + 1;
    const ids = [...playerIds];
    if (ids.length % 2 === 1) ids.push(null);

    const fixed = ids[0];
    const rotating = ids.slice(1);
    const rotated = [];
    const shift = (round - 1) % (n - 1);
    for (let i = 0; i < rotating.length; i++) {
      rotated.push(rotating[(i + shift) % rotating.length]);
    }
    const circle = [fixed, ...rotated];

    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const white = circle[i];
      const black = circle[n - 1 - i];
      if (white && black) {
        pairs.push({ white_id: round % 2 === 0 ? black : white, black_id: round % 2 === 0 ? white : black, is_bye: false });
      } else {
        const byePlayer = white || black;
        if (byePlayer) pairs.push({ white_id: byePlayer, black_id: null, is_bye: true });
      }
    }
    return pairs;
  }

  /**
   * Knockout Pairing Algorithm
   */
  static generateKnockoutPairings(playersSorted, round) {
    const pairs = [];
    const n = playersSorted.length;
    for (let i = 0; i < Math.floor(n / 2); i++) {
      pairs.push({ white_id: playersSorted[i].player_id, black_id: playersSorted[n - 1 - i].player_id, is_bye: false });
    }
    if (n % 2 === 1) pairs.push({ white_id: playersSorted[Math.floor(n / 2)].player_id, black_id: null, is_bye: true });
    return pairs;
  }

  /**
   * Rollback match scores in standings
   */
  static async rollbackMatchScores(m) {
    if (!m.white_id || m.is_bye) return;
    const ws = parseFloat(m.white_score) || 0;
    const bs = parseFloat(m.black_score) || 0;
    
    if (m.white_id) {
      await query(
        `UPDATE tournament_standings SET score = score - $1,
          wins = GREATEST(wins - $2, 0), draws = GREATEST(draws - $3, 0), losses = GREATEST(losses - $4, 0)
         WHERE tournament_id=$5 AND player_id=$6`,
        [ws, ws === 1 ? 1 : 0, ws === 0.5 ? 1 : 0, ws === 0 ? 1 : 0, m.tournament_id, m.white_id]
      );
    }
    if (m.black_id) {
      await query(
        `UPDATE tournament_standings SET score = score - $1,
          wins = GREATEST(wins - $2, 0), draws = GREATEST(draws - $3, 0), losses = GREATEST(losses - $4, 0)
         WHERE tournament_id=$5 AND player_id=$6`,
        [bs, bs === 1 ? 1 : 0, bs === 0.5 ? 1 : 0, bs === 0 ? 1 : 0, m.tournament_id, m.black_id]
      );
    }
  }

  /**
   * Recalculate Buchholz tiebreak
   */
  static async recalcBuchholz(tournamentId) {
    const matches = await query(
      `SELECT white_id, black_id FROM tournament_matches WHERE tournament_id=$1 AND is_bye=false AND status='completed'`,
      [tournamentId]
    );
    const scores = await query(
      `SELECT player_id, score FROM tournament_standings WHERE tournament_id=$1`,
      [tournamentId]
    );
    const scoreMap = {};
    for (const s of scores.rows) scoreMap[s.player_id] = parseFloat(s.score);

    const buchholz = {};
    for (const m of matches.rows) {
      if (m.white_id && m.black_id) {
        buchholz[m.white_id] = (buchholz[m.white_id] || 0) + (scoreMap[m.black_id] || 0);
        buchholz[m.black_id] = (buchholz[m.black_id] || 0) + (scoreMap[m.white_id] || 0);
      }
    }
    for (const [pid, buch] of Object.entries(buchholz)) {
      await query(
        `UPDATE tournament_standings SET tiebreak1=$1 WHERE tournament_id=$2 AND player_id=$3`,
        [buch, tournamentId, pid]
      );
    }
  }

  /**
   * Re-rank tournament standings
   */
  static async rerank(tournamentId) {
    const standings = await query(
      `SELECT player_id FROM tournament_standings
       WHERE tournament_id=$1 ORDER BY score DESC, tiebreak1 DESC`,
      [tournamentId]
    );
    for (let i = 0; i < standings.rows.length; i++) {
      await query(
        `UPDATE tournament_standings SET rank=$1 WHERE tournament_id=$2 AND player_id=$3`,
        [i + 1, tournamentId, standings.rows[i].player_id]
      );
    }
  }
}

module.exports = TournamentService;
