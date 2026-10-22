import { Games, getWinningTeam, Players } from "@/utils/supabase/types";

export type PlayerStatistics = {
  maxScored: number | null;
  maxLost: number | null;
  averageStartingBouts: number | null;
  averageEndingBouts: number | null;
  calledCount: number;
  favoriteSuit: string | null;
  gamesPlayed: number;
  gamesWon: number;
  gamesTaken: number;
  averageScoredPointsPerGame: number | null;
  favoriteCalledPlayer: string | null;
  favoriteCalledPlayerCount: number;
};

export function getPlayerStatistics(
  player: Players,
  games: Games[],
  players: Players[],
  gamePlayerTotals: Record<Games["id"], Record<Players["id"], number>>
): PlayerStatistics {
  const playedGames = games.filter(game => game.players_uid.includes(player.id));
  const scores = playedGames
    .map(game => gamePlayerTotals[game.id]?.[player.id])
    .filter((score): score is number => score !== undefined);
  const takerGames = games.filter(game => game.taker_id === player.id);
  const gamesWithStartingBouts = takerGames.filter(
    game => game.n_bouts_hand_start !== null
  );
  const suitCounts = new Map<string, number>();
  const calledPlayerCounts = new Map<Players["id"], number>();
  takerGames.forEach(game => {
    if (game.call_color) {
      suitCounts.set(game.call_color, (suitCounts.get(game.call_color) ?? 0) + 1);
    }
    if (game.call_id) {
      calledPlayerCounts.set(
        game.call_id,
        (calledPlayerCounts.get(game.call_id) ?? 0) + 1
      );
    }
  });
  const favoriteSuit = [...suitCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
  const favoriteCalledPlayerEntry = [...calledPlayerCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0];
  const favoriteCalledPlayerId = favoriteCalledPlayerEntry?.[0];
  const favoriteCalledPlayer = favoriteCalledPlayerId === player.id
    ? player.Name
    : players.find(candidate => candidate.id === favoriteCalledPlayerId)?.Name ?? null;
  const negativeScores = scores.filter(score => score < 0);

  return {
    maxScored: scores.length ? Math.max(...scores) : null,
    maxLost: negativeScores.length ? Math.min(...negativeScores) : null,
    averageStartingBouts: gamesWithStartingBouts.length
      ? gamesWithStartingBouts.reduce(
        (total, game) => total + (game.n_bouts_hand_start ?? 0),
        0
      ) / gamesWithStartingBouts.length
      : null,
    averageEndingBouts: takerGames.length
      ? takerGames.reduce((total, game) => total + game.n_bouts, 0) / takerGames.length
      : null,
    calledCount: games.filter(game => game.call_id === player.id).length,
    favoriteSuit,
    gamesPlayed: playedGames.length,
    gamesWon: playedGames.filter(game => getWinningTeam(game).includes(player.id)).length,
    gamesTaken: takerGames.length,
    averageScoredPointsPerGame: scores.length
      ? scores.reduce((total, score) => total + score, 0) / scores.length
      : null,
    favoriteCalledPlayer,
    favoriteCalledPlayerCount: favoriteCalledPlayerEntry?.[1] ?? 0,
  };
}
