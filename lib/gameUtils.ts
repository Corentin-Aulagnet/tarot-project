import { Games, Players } from "@/utils/supabase/types";
export function getLastPlayers(games: Games[], players: Players[]) {
  
  let playerIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const gameIndex = i;
  if (gameIndex < 0 || gameIndex >= games.length) break;
  const game = games[gameIndex];
  playerIds = [...playerIds].concat(game.players_uid);
  }
  const lastPlayers = players.filter(player => playerIds.includes(player.id));
  if (lastPlayers.length > 0) return lastPlayers;
  
}
export function filterMoreRecent(games:Games[],date:Date) {
  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.created_at);
    return gameDate > date;
  });
  return filteredGames;
}

export function filterInMonth(games:Games[], monthIndex:number) {
  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.created_at);
    return gameDate.getUTCMonth() === monthIndex;
  }); 
  return filteredGames;
}