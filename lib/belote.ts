import { Database } from "@/utils/supabase/supabase";

export type BeloteMatch = Database["public"]["Tables"]["BeloteMatches"]["Row"];
export type BeloteHand = Database["public"]["Tables"]["BeloteHands"]["Row"];

export type BeloteScore = {
  team1: number;
  team2: number;
  contractMade: boolean;
  capotTeam: 1 | 2 | null;
};

export function scoreBeloteHand(hand: Pick<
  BeloteHand,
  "contract_team" | "team1_points" | "belote_team"
>): BeloteScore {
  const team1CardPoints = hand.team1_points;
  const team2CardPoints = 162 - team1CardPoints;
  const team1Belote = hand.belote_team === 1 ? 20 : 0;
  const team2Belote = hand.belote_team === 2 ? 20 : 0;
  const contractTeamCardAndBelotePoints = hand.contract_team === 1
    ? team1CardPoints + team1Belote
    : team2CardPoints + team2Belote;
  const contractMade = contractTeamCardAndBelotePoints >= 82;
  const defenders = hand.contract_team === 1 ? 2 : 1;
  let team1 = contractMade ? team1CardPoints : defenders === 1 ? 162 : 0;
  let team2 = contractMade ? team2CardPoints : defenders === 2 ? 162 : 0;

  team1 += team1Belote;
  team2 += team2Belote;

  const capotTeam = team1CardPoints === 162 ? 1 : team2CardPoints === 162 ? 2 : null;
  if (capotTeam === 1) team1 += 90;
  if (capotTeam === 2) team2 += 90;

  return { team1, team2, contractMade, capotTeam };
}

export function getMatchScore(hands: BeloteHand[]) {
  return hands.reduce((score, hand) => {
    const handScore = scoreBeloteHand(hand);
    score.team1 += handScore.team1;
    score.team2 += handScore.team2;
    return score;
  }, { team1: 0, team2: 0 });
}

export function formatBeloteDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
