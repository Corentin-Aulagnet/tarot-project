import {Games, Players} from '../utils/supabase/supabase';
export enum Contract{
    Petite,
    Garde,
    GardeSans,
    GardeContre
}
enum Poignee{
    Simple,
    Double,
    Triple
}
enum Chelem{
  AnnoucedFailed,
  AnnoucedSucceeded,
  UnannoucedSucceeded,
}
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

}

function getPointsForGame(game:Games, players:Players[]) {
  const result = {} as Record<Players['id'], number>
  let pointsToMake =0;
  if(game.n_bouts === 0) pointsToMake = 56
  else if(game.n_bouts === 1) pointsToMake = 51
  else if(game.n_bouts === 2) pointsToMake = 41
  else if(game.n_bouts === 3) pointsToMake = 36
  let mult = 0;
  switch(game.contract){
    case "Petite":
      mult = 1;
      break;
    case "Garde":
      mult = 2;
      break;
    case "Garde-Sans":
      mult = 3;
      break;
    case "Garde-Contre":
      mult = 4;
      break;
  }
  const contractDone = game.points_att >= pointsToMake;
  const points = (Math.abs(game.points_att - pointsToMake) + 25) * mult;
  const attack_team = [game.taker_id, game.call_id];
  // Petit au bout
  const prime_petit_au_bout = game.petit_au_bout_player_id ? 10: 0;
  // If the attack gets the petit au bout and wins it, or if the defence gets the petit au bout and lose it, count positively for attack
  const petit_au_bout_by_attack = attack_team.includes(game.petit_au_bout_player_id || "");
  const prime_petit_au_bout_att = (petit_au_bout_by_attack && !game.petit_au_bout_lost) ||
  (!petit_au_bout_by_attack && game.petit_au_bout_lost) ? prime_petit_au_bout : -prime_petit_au_bout;
  const prime_petit_au_bout_def = -prime_petit_au_bout_att;
  
  const prime_chelem = game.chelem === "AnnoucedSucceeded" ? 200 : game.chelem === "UnannoucedSucceeded" ? 400 : game.chelem === "AnnoucedFailed" ? -200 : 0;
  let poigneeValue = 0;
    if (game.poignee_type === "Simple") {
      poigneeValue = 20 * mult;
    } else if (game.poignee_type === "Double") {
      poigneeValue = 30 * mult;
    } else if (game.poignee_type === "Triple") {
      poigneeValue = 40 * mult;
    }else{
      poigneeValue = 0;
    }
  
  const prime_poignee_att = contractDone ? poigneeValue : -poigneeValue;
  const prime_poignee_def = -prime_poignee_att;
  game.players_uid.forEach(p => {
    if (p === game.taker_id) {
      result[p] = (points+prime_petit_au_bout_att) * 2 + (p === game.chelem_player_id ? prime_chelem : 0) + prime_poignee_att
    } else if (p === game.call_id) {
      result[p] = points + prime_petit_au_bout_att + (p === game.chelem_player_id ? prime_chelem : 0) + prime_poignee_att
    }else{
      result[p] = -points +prime_petit_au_bout_def + (p === game.chelem_player_id ? prime_chelem : 0) + prime_poignee_def
    }
  })
  return result;
}
export function buildGamePlayerTotals(games:Games[], players:Players[]) {
  const result = {}as Record<Games['id'], Record<Players['id'],number>>

  // Init structure
  games.forEach(g => {
    const gameResult = games.find(gr => gr.id === g.id);
    if (!gameResult) return;

    const points = getPointsForGame(g, players);
    result[g.id] = points;
  });



  return result
}
export function aggregateTotalScores(games:Games[], players:Players[]) {
  const result = {} as Record<Players['id'], number>
  players.forEach(p => result[p.id] = 0)
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