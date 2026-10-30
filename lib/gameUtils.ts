import { Games, Players } from "@/utils/supabase/types";
export function getLastPlayers(
  games: Pick<Games, "players_uid">[],
  players: Players[],
  gameLimit = 10
) {
  const playerIds = new Set(
    games.slice(0, gameLimit).flatMap(game => game.players_uid)
  );
  const lastPlayers = players.filter(player => playerIds.has(player.id));
  if (lastPlayers.length > 0) return lastPlayers;
}
export function filterMoreRecent(games:Games[],date:Date) {
  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.created_at);
    return gameDate > date;
  });
  return filteredGames;
}

export function filterInMonth<G extends Pick<Games, "created_at">>(games:G[], monthIndex:number) {
  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.created_at);
    return gameDate.getUTCMonth() === monthIndex;
  }); 
  return filteredGames;
}