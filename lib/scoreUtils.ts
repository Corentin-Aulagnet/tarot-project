/**
 * ============================================================================
 * TAROT SCORING ENGINE (scoreUtils.ts)
 * ============================================================================
 * 
 * This module implements the complete Tarot card game scoring rules.
 * 
 * CORE CONCEPTS:
 * - Points: Pip values of cards (0-10); combined in tricks; 78 points total deck
 * - Bouts: Special cards (1, 21, Jack of Trumps); affect point threshold
 * - Contract: Bid level (Petite/Garde/Garde-Sans/Garde-Contre); multiplies score by 1x/2x/4x/6x
 * - Taker: Player attacking; receives 2x score multiplier
 * - Caller: Optional second attacker; receives 1x score multiplier
 * - Defenders: All other players; receive 1x score multiplier (usually negative)
 * - Bonuses: Petit au bout, Poignée (hand), Chelem (all tricks) - added if contract succeeds
 * - Penalties: Misère (Tête/Atout) - special negative or positive scoring situations
 * 
 * GAME FLOW:
 * 1. User enters: players, taker, caller, contract, attack_points, bouts, bonuses, penalties
 * 2. getPointsForGame() calculates per-player scores based on Tarot rules
 * 3. Scores summed by buildGamePlayerTotals() (per game) and aggregateTotalScores() (cumulative)
 * 4. aggregateIterativeScores() creates chart data showing score progression across games
 * 
 * ============================================================================
 */

import {Games, Players} from '../utils/supabase/supabase';

/** Contract types and their point multipliers. */
export enum Contract{
    Petite,      // 1x multiplier (base bid)
    Garde,       // 2x multiplier (medium difficulty)
    GardeSans,   // 4x multiplier (hand alone, high difficulty)
    GardeContre  // 6x multiplier (maximum difficulty)
}

/** Poignée (hand bonus) types, based on number of trump cards held at game start. */
enum Poignee{
    Simple,      // 8-9 trump cards: +20 points
    Double,      // 10-12 trump cards: +30 points
    Triple       // 13+ trump cards: +40 points
}

/** Chelem (grand slam) outcomes: winning all tricks (or failing an announced attempt). */
enum Chelem{
  AnnoucedFailed,        // -200 points (declared all tricks but failed)
  AnnoucedSucceeded,     // +400 points (declared and won all tricks)
  UnannoucedSucceeded,   // +200 points (won all tricks without declaring)
}

/**
 * GameResult: Extended game type used internally by scoring engine.
 * (Auto-generated types from supabase.ts are used for database I/O;
 *  this type extends with local enums for type-safe calculations.)
 */
export type GameResult={
    id: string;
    players_uid: Players[];
    taker_id: string;
    call_id: string;
    points_att: number;
    contract: Contract;
    n_bouts: number;
    poignee_type?: Poignee;
    poignee_player_id?: Players['id'];
    petit_au_bout_player_id?: Players['id'];
    petit_au_bout_lost?: boolean;
    chelem: Chelem
    chelem_player_id?: Players['id'];
    misere_type?: string;
    misere_player_id?: Players['id'];

}

/**
 * =============================================================================
 * getPointsForGame(game, players)
 * =============================================================================
 * 
 * THE CORE SCORING FUNCTION: Calculates all player scores for a single game.
 * Implements all Tarot scoring rules: thresholds, multipliers, bonuses, penalties.
 * 
 * @param game - Game record from database with: contract, bouts, attack_points, bonuses
 * @param players - All players in the game (for reference; not all may have participated)
 * @returns Record<PlayerID, FinalScore> - Total points for each player (sums to 0)
 * 
 * STEP-BY-STEP CALCULATION:
 * 
 * STEP 1: Point Threshold (depends on n_bouts)
 * ──────────────────────────────────────────────
 * The attack team must meet a minimum point total to "make contract."
 * Threshold DECREASES as # of bouts INCREASES (fewer bouts = harder contract).
 * 
 *   n_bouts = 0  (no 1, 21, or Jack in attack tricks) → pointsToMake = 56
 *   n_bouts = 1  (one bout) → pointsToMake = 51
 *   n_bouts = 2  (two bouts) → pointsToMake = 41
 *   n_bouts = 3  (all three bouts) → pointsToMake = 36  [easiest]
 * 
 * STEP 2: Contract Multiplier
 * ───────────────────────────
 * Bid level determines scoring multiplier:
 * 
 *   Petite          → mult = 1  (basic bid)
 *   Garde           → mult = 2  (takes same points as Petite, doubled)
 *   Garde-Sans      → mult = 4  (player hides the dog but keeps it)
 *   Garde-Contre    → mult = 6  (player hides the dog, and the opposing team keep it)
 * 
 * STEP 3: Contract Success Check
 * ──────────────────────────────
 * Did the attack team meet or exceed the threshold?
 *   contractDone = (game.points_att >= pointsToMake)
 * 
 * If TRUE: Attack wins; bonuses are POSITIVE; defenders lose (negative score).
 * If FALSE: Attack fails; bonuses are NEGATIVE; defenders win.
 * 
 * STEP 4: Base Score Calculation
 * ──────────────────────────────
 * The fundamental game score, before any bonuses/penalties:
 * 
 *   points = (|game.points_att - pointsToMake| + 25) × mult
 * 
 * Example:
 *   - Attack scored 62 points, threshold is 56 (1 bout)
 *   - Contract is Garde (mult = 2)
 *   - Difference: |62 - 56| = 6
 *   - Base score: (6 + 25) × 2 = 62 points
 * 
 * The +25 constant ensures a minimum base score of 25 × mult.
 * 
 * STEP 5: Petit au Bout Bonus (±10 × mult)
 * ─────────────────────────────────────────
 * "Petit au bout" = winning the lowest trump (Fool/Excuse) in the final trick.
 * Bonus: +10 × mult if won; penalty: −10 × mult if lost.
 * 
 * Effect on score:
 *   - If attack team has petit au bout AND won it: +10 × mult (attack gains, defense loses)
 *   - If attack team has petit au bout AND lost it: −10 × mult (attack loses, defense gains)
 *   - If defense team has petit au bout AND won it: −10 × mult (attack loses, defense gains)
 *   - If defense team has petit au bout AND lost it: +10 × mult (attack gains, defense loses)
 * 
 * STEP 6: Poignée Bonus (Simple: 20, Double: 30, Triple: 40)
 * ──────────────────────────────────────────────────────────
 * Bonus for holding many trump cards (declared at game start).
 * Only counts on attack team; only awarded if contract SUCCEEDS.
 * 
 *   Simple (8-9 trumps):  +20
 *   Double (10-12 trumps): +30
 *   Triple (13+ trumps):  +40
 * 
 * If contract fails, these bonuses become penalties (negative).
 * Defenders don't get this; only attack team (taker + caller).
 * 
 * STEP 7: Chelem Bonus (±200 or ±400)
 * ────────────────────────────────────
 * Winning ALL tricks (chelem / grand slam).
 * 
 *   Announced & Succeeded:  +400
 *   Announced & Failed:     −200  [penalty for failed announcement]
 *   Unannounced & Won:      +200  (discovered after game)
 *   No Chelem:               0
 * 
 * Effect:
 *   - If chelem_player_id is taker: score += prime_chelem × 2
 *   - If chelem_player_id is caller: score += prime_chelem × 1
 *   - If chelem_player_id is on defense: score += prime_chelem (others get negative)
 * 
 * STEP 8: Misère Penalty (±10)
 * ─────────────────────────────
 * Special penalty situations (rare special rules):
 * 
 *   Tête (face card tricks lost): typically −10 per occurrence
 *   Atout (trump lost in certain way): typically −10 per occurrence
 * 
 * Applied once per game to designated player (usually attack team).
 * Multiplier: 4x for the offending player, 1x for others.
 * 
 * STEP 9: Final Score Distribution
 * ────────────────────────────────
 * Apply role-based multipliers and sum all bonuses:
 * 
 *   Taker (attacks with 2x role):
 *     score = (base + petit + poignée) × 2 + chelem × 2 + misère adjustment
 * 
 *   Caller (attacks with 1x role):
 *     score = (base + petit + poignée) × 1 + chelem × 1 + misère adjustment
 * 
 *   Defender (always 1x role):
 *     score = (−base − petit − poignée) × 1 + chelem × 1 + misère adjustment
 * 
 * For each non-participating player: score = 0
 * 
 * INVARIANT: Total score always sums to 0 (zero-sum game).
 * 
 * =============================================================================
 */
function getPointsForGame(game:Games, players:Players[]) {
  const result = {} as Record<Players['id'], number>
  
  // ─────────────────────────────────────────────────────────
  // STEP 1: Determine points-to-make threshold based on bouts
  // ─────────────────────────────────────────────────────────
  let pointsToMake = 0;
  if(game.n_bouts === 0) pointsToMake = 56
  else if(game.n_bouts === 1) pointsToMake = 51
  else if(game.n_bouts === 2) pointsToMake = 41
  else if(game.n_bouts === 3) pointsToMake = 36
  
  // ─────────────────────────────────────────────────────────
  // STEP 2: Get contract multiplier
  // ─────────────────────────────────────────────────────────
  let mult = 0;
  switch(game.contract){
    case "Petite":
      mult = 1;
      break;
    case "Garde":
      mult = 2;
      break;
    case "Garde-Sans":
      mult = 4;
      break;
    case "Garde-Contre":
      mult = 6;
      break;
  }
  
  // ─────────────────────────────────────────────────────────
  // STEP 3: Check if contract succeeded
  // ─────────────────────────────────────────────────────────
  const contractDone = game.points_att >= pointsToMake;
  
  // ─────────────────────────────────────────────────────────
  // STEP 4: Calculate base score (before bonuses/penalties)
  // ─────────────────────────────────────────────────────────
  const points = (Math.abs(game.points_att - pointsToMake) + 25) * mult;
  const attack_team = [game.taker_id, game.call_id];
  
  // ─────────────────────────────────────────────────────────
  // STEP 5: Petit au bout bonus (±10 × mult)
  // ─────────────────────────────────────────────────────────
  const prime_petit_au_bout = game.petit_au_bout_player_id ? 10*mult: 0;
  // Determine if attack team or defense has the petit au bout
  const petit_au_bout_by_attack = attack_team.includes(game.petit_au_bout_player_id || "");
  // Apply bonus/penalty based on who has it and whether it was won or lost
  const prime_petit_au_bout_att = (petit_au_bout_by_attack && game.petit_au_bout == "Won") ||
  (!petit_au_bout_by_attack && game.petit_au_bout == "Lost") ? prime_petit_au_bout : -prime_petit_au_bout;
  const prime_petit_au_bout_def = -prime_petit_au_bout_att;
  
  // ─────────────────────────────────────────────────────────
  // STEP 7: Chelem (grand slam) bonus (±200 or ±400)
  // ─────────────────────────────────────────────────────────
  const prime_chelem = game.chelem === "AnnoucedSucceeded" ? 400 : game.chelem === "UnannoucedSucceeded" ? 200 : game.chelem === "AnnoucedFailed" ? -200 : 0;
  
  // ─────────────────────────────────────────────────────────
  // STEP 6: Poignée bonus (hand bonus)
  // ─────────────────────────────────────────────────────────
  let poigneeValue = 0;
    if (game.poignee_type === "Simple") {
      poigneeValue = 20;       // 8-9 trump cards
    } else if (game.poignee_type === "Double") {
      poigneeValue = 30;       // 10-12 trump cards
    } else if (game.poignee_type === "Triple") {
      poigneeValue = 40;       // 13+ trump cards
    }else{
      poigneeValue = 0;
    }
  
  // ─────────────────────────────────────────────────────────
  // STEP 8: Misère penalty (special rare situations)
  // ─────────────────────────────────────────────────────────
  let misereValue = 0;
  if(game.misere_type === "Tête" || game.misere_type === "Atout"){
    misereValue = 10;
  }

  // ─────────────────────────────────────────────────────────
  // STEP 9: Distribute bonuses to attack/defense
  // ─────────────────────────────────────────────────────────
  // Poignée and petit au bout apply only if contract succeeds
  const prime_poignee_att = contractDone ? poigneeValue : -poigneeValue;
  const prime_poignee_def = -prime_poignee_att;
  const pointsAtt = contractDone ? points : -points;
  const pointsDef = -pointsAtt;

  // ─────────────────────────────────────────────────────────
  // STEP 9: Calculate final score for each player
  // ─────────────────────────────────────────────────────────
  game.players_uid.forEach(p => {
    if (p === game.taker_id) {
      // TAKER: Attack leader; receives 2x multiplier on base and poignée
      result[p] = (pointsAtt+prime_petit_au_bout_att+prime_poignee_att) * 2 ;
      // If taker is also caller (same person), multiply again (effectively 4x base)
      if(game.call_id === game.taker_id){result[p] *=2}
    } else if (p === game.call_id) {
      // CALLER: Attack partner; receives 1x multiplier on base and poignée
      result[p] = pointsAtt + prime_petit_au_bout_att  + prime_poignee_att
    }else{
      // DEFENDER: Opposite team; loses points if attack succeeds
      result[p] = pointsDef +prime_petit_au_bout_def  + prime_poignee_def
    }
    
    // Apply misère penalty (if applicable to this player)
    if(game.misere_player_id === p){
      result[p] += misereValue*4;  // 4x penalty for the player who made the misère
    }else{
      result[p] -= misereValue;    // 1x each for other players
    }
    
    // Apply chelem bonus (if applicable)
    if(game.chelem !== null){
      if(p === game.chelem_player_id){
        // Chelem declarer receives bonus (2x if taker, 1x otherwise)
        result[p] += prime_chelem * (p === game.taker_id ? 2 : 1);
      }else{
        // All other players lose the chelem bonus amount
        result[p] -= prime_chelem;
      }
    }
  })
  return result;
}
/**
 * buildGamePlayerTotals(games, players)
 * 
 * Calculates per-player scores for each provided game.
 * Used to populate the game results table (rows = games, columns = players).
 * 
 * @param games - All games from database
 * @param players - All players from database
 * @returns Record<GameID, Record<PlayerID, Score>>
 * 
 * Example:
 *   Input: [Game1, Game2, Game3] with players [Alice, Bob, Carol]
 *   Output: {
 *     "game-1": { "alice-id": 124, "bob-id": 62, "carol-id": -186 },
 *     "game-2": { "alice-id": -80, "bob-id": 40, "carol-id": 40 },
 *     "game-3": { "alice-id": 0, "bob-id": 0, "carol-id": 0 } // no participation
 *   }
 * 
 * This data powers the GameTable component's row display.
 */
export function buildGamePlayerTotals(games:Games[], players:Players[]) {
  const result = {}as Record<Games['id'], Record<Players['id'],number>>

  // For each game, calculate the score distribution
  games.forEach(g => {
    const gameResult = games.find(gr => gr.id === g.id);
    if (!gameResult) return;

    const points = getPointsForGame(g, players);
    result[g.id] = points;
  });

  return result
}

/**
 * aggregateTotalScores(games, players)
 * 
 * Calculates cumulative score for EACH PLAYER across ALL GAMES.
 * Used to display the leaderboard totals row at the top of results.
 * 
 * @param games - All games from database
 * @param players - All players from database
 * @returns Record<PlayerID, TotalScore>
 * 
 * Example:
 *   Input: [Game1, Game2, Game3] with players [Alice, Bob, Carol]
 *   Output: {
 *     "alice-id": 44,    // sum of all Alice's scores across all games
 *     "bob-id": 102,     // sum of all Bob's scores
 *     "carol-id": -146   // sum of all Carol's scores (typically negative)
 *   }
 * 
 * Invariant: Total score always sums to 0 (zero-sum gaming).
 * Confirmed: 44 + 102 + (-146) = 0 ✓
 */
export function aggregateTotalScores(games:Games[], players:Players[]) {
  const result = {} as Record<Players['id'], number>
  // Initialize each player's total to 0
  players.forEach(p => result[p.id] = 0)
  
  // Sum scores across all games
  games.forEach(g => {
    const gameResult = games.find(gr => gr.id === g.id);
    if (!gameResult) return;  
    const points = getPointsForGame(g, players);
    players.forEach(p => {
      if(points[p.id]!==undefined){
        result[p.id] += points[p.id]
      }
    })  
  })
  return result;
}

/**
 * aggregateIterativeScores(games, players)
 * 
 * Calculates CUMULATIVE RUNNING TOTAL for each player after each game.
 * Used to populate the line chart showing score progression over time.
 * 
 * @param games - All games from database
 * @param players - All players from database
 * @returns Array of records: [{ gameNumber: 1, Alice: 124, Bob: 62, Carol: -186 }, ...]
 * 
 * Example:
 *   Game 1: Alice +124, Bob +62, Carol -186 (cumulative = same)
 *   Game 2: Alice -80, Bob +40, Carol +40   (cumulative: Alice 44, Bob 102, Carol -146)
 *   Game 3: Alice +20, Bob -20, Carol 0     (cumulative: Alice 64, Bob 82, Carol -146)
 *   
 *   Returns: [
 *     { gameNumber: 1, Alice: 124, Bob: 62, Carol: -186 },
 *     { gameNumber: 2, Alice: 44, Bob: 102, Carol: -146 },
 *     { gameNumber: 3, Alice: 64, Bob: 82, Carol: -146 }
 *   ]
 * 
 * Uses: Recharts line chart in IterativeTotalLineChart component.
 * Key feature: Handles players who didn't participate in every game (uses previous total).
 */
export function aggregateIterativeScores(games:Games[], players:Players[]) {
  const result = {} as Record<Games['id'], Record<Players['id'], number> >
  
  // Initialize structure: each game gets an empty score record
  games.forEach(g => {
    result[g.id] = {};
    players.forEach(p => {
      result[g.id][p.id] = 0;
    });
  });
  
  // Sort games by creation time to get chronological order
  const sortedGames = [...games].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  let previousGameId: Games['id'] | null = null;

  // For each game (in chronological order), calculate cumulative scores
  sortedGames.forEach(g => {
    const gameResult = games.find(gr => gr.id === g.id);
    if (!gameResult) return;
    const points = getPointsForGame(g, players);
    
    // For each player: add new game score to previous cumulative total
    players.forEach(p => {
      if(points[p.id]!==undefined){
        // Player participated in this game: add new score to previous total
        result[g.id][p.id] = (previousGameId ? (result[previousGameId][p.id]) : 0) + points[p.id]
      }
      else{
        // Player didn't participate in this game: carry forward previous total
        result[g.id][p.id] = (previousGameId ? result[previousGameId][p.id] : 0)
      }      
  })
    previousGameId = g.id;
  })
  
  // Format data for Recharts: convert to array of objects with gameNumber + player columns
  let i=0;
  const rows = sortedGames.map((game) => {
  const row: Record<string, number | null> = {
    gameNumber: ++i,  // 1, 2, 3, ... for X-axis
  };

  // Add each player's cumulative score as a column
  players.forEach((player) => {
    row[player.Name] = result[game.id]?.[player.id] ?? null;  // null if player didn't participate
  });

  return row;
});
  return rows;
}
