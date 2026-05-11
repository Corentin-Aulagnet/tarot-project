import {Database,Constants,TablesInsert} from './local_supabase';
    
export type Games = Database["public"]["Tables"]["Games"]["Row"];
export type Players = Database["public"]["Tables"]["Players"]["Row"];
export type GamesInsert = TablesInsert<'Games'>;
export type PlayerInsert = TablesInsert<'Players'>;
export function getWinningTeam(game: Games): string[] {
  // Implementation for determining the winning team
  const attackers = [game.taker_id, game.call_id].filter(id => id !== null) as string[];
  const defenders = game.players_uid.filter(id => !attackers.includes(id));
  const attackWon = (game.points_att >= 56 && game.n_bouts === 0) || (game.points_att >= 51 && game.n_bouts === 1) || (game.points_att >= 41 && game.n_bouts === 2) || (game.points_att >= 36 && game.n_bouts === 3);
  return attackWon ? attackers : defenders;
}

export const Enums = Constants.public.Enums;