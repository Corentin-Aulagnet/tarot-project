import { Games, getWinningTeam, Players } from "@/utils/supabase/types";

export type PlayerStatistics = {
  maxScored: number | null;
  maxLost: number | null;
  averageStartingBouts: number | null;
  averageDogBouts: number | null;
  averageCalledBouts: number | null;
  averageEndingBouts: number | null;
  calledCount: number;
  favoriteSuit: string | null;
  gamesPlayed: number;
  gamesWon: number;
  gamesTaken: number;
  averageScoredPointsPerGame: number | null;
  favoriteCalledPlayer: string | null;
  favoriteCalledPlayerCount: number;
  favoriteSuitCount: number;
  suitCallCount: number;
};

type PlayerStatisticsAccumulator = {
  maxScored: number | null;
  maxLost: number | null;
  scoreTotal: number;
  scoreCount: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesTaken: number;
  calledCount: number;
  startingBoutTotal: number;
  startingBoutCount: number;
  dogBoutTotal: number;
  dogBoutGameCount: number;
  calledBoutTotal: number;
  calledBoutGameCount: number;
  endingBoutTotal: number;
  suitCounts: Map<string, number>;
  calledPlayerCounts: Map<Players["id"], number>;
};

export function getAllPlayerStatistics(
  players: Players[],
  games: Games[],
  gamePlayerTotals: Record<Games["id"], Record<Players["id"], number>>
): Record<Players["id"], PlayerStatistics> {
  const accumulators = new Map<Players["id"], PlayerStatisticsAccumulator>(
    players.map(player => [player.id, {
      maxScored: null,
      maxLost: null,
      scoreTotal: 0,
      scoreCount: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesTaken: 0,
      calledCount: 0,
      startingBoutTotal: 0,
      startingBoutCount: 0,
      dogBoutTotal: 0,
      dogBoutGameCount: 0,
      calledBoutTotal: 0,
      calledBoutGameCount: 0,
      endingBoutTotal: 0,
      suitCounts: new Map(),
      calledPlayerCounts: new Map(),
    }])
  );

  for (const game of games) {
    const winningTeam = new Set(getWinningTeam(game));
    const scores = gamePlayerTotals[game.id] ?? {};

    for (const playerId of game.players_uid) {
      const stats = accumulators.get(playerId);
      if (!stats) continue;
      stats.gamesPlayed += 1;
      if (winningTeam.has(playerId)) stats.gamesWon += 1;

      const score = scores[playerId];
      if (score !== undefined) {
        stats.scoreTotal += score;
        stats.scoreCount += 1;
        stats.maxScored = stats.maxScored === null
          ? score
          : Math.max(stats.maxScored, score);
        if (score < 0) {
          stats.maxLost = stats.maxLost === null
            ? score
            : Math.min(stats.maxLost, score);
        }
      }
    }

    const calledPlayerStats = accumulators.get(game.call_id);
    if (calledPlayerStats) calledPlayerStats.calledCount += 1;

    const takerStats = accumulators.get(game.taker_id);
    if (!takerStats) continue;
    takerStats.gamesTaken += 1;
    takerStats.endingBoutTotal += game.n_bouts;
    const gameDate = game.created_at.slice(0, 10);
    if (gameDate >= "2026-10-22" && game.n_bouts_hand_start !== null) {
      takerStats.startingBoutTotal += game.n_bouts_hand_start;
      takerStats.startingBoutCount += 1;
    }
    if (gameDate >= "2026-10-23") {
      takerStats.calledBoutTotal += game.n_bouts_called ?? 0;
      takerStats.calledBoutGameCount += 1;
      if (game.contract !== "Garde-Contre") {
        takerStats.dogBoutTotal += game.n_bouts_dog ?? 0;
        takerStats.dogBoutGameCount += 1;
      }
    }
    if (game.call_color) {
      takerStats.suitCounts.set(
        game.call_color,
        (takerStats.suitCounts.get(game.call_color) ?? 0) + 1
      );
    }
    if (game.call_id) {
      takerStats.calledPlayerCounts.set(
        game.call_id,
        (takerStats.calledPlayerCounts.get(game.call_id) ?? 0) + 1
      );
    }
  }

  const playerNames = new Map(players.map(player => [player.id, player.Name]));
  const result = {} as Record<Players["id"], PlayerStatistics>;

  for (const player of players) {
    const stats = accumulators.get(player.id)!;
    const favoriteSuitEntry = [...stats.suitCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const favoriteCalledPlayerEntry = [...stats.calledPlayerCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0];
    const favoriteCalledPlayerId = favoriteCalledPlayerEntry?.[0];

    result[player.id] = {
      maxScored: stats.maxScored,
      maxLost: stats.maxLost,
      averageStartingBouts: stats.startingBoutCount
        ? stats.startingBoutTotal / stats.startingBoutCount
        : null,
      averageDogBouts: stats.dogBoutGameCount
        ? stats.dogBoutTotal / stats.dogBoutGameCount
        : null,
      averageCalledBouts: stats.calledBoutGameCount
        ? stats.calledBoutTotal / stats.calledBoutGameCount
        : null,
      averageEndingBouts: stats.gamesTaken
        ? stats.endingBoutTotal / stats.gamesTaken
        : null,
      calledCount: stats.calledCount,
      favoriteSuit: favoriteSuitEntry?.[0] ?? null,
      gamesPlayed: stats.gamesPlayed,
      gamesWon: stats.gamesWon,
      gamesTaken: stats.gamesTaken,
      averageScoredPointsPerGame: stats.scoreCount
        ? stats.scoreTotal / stats.scoreCount
        : null,
      favoriteCalledPlayer: favoriteCalledPlayerId === player.id
        ? player.Name
        : favoriteCalledPlayerId
          ? playerNames.get(favoriteCalledPlayerId) ?? null
          : null,
      favoriteCalledPlayerCount: favoriteCalledPlayerEntry?.[1] ?? 0,
      favoriteSuitCount: favoriteSuitEntry?.[1] ?? 0,
      suitCallCount: [...stats.suitCounts.values()].reduce((total, count) => total + count, 0),
    };
  }

  return result;
}

export function getPlayerStatistics(
  player: Players,
  games: Games[],
  players: Players[],
  gamePlayerTotals: Record<Games["id"], Record<Players["id"], number>>
): PlayerStatistics {
  return getAllPlayerStatistics(players, games, gamePlayerTotals)[player.id];
}
