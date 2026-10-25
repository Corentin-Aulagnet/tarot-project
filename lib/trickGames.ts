import { Database } from "@/utils/supabase/supabase";

export type BeloteGame = Database["public"]["Tables"]["BeloteGames"]["Row"];
export type CoincheGame = Database["public"]["Tables"]["CoincheGames"]["Row"];
export type TrickGameVariant = "belote" | "coinche";
export type TrickTeam = 1 | 2;

export type TrickGameRecord = Pick<
  BeloteGame,
  | "id"
  | "created_at"
  | "team1_player1_id"
  | "team1_player2_id"
  | "team2_player1_id"
  | "team2_player2_id"
  | "contract_team"
  | "contract_type"
  | "team1_points"
  | "belote_team"
> & Partial<Pick<CoincheGame, "contract_points" | "coinched" | "surcoinched" | "capot_announced">>;

export type TrickGameScore = {
  team1: number;
  team2: number;
  winnerTeam: TrickTeam;
  contractMade: boolean;
  team1PointsWon: number;
  team2PointsWon: number;
  contractBonus: number;
  heldPoints: number;
  differential: number;
};

export type TrickGameHistory = {
  scoresByGameId: Map<string, TrickGameScore>;
  pendingByConfiguration: Map<string, number>;
};

export function getTrickGameLoadError(variant: TrickGameVariant, errorCode: string) {
  if (errorCode === "PGRST205") {
    const title = variant === "coinche" ? "Coinche" : "Belote";
    return `${title} database tables are not available yet. Apply the pending Supabase migrations before using this app.`;
  }
  return `Could not load ${variant} game data. Please try again.`;
}

export function getTrickGameConfigurationKey(game: Pick<
  BeloteGame,
  "team1_player1_id" | "team1_player2_id" | "team2_player1_id" | "team2_player2_id"
>) {
  const firstTeam = [game.team1_player1_id, game.team1_player2_id].sort().join(",");
  const secondTeam = [game.team2_player1_id, game.team2_player2_id].sort().join(",");
  return [firstTeam, secondTeam].sort().join("|");
}

export function scoreTrickGame(
  variant: TrickGameVariant,
  game: Pick<
    TrickGameRecord,
    | "contract_team"
    | "contract_points"
    | "team1_points"
    | "belote_team"
    | "coinched"
    | "surcoinched"
    | "capot_announced"
  >,
  pendingPoints = 0
): TrickGameScore {
  const contractTeam: TrickTeam = game.contract_team === 1 ? 1 : 2;
  const otherTeam: TrickTeam = contractTeam === 1 ? 2 : 1;
  const cardPoints = [game.team1_points, 162 - game.team1_points];
  const belotePoints = [game.belote_team === 1 ? 20 : 0, game.belote_team === 2 ? 20 : 0];
  const tiedCards = game.team1_points === 81;
  const contractTeamIndex = contractTeam - 1;
  const otherTeamIndex = otherTeam - 1;
  const contractPoints = variant === "coinche" ? game.contract_points ?? null : null;
  const capotAnnounced = variant === "coinche" && (game.capot_announced ?? false);
  const contractTarget = capotAnnounced ? 162 : contractPoints ?? 82;
  const contractTeamTotal = cardPoints[contractTeamIndex] + belotePoints[contractTeamIndex];
  const otherTeamTotal = cardPoints[otherTeamIndex] + belotePoints[otherTeamIndex];
  const contractMade = !tiedCards && (
    contractPoints === null && !capotAnnounced
      ? contractTeamTotal > otherTeamTotal
      : contractTeamTotal >= contractTarget
  );
  const winnerTeam: TrickTeam = tiedCards
    ? otherTeam
    : contractMade ? contractTeam : otherTeam;

  let team1PointsWon = (tiedCards && contractTeam === 1 ? 0 : cardPoints[0]) + belotePoints[0];
  let team2PointsWon = (tiedCards && contractTeam === 2 ? 0 : cardPoints[1]) + belotePoints[1];

  if (game.team1_points === 162 && !capotAnnounced) team1PointsWon += 90;
  if (game.team1_points === 0 && !capotAnnounced) team2PointsWon += 90;

  const contractMultiplier = variant === "coinche"
    ? game.surcoinched ? 4 : game.coinched ? 2 : 1
    : 1;
  const contractBonus = variant === "coinche"
    ? (capotAnnounced ? 250 : contractPoints ?? 0) * contractMultiplier
    : 0;

  if (winnerTeam === 1) team1PointsWon += contractBonus + pendingPoints;
  else team2PointsWon += contractBonus + pendingPoints;

  const winningPoints = winnerTeam === 1 ? team1PointsWon : team2PointsWon;
  const losingPoints = winnerTeam === 1 ? team2PointsWon : team1PointsWon;
  const differential = Math.abs(winningPoints - losingPoints);
  const playerScore = differential / 2;

  return {
    team1: winnerTeam === 1 ? playerScore : -playerScore,
    team2: winnerTeam === 2 ? playerScore : -playerScore,
    winnerTeam,
    contractMade,
    team1PointsWon,
    team2PointsWon,
    contractBonus,
    heldPoints: tiedCards ? 81 : 0,
    differential,
  };
}

export function scoreTrickGameHistory(
  variant: TrickGameVariant,
  games: TrickGameRecord[]
): TrickGameHistory {
  const scoresByGameId = new Map<string, TrickGameScore>();
  const pendingByConfiguration = new Map<string, number>();
  const chronologicalGames = [...games].sort((a, b) =>
    a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
  );

  for (const game of chronologicalGames) {
    const configuration = getTrickGameConfigurationKey(game);
    const pendingPoints = pendingByConfiguration.get(configuration) ?? 0;
    const score = scoreTrickGame(variant, game, pendingPoints);
    scoresByGameId.set(game.id, score);
    pendingByConfiguration.delete(configuration);
    if (score.heldPoints > 0) pendingByConfiguration.set(configuration, score.heldPoints);
  }

  return { scoresByGameId, pendingByConfiguration };
}

export function formatTrickGameDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
