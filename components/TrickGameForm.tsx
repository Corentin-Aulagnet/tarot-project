"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import {
  formatTrickGameDate,
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

// Soft pastel palette shared by the form; layout and sizes follow the Tarot new game form.
const TEAM_COLORS = { "1": "#a9c9ec", "2": "#f3c4a2" } as const;
const PLACEHOLDER_COLOR = "#9ca3af";
const SOFT_RED = "#f0a0a0";
const SOFT_GREEN = "#a3d9ad";
const SOFT_AMBER = "#f1d7a1";

const suitColor = (suit: string) => suit === "♥" || suit === "♦" ? SOFT_RED : undefined;
const formatScore = (score: number) => `${score > 0 ? "+" : ""}${score}`;
const contractPointOptions = Array.from({ length: 9 }, (_, index) => 80 + index * 10);

const emptyTeams: TeamSelection = {
  team1_player1_id: "",
  team1_player2_id: "",
  team2_player1_id: "",
  team2_player2_id: "",
};

const contractTypes = ["♥", "♦", "♣", "♠", "No Trump", "All Trumps"];

type Props = { variant: TrickGameVariant; gameId?: string };

export default function TrickGameForm({ variant, gameId }: Props) {
  const router = useRouter();
  const isCoinche = variant === "coinche";
  const gameTitle = isCoinche ? "Coinche" : "Belote";
  const [players, setPlayers] = useState<Players[]>([]);
  const [games, setGames] = useState<TrickGameRecord[]>([]);
  const [editingGame, setEditingGame] = useState<TrickGameRecord | null>(null);
  const title = editingGame ? `Edit ${gameTitle} Game` : `New ${gameTitle} Game`;
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

        const selectedGame = gameId ? gameHistory.find(game => game.id === gameId) : undefined;
        const lastGame = selectedGame ?? gameHistory[0];
        if (gameId && !selectedGame) {
          setError(`This ${variant} game could not be found.`);
        } else if (selectedGame) {
          setEditingGame(selectedGame);
          setContractTeam(String(selectedGame.contract_team) as TeamChoice);
          setContractType(selectedGame.contract_type ?? "");
          setContractPoints(selectedGame.contract_points == null ? "" : String(selectedGame.contract_points));
          setBeloteTeam(selectedGame.belote_team == null ? "" : String(selectedGame.belote_team));
          setCoinched(selectedGame.coinched ?? false);
          setSurcoinched(selectedGame.surcoinched ?? false);
          setCapotAnnounced(selectedGame.capot_announced ?? false);
          setTeam1PointsInput(String(selectedGame.team1_points));
          setTeam2PointsInput(String(162 - selectedGame.team1_points));
        }
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
  }, [gameId, isCoinche, variant]);

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
  // When editing, held points can only come from games played before the edited one.
  const history = useMemo(() => scoreTrickGameHistory(
    variant,
    editingGame
      ? games.filter(game =>
          game.created_at.localeCompare(editingGame.created_at) < 0
          || (game.created_at === editingGame.created_at && game.id.localeCompare(editingGame.id) < 0)
        )
      : games
  ), [editingGame, games, variant]);
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
    const coincheData = {
      ...commonData,
      contract_points: numericContractPoints,
      coinched,
      surcoinched,
      capot_announced: capotAnnounced,
    };
    const { error: saveError } = editingGame
      ? isCoinche
        ? await supabase.from("CoincheGames").update(coincheData).eq("id", editingGame.id)
        : await supabase.from("BeloteGames").update(commonData).eq("id", editingGame.id)
      : isCoinche
        ? await supabase.from("CoincheGames").insert(coincheData)
        : await supabase.from("BeloteGames").insert(commonData);
    setSaving(false);

    if (saveError) {
      console.error(editingGame ? `Could not update ${variant} game:` : `Could not save ${variant} game:`, saveError);
      setError(editingGame
        ? `Could not save changes to this ${variant} game. Please try again.`
        : `Could not save this ${variant} game. Please try again.`);
      return;
    }
    alert(editingGame ? "Game changes saved" : "Game created");
    router.push(`/${variant}`);
  };

  if (loading) return <main className="p-3">{gameId ? "Loading game..." : "Loading players..."}</main>;
  if ((error && players.length === 0) || (gameId && !editingGame)) {
    return <main className="p-3"><p role="alert" className="text-red-400">{error}</p></main>;
  }
  if (players.length < 4) {
    return (
      <main className="p-3">
        {error && <p role="alert" className="text-red-400">{error}</p>}
        <p>Add at least four players before recording a game.</p>
      </main>
    );
  }

  const handleTeam1PointsChange = (value: string) => {
    setTeam1PointsInput(value);
    const points = Number(value);
    setTeam2PointsInput(value !== "" && Number.isInteger(points) && points >= 0 && points <= 162
      ? String(162 - points)
      : "");
  };
  const handleTeam2PointsChange = (value: string) => {
    setTeam2PointsInput(value);
    const points = Number(value);
    setTeam1PointsInput(value !== "" && Number.isInteger(points) && points >= 0 && points <= 162
      ? String(162 - points)
      : "");
  };

  return (
    <main className="p-3">
      <form onSubmit={handleSubmit} className="new-game-form flex w-auto flex-col gap-3 rounded p-3 shadow">
        <h1 className="text-lg font-bold">{title}</h1>

        <div className="flex flex-col gap-2 rounded border border-gray-300 p-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">Select Players</h2>
            <button
              type="button"
              onClick={() => setPlayerList(previous => previous === "recent" ? "all" : "recent")}
              aria-pressed={playerList === "all"}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {playerList === "all" ? "Show recent players" : "Show all players"}
            </button>
          </div>
          {playerList === "recent" && recentPlayerIds.size === 0 && (
            <p className="text-sm">No games yet. All players are shown.</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {playerFields.map(({ field, seat, team }) => (
              <label key={field} className="flex min-w-0 flex-col gap-1 text-sm">
                <span>{seat} · <span style={{ color: TEAM_COLORS[team] }}>Team {team}</span></span>
                <select
                  aria-label={`${seat} player`}
                  value={teams[field]}
                  onChange={event => setTeams(previous => ({ ...previous, [field]: event.target.value }))}
                  className="w-full rounded border px-2 py-1.5"
                  style={{
                    color: players.find(player => player.id === teams[field])?.preferred_color
                      ?? (teams[field] ? undefined : PLACEHOLDER_COLOR),
                  }}
                  required
                >
                  <option value="" style={{ color: PLACEHOLDER_COLOR }}>Player</option>
                  {visiblePlayers.map(player => (
                    <option
                      key={player.id}
                      value={player.id}
                      style={{ color: player.preferred_color ?? undefined }}
                      disabled={selectedPlayerIds.includes(player.id) && teams[field] !== player.id}
                    >
                      {player.Name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <section className="flex flex-col gap-3 rounded border border-gray-300 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select
              aria-label="Takers"
              value={contractTeam}
              onChange={event => setContractTeam(event.target.value as TeamChoice)}
              className="w-full rounded border px-2 py-1.5"
              style={{ color: contractTeam ? TEAM_COLORS[contractTeam] : PLACEHOLDER_COLOR }}
              required
            >
              <option value="" style={{ color: PLACEHOLDER_COLOR }}>Takers</option>
              <option value="1" style={{ color: TEAM_COLORS["1"] }}>Team 1</option>
              <option value="2" style={{ color: TEAM_COLORS["2"] }}>Team 2</option>
            </select>
            <select
              aria-label="Called Suit"
              value={contractType}
              onChange={event => setContractType(event.target.value)}
              className="w-full rounded border px-2 py-1.5"
              style={{ color: contractType ? suitColor(contractType) : PLACEHOLDER_COLOR }}
            >
              <option value="" style={{ color: PLACEHOLDER_COLOR }}>Called Suit</option>
              {contractTypes.map(type => (
                <option key={type} value={type} style={{ color: suitColor(type) ?? "#f9fafb" }}>{type}</option>
              ))}
            </select>
            {isCoinche && (
              <select
                aria-label="Contract"
                value={contractPoints}
                onChange={event => setContractPoints(event.target.value)}
                className="w-full rounded border px-2 py-1.5"
                style={{ color: contractPoints ? undefined : PLACEHOLDER_COLOR }}
                required
              >
                <option value="" style={{ color: PLACEHOLDER_COLOR }}>Contract</option>
                {contractPointOptions.map(points => <option key={points} value={points}>{points}</option>)}
              </select>
            )}
            <select
              aria-label="Belote / Rebelote"
              value={beloteTeam}
              onChange={event => setBeloteTeam(event.target.value)}
              className="w-full rounded border px-2 py-1.5"
              style={{ color: beloteTeam === "1" || beloteTeam === "2" ? TEAM_COLORS[beloteTeam] : PLACEHOLDER_COLOR }}
            >
              <option value="" style={{ color: PLACEHOLDER_COLOR }}>Belote (none)</option>
              <option value="1" style={{ color: TEAM_COLORS["1"] }}>Belote · Team 1</option>
              <option value="2" style={{ color: TEAM_COLORS["2"] }}>Belote · Team 2</option>
            </select>
          </div>

          {isCoinche && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={coinched}
                  onChange={event => {
                    setCoinched(event.target.checked);
                    if (!event.target.checked) setSurcoinched(false);
                  }}
                />
                Coinched ×2
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={surcoinched}
                  disabled={!coinched}
                  onChange={event => setSurcoinched(event.target.checked)}
                />
                Sur-coinched ×4
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={capotAnnounced}
                  onChange={event => setCapotAnnounced(event.target.checked)}
                />
                Capot annoncé
              </label>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {([
              { team: "1", value: team1PointsInput, onChange: handleTeam1PointsChange, score: preview?.team1 },
              { team: "2", value: team2PointsInput, onChange: handleTeam2PointsChange, score: preview?.team2 },
            ] as const).map(({ team, value, onChange, score }) => (
              <label key={team} className="flex flex-col gap-1 font-medium">
                <span className="flex items-baseline gap-3">
                  <span style={{ color: TEAM_COLORS[team] }}>Team {team}</span>
                  {score !== undefined && (
                    <span className="font-semibold" style={{ color: score >= 0 ? SOFT_GREEN : SOFT_RED }}>
                      {formatScore(score)}
                    </span>
                  )}
                </span>
                <input
                  aria-label={`Team ${team} card points`}
                  className="w-[5.5rem] rounded border px-2 py-1.5 text-base"
                  type="number"
                  min={0}
                  max={162}
                  step={1}
                  required
                  placeholder="Points"
                  value={value}
                  onChange={event => onChange(event.target.value)}
                />
              </label>
            ))}
          </div>

          {(pendingPoints > 0 || (preview?.heldPoints ?? 0) > 0) && (
            <div className="text-center text-sm" style={{ color: SOFT_AMBER }} aria-live="polite">
              {pendingPoints > 0 && <p>Includes {pendingPoints} held points from the previous 81–81 game with this lineup.</p>}
              {preview && preview.heldPoints > 0 && <p>Takers&apos; 81 points are held for the next game with this lineup.</p>}
            </div>
          )}
        </section>

        {error && <p role="alert" className="text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || !validTeams}
          className="bg-gray-800 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : editingGame ? `Save Changes to ${formatTrickGameDate(editingGame.created_at)}` : "Create"}
        </button>
      </form>
    </main>
  );
}
