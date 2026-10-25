"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import {
  getTrickGameLoadError,
  getTrickGameConfigurationKey,
  scoreTrickGame,
  scoreTrickGameHistory,
  TrickGameRecord,
  TrickGameVariant,
} from "@/lib/trickGames";

type PlayerField =
  | "team1_player1_id"
  | "team1_player2_id"
  | "team2_player1_id"
  | "team2_player2_id";
type TeamSelection = Record<PlayerField, string>;
type VisiblePlayerList = "recent" | "all";
type TeamChoice = "" | "1" | "2";

const playerFields: { field: PlayerField; seat: string; team: "1" | "2" }[] = [
  { field: "team1_player1_id", seat: "North", team: "1" },
  { field: "team2_player1_id", seat: "West", team: "2" },
  { field: "team2_player2_id", seat: "East", team: "2" },
  { field: "team1_player2_id", seat: "South", team: "1" },
];

const teamTextClasses = {
  "1": "text-violet-300",
  "2": "text-orange-300",
};

const teamButtonClasses = (team: "1" | "2", selected: boolean) => {
  const colors = team === "1"
    ? selected
      ? "border-violet-200 bg-violet-300 text-gray-900"
      : "border-violet-900 bg-violet-950 text-white hover:bg-violet-900"
    : selected
      ? "border-orange-200 bg-orange-300 text-gray-900"
      : "border-orange-900 bg-orange-950 text-white hover:bg-orange-900";
  return `rounded border px-2.5 py-1 text-xs font-medium ${colors}`;
};

const emptyTeams: TeamSelection = {
  team1_player1_id: "",
  team1_player2_id: "",
  team2_player1_id: "",
  team2_player2_id: "",
};

const contractTypes = ["♥", "♦", "♣", "♠", "No Trump", "All Trumps"];

type Props = { variant: TrickGameVariant };

export default function TrickGameForm({ variant }: Props) {
  const router = useRouter();
  const isCoinche = variant === "coinche";
  const title = isCoinche ? "New Coinche Game" : "New Belote Game";
  const [players, setPlayers] = useState<Players[]>([]);
  const [games, setGames] = useState<TrickGameRecord[]>([]);
  const [teams, setTeams] = useState<TeamSelection>(emptyTeams);
  const [playerList, setPlayerList] = useState<VisiblePlayerList>("recent");
  const [team1PointsInput, setTeam1PointsInput] = useState("");
  const [team2PointsInput, setTeam2PointsInput] = useState("");
  const [contractTeam, setContractTeam] = useState<TeamChoice>("");
  const [contractType, setContractType] = useState("");
  const [contractPoints, setContractPoints] = useState("");
  const [beloteTeam, setBeloteTeam] = useState("");
  const [coinched, setCoinched] = useState(false);
  const [surcoinched, setSurcoinched] = useState(false);
  const [capotAnnounced, setCapotAnnounced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [playersResult, gamesResult] = await Promise.all([
        supabase.from("Players").select("*").order("Name", { ascending: true }),
        isCoinche
          ? supabase.from("CoincheGames").select("*").order("created_at", { ascending: false })
          : supabase.from("BeloteGames").select("*").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      const failure = playersResult.error ?? gamesResult.error;
      if (failure) {
        console.error(`Could not load players or ${variant} history:`, failure);
        setError(getTrickGameLoadError(variant, failure.code));
      } else {
        const allPlayers = playersResult.data ?? [];
        const gameHistory = (gamesResult.data ?? []) as TrickGameRecord[];
        setPlayers(allPlayers);
        setGames(gameHistory);

        const lastGame = gameHistory[0];
        if (lastGame) {
          setTeams({
            team1_player1_id: lastGame.team1_player1_id,
            team1_player2_id: lastGame.team1_player2_id,
            team2_player1_id: lastGame.team2_player1_id,
            team2_player2_id: lastGame.team2_player2_id,
          });
        } else if (allPlayers.length >= 4) {
          setTeams({
            team1_player1_id: allPlayers[0].id,
            team1_player2_id: allPlayers[1].id,
            team2_player1_id: allPlayers[2].id,
            team2_player2_id: allPlayers[3].id,
          });
        }
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [isCoinche, variant]);

  const selectedPlayerIds = Object.values(teams);
  const validTeams = selectedPlayerIds.every(Boolean) && new Set(selectedPlayerIds).size === 4;
  const recentPlayerIds = new Set(
    games.slice(0, 20).flatMap(game => [
      game.team1_player1_id,
      game.team1_player2_id,
      game.team2_player1_id,
      game.team2_player2_id,
    ])
  );
  const visiblePlayers = players.filter(player =>
    playerList === "all" || recentPlayerIds.size === 0
      || recentPlayerIds.has(player.id) || selectedPlayerIds.includes(player.id)
  );
  const history = useMemo(() => scoreTrickGameHistory(variant, games), [games, variant]);
  const currentGame = {
    team1_player1_id: teams.team1_player1_id,
    team1_player2_id: teams.team1_player2_id,
    team2_player1_id: teams.team2_player1_id,
    team2_player2_id: teams.team2_player2_id,
  };
  const configurationKey = validTeams ? getTrickGameConfigurationKey(currentGame) : null;
  const pendingPoints = configurationKey
    ? history.pendingByConfiguration.get(configurationKey) ?? 0
    : 0;
  const team1Points = team1PointsInput === "" ? null : Number(team1PointsInput);
  const numericContractPoints = contractPoints === "" ? null : Number(contractPoints);
  const validContractPoints = !isCoinche || (
    numericContractPoints !== null && Number.isInteger(numericContractPoints)
    && numericContractPoints >= 80 && numericContractPoints <= 160
    && numericContractPoints % 10 === 0
  );
  const preview = contractTeam !== "" && validContractPoints
    && team1Points !== null && Number.isInteger(team1Points)
    && team1Points >= 0 && team1Points <= 162
    ? scoreTrickGame(variant, {
        contract_team: Number(contractTeam) as 1 | 2,
        contract_points: numericContractPoints,
        team1_points: team1Points,
        belote_team: beloteTeam === "" ? null : Number(beloteTeam),
        coinched,
        surcoinched,
        capot_announced: capotAnnounced,
      }, pendingPoints)
    : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validTeams) {
      setError("Choose four different players for the two teams.");
      return;
    }
    if (contractTeam === "") {
      setError("Choose the team that took the contract.");
      return;
    }
    if (team1Points === null || !Number.isInteger(team1Points) || team1Points < 0 || team1Points > 162) {
      setError("Enter whole-number card points from 0 to 162 for either team.");
      return;
    }
    if (isCoinche && (
      numericContractPoints === null || !Number.isInteger(numericContractPoints)
      || numericContractPoints < 80 || numericContractPoints > 160
      || numericContractPoints % 10 !== 0
    )) {
      setError("Enter Coinche contract points as a multiple of 10 between 80 and 160.");
      return;
    }
    if (surcoinched && !coinched) {
      setError("A surcoinche requires a coinche first.");
      return;
    }

    const commonData = {
      ...teams,
      contract_team: Number(contractTeam),
      contract_type: contractType || null,
      team1_points: team1Points,
      belote_team: beloteTeam === "" ? null : Number(beloteTeam),
    };

    setSaving(true);
    setError(null);
    const { data, error: insertError } = isCoinche
      ? await supabase.from("CoincheGames").insert({
          ...commonData,
          contract_points: numericContractPoints,
          coinched,
          surcoinched,
          capot_announced: capotAnnounced,
        }).select("id").single()
      : await supabase.from("BeloteGames").insert(commonData).select("id").single();
    setSaving(false);

    if (insertError || !data) {
      if (insertError) console.error(`Could not save ${variant} game:`, insertError);
      setError(`Could not save this ${variant} game. Please try again.`);
      return;
    }
    router.push(`/${variant}/${data.id}`);
  };

  if (loading) return <main className="p-4 text-sm text-gray-300">Loading players…</main>;
  if (error && players.length === 0) {
    return <main className="p-4"><p role="alert" className="text-sm text-red-400">{error}</p></main>;
  }
  if (players.length < 4) {
    return (
      <main className="space-y-2 p-4 text-sm text-gray-300">
        {error && <p role="alert" className="text-red-400">{error}</p>}
        <p>Add at least four players before recording a game.</p>
      </main>
    );
  }

  return (
    <main className="w-full space-y-2 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-base font-bold">{title}</h1>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="new-game-form space-y-2 rounded p-2.5 shadow sm:p-3">
        <section className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Select Players</h2>
            <button type="button" onClick={() => setPlayerList(previous => previous === "recent" ? "all" : "recent")}
              aria-pressed={playerList === "all"}
              className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700">
              {playerList === "all" ? "Show recent players" : "Show all players"}
            </button>
          </div>
          <div className="grid w-full grid-cols-2 gap-1.5">
            {playerFields.map(({ field, seat, team }) => (
              <label key={field} className="flex w-full flex-col gap-1 text-xs font-medium text-gray-300">
                <span>{seat} · <span className={teamTextClasses[team]}>Team {team}</span></span>
                <select
                  value={teams[field]}
                  onChange={event => setTeams(previous => ({ ...previous, [field]: event.target.value }))}
                  style={{
                    color: players.find(player => player.id === teams[field])?.preferred_color
                      ?? (teams[field] ? undefined : "#9ca3af"),
                  }}
                  className="w-full rounded border border-gray-600 bg-gray-950 px-2 py-1 text-sm"
                  required
                >
                  <option value="">Select player</option>
                  {visiblePlayers.map(player => (
                    <option key={player.id} value={player.id}
                      style={{ color: player.preferred_color ?? undefined }}
                      disabled={selectedPlayerIds.includes(player.id) && teams[field] !== player.id}>
                      {player.Name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {playerList === "recent" && recentPlayerIds.size === 0 && (
            <p className="text-center text-xs text-gray-500">No games yet. All players are shown.</p>
          )}
        </section>

        <div className="grid w-full grid-cols-2 gap-1.5">
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium text-gray-300">Takers</legend>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Takers">
              {(["1", "2"] as const).map(team => (
                <button key={team} type="button" aria-pressed={contractTeam === team}
                  onClick={() => setContractTeam(team)}
                  className={teamButtonClasses(team, contractTeam === team)}>
                  Team {team}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-300">
            Called colour
            <select value={contractType} onChange={event => setContractType(event.target.value)}
              className={`w-full rounded border border-gray-600 bg-gray-950 px-2 py-1 text-sm ${contractType ? "text-white" : "text-gray-400"}`}>
              <option value="" className="text-gray-400">Not entered</option>
              {contractTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium text-gray-300">Belote / Rebelote</legend>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Belote / Rebelote team">
              {(["1", "2"] as const).map(team => (
                <button key={team} type="button" aria-pressed={beloteTeam === team}
                  onClick={() => setBeloteTeam(previous => previous === team ? "" : team)}
                  className={teamButtonClasses(team, beloteTeam === team)}>
                  Team {team}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {isCoinche && (
          <fieldset className="flex w-full flex-wrap gap-x-3 gap-y-1 rounded border border-gray-700 px-2 py-1.5">
            <legend className="px-1 text-xs font-medium text-gray-300">Coinche options</legend>
            <label className="flex items-center gap-1.5 text-xs text-gray-300">
              <input type="checkbox" checked={coinched}
                onChange={event => {
                  setCoinched(event.target.checked);
                  if (!event.target.checked) setSurcoinched(false);
                }} />
              Coinched ×2
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-300">
              <input type="checkbox" checked={surcoinched} disabled={!coinched}
                onChange={event => setSurcoinched(event.target.checked)} />
              Sur-coinched ×4
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-300">
              <input type="checkbox" checked={capotAnnounced}
                onChange={event => setCapotAnnounced(event.target.checked)} />
              Capot annoncé
            </label>
          </fieldset>
        )}

        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Card points by team">
          {isCoinche && (
            <label className="flex flex-col gap-1 text-sm font-medium text-white">
              Contract points
              <input aria-label="Contract points" type="number" min={80} max={160} step={10} placeholder="80–160" required
                value={contractPoints} onChange={event => setContractPoints(event.target.value)}
                className="w-[5.5rem] rounded border border-gray-600 bg-gray-950 px-2 py-1.5 text-center text-base text-white placeholder:text-gray-400" />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium">
            <span className={teamTextClasses["1"]}>Team 1</span>
            <input aria-label="Team 1 card points" type="number" min={0} max={162} step={1}
              required value={team1PointsInput}
              onChange={event => {
                const value = event.target.value;
                setTeam1PointsInput(value);
                const points = Number(value);
                setTeam2PointsInput(value !== "" && Number.isInteger(points) && points >= 0 && points <= 162
                  ? String(162 - points)
                  : "");
              }}
              className="w-[5.5rem] rounded border border-gray-600 bg-gray-950 px-2 py-1.5 text-center text-base text-white" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            <span className={teamTextClasses["2"]}>Team 2</span>
            <input aria-label="Team 2 card points" type="number" min={0} max={162} step={1}
              required value={team2PointsInput}
              onChange={event => {
                const value = event.target.value;
                setTeam2PointsInput(value);
                const points = Number(value);
                setTeam1PointsInput(value !== "" && Number.isInteger(points) && points >= 0 && points <= 162
                  ? String(162 - points)
                  : "");
              }}
              className="w-[5.5rem] rounded border border-gray-600 bg-gray-950 px-2 py-1.5 text-center text-base text-white" />
          </label>
        </div>

        {preview && (
          <div className="w-full rounded border border-gray-700 bg-gray-950/60 px-2 py-1.5 text-center text-xs text-gray-300" aria-live="polite">
            <p>
              Per-player score: <span className={teamTextClasses["1"]}>Team 1 {preview.team1 > 0 ? "+" : ""}{preview.team1}</span>
              {" · "}<span className={teamTextClasses["2"]}>Team 2 {preview.team2 > 0 ? "+" : ""}{preview.team2}</span>
            </p>
            {pendingPoints > 0 && <p className="mt-1 text-amber-300">Includes {pendingPoints} held points from the previous 81–81 game with this lineup.</p>}
            {preview.heldPoints > 0 && <p className="mt-1 text-amber-300">Takers&apos; 81 points are held for the next game with this lineup.</p>}
          </div>
        )}
        <div className="text-center">
          <button type="submit" disabled={saving || !validTeams}
            className="rounded bg-gray-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50">
            {saving ? "Saving…" : "Save Game"}
          </button>
        </div>
      </form>
    </main>
  );
}
