"use client";
import "../../globals.css";
import {supabase} from "@/utils/supabase/client";
import { Games, Players } from "@/utils/supabase/types";
import { buildGamePlayerTotals } from "@/lib/scoreUtils";
import { getAllPlayerStatistics } from "@/lib/playerStats";
import {
  getAvailablePlayerColors,
  getDefaultPlayerColor,
  getUnassignedPlayerColor,
} from "@/lib/playerColors";
import PlayerColorPicker from "@/components/PlayerColorPicker";
import PlayerStatsBadges from "@/components/PlayerStatsBadges";
import DuplicatePlayerPrompt from "@/components/DuplicatePlayerPrompt";
import { findDuplicatePlayer } from "@/lib/playerNames";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type PlayerSortField =
  | "name"
  | "gamesPlayed"
  | "gamesWon"
  | "averageScoredPointsPerGame"
  | "maxScored"
  | "maxLost"
  | "averageStartingBouts"
  | "averageDogBouts"
  | "averageCalledBouts"
  | "averageEndingBouts"
  | "gamesTaken"
  | "favoriteCalledPlayer"
  | "calledCount"
  | "favoriteSuit";

const playerSortOptions: { value: PlayerSortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "gamesPlayed", label: "Played" },
  { value: "gamesWon", label: "Won" },
  { value: "averageScoredPointsPerGame", label: "Avg scored" },
  { value: "maxScored", label: "Max scored" },
  { value: "maxLost", label: "Max lost" },
  { value: "averageStartingBouts", label: "Bouts Start" },
  { value: "averageDogBouts", label: "Bouts Dog" },
  { value: "averageCalledBouts", label: "Bouts Called" },
  { value: "averageEndingBouts", label: "Bouts Won" },
  { value: "gamesTaken", label: "Taken" },
  { value: "favoriteCalledPlayer", label: "Most Calls to" },
  { value: "calledCount", label: "Called" },
  { value: "favoriteSuit", label: "Favourite suit" },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Players[]>([]);
  const [games, setGames] = useState<Games[]>([]);
  const [name, setName] = useState("");
  const [preferredColor, setPreferredColor] = useState<string | null>(null);
  const [sortField, setSortField] = useState<PlayerSortField>("name");
  const [sortAscending, setSortAscending] = useState(true);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [duplicatePlayer, setDuplicatePlayer] = useState<Players | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const loadPlayers = async () => {
      const [playersResult, gamesResult] = await Promise.all([
        supabase.from("Players").select("*").order("Name", { ascending: true }),
        supabase.from("Games").select("*"),
      ]);

      if (!isCurrent) return;
      if (playersResult.error) {
        console.error("Error fetching players:", playersResult.error);
        setError("Could not load players. Please try again.");
        setIsLoading(false);
        return;
      }
      if (gamesResult.error) {
        console.error("Error fetching games for player statistics:", gamesResult.error);
        setError("Could not load player statistics. Please try again.");
        setIsLoading(false);
        return;
      }

      setPlayers(playersResult.data);
      setGames(gamesResult.data);
      setIsLoading(false);
    };

    void loadPlayers();
    return () => {
      isCurrent = false;
    };
  }, []);

  const refreshPlayers = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("Players")
      .select("*")
      .order("Name", { ascending: true });

    if (fetchError) {
      console.error("Error fetching players:", fetchError);
      setError("Could not load players. Please try again.");
      return;
    }

    setPlayers(data);
  }, []);

  const handleCreatePlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a player name.");
      return;
    }
    const existingPlayer = findDuplicatePlayer(players, trimmedName);
    if (existingPlayer) {
      setError(null);
      setMessage(null);
      setDuplicatePlayer(existingPlayer);
      return;
    }

    setDuplicatePlayer(null);
    setError(null);
    setMessage(null);
    setIsSaving(true);
    const defaultColor = getUnassignedPlayerColor(players);
    if (!defaultColor) {
      setIsSaving(false);
      setError("No default player colors are available.");
      return;
    }
    const { data: insertedPlayer, error: insertError } = await supabase
      .from("Players")
      .insert({
        Name: trimmedName,
        preferred_color: defaultColor,
        preferred_color_selected: false,
      })
      .select("id")
      .single();

    if (insertError) {
      setIsSaving(false);
      console.error("Error creating player:", insertError);
      if (insertError.code === "23505" && insertError.message.includes("players_name_unique")) {
        const { data: latestPlayers, error: lookupError } = await supabase
          .from("Players")
          .select("*")
          .order("Name", { ascending: true });
        if (lookupError) {
          console.error("Error checking duplicate player name:", lookupError);
          setError("Could not verify whether this player already exists. Please try again.");
          return;
        }
        const conflictingPlayer = findDuplicatePlayer(latestPlayers ?? [], trimmedName);
        if (conflictingPlayer) {
          setDuplicatePlayer(conflictingPlayer);
          return;
        }
      }
      setError(insertError.code === "23505"
        ? "Could not assign a unique default color. Please try again."
        : "Could not create player. Please try again.");
      return;
    }

    let colorSelectionError: string | null = null;
    if (preferredColor) {
      const { error: colorError } = await supabase.rpc("set_player_preferred_color", {
        p_player_id: insertedPlayer.id,
        p_color: preferredColor,
      });
      if (colorError) {
        console.error("Error selecting new player's preferred color:", colorError);
        colorSelectionError = "Player was added with a default color, but the selected color could not be assigned. Please choose it again from the player page.";
      }
    }

    setIsSaving(false);
    setName("");
    setPreferredColor(null);
    if (colorSelectionError) setError(colorSelectionError);
    else setMessage("Player added.");
    await refreshPlayers();
  };

  const availableColors = getAvailablePlayerColors(players);
  const defaultColor = getUnassignedPlayerColor(players);
  const gamePlayerTotals = useMemo(() => buildGamePlayerTotals(games), [games]);
  const playersWithStats = useMemo(() => {
    const allPlayerStatistics = getAllPlayerStatistics(players, games, gamePlayerTotals);
    return players.map(player => ({
      player,
      stats: allPlayerStatistics[player.id],
    }));
  }, [gamePlayerTotals, games, players]);
  const recentPlayerIds = useMemo(() => new Set(
    [...games]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .flatMap(game => game.players_uid)
  ), [games]);
  const listedPlayers = showAllPlayers
    ? playersWithStats
    : playersWithStats.filter(({ player }) => recentPlayerIds.has(player.id));
  const visiblePlayers = [...listedPlayers].sort((a, b) => {
    const aValue = sortField === "name" ? a.player.Name : a.stats[sortField];
    const bValue = sortField === "name" ? b.player.Name : b.stats[sortField];
    if (aValue === null || bValue === null) {
      if (aValue === bValue) return 0;
      return aValue === null ? 1 : -1;
    }
    const comparison = typeof aValue === "number" && typeof bValue === "number"
      ? aValue - bValue
      : String(aValue).localeCompare(String(bValue));
    return sortAscending ? comparison : -comparison;
  });

  return (
    <main className="p-6">
      <form className="flex flex-wrap items-center gap-2" onSubmit={handleCreatePlayer}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="name"
            name="name"
            aria-label="New Player Name"
            placeholder="New Player Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
            className="w-[20ch] max-w-full rounded border border-gray-300 px-3 py-2 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <PlayerColorPicker
            color={preferredColor ?? defaultColor ?? "#6b7280"}
            availableColors={availableColors}
            onSelect={setPreferredColor}
            disabled={isSaving || availableColors.length === 0}
          />
        </div>
        <button
          type="submit"
          disabled={isSaving || !defaultColor}
          className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 disabled:opacity-50"
        >
          {!defaultColor ? "No colors available" : isSaving ? "Adding..." : "Add"}
        </button>
      </form>

      {duplicatePlayer && (
        <DuplicatePlayerPrompt
          player={duplicatePlayer}
          profileHref={`/players/${duplicatePlayer.id}`}
          onChooseDifferentName={() => {
            setDuplicatePlayer(null);
            setName("");
            setError(null);
          }}
        />
      )}
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      {message && <p role="status" className="mt-4 text-green-700">{message}</p>}

      <section className="mt-8">
        <div className="mb-3 flex flex-nowrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <h2 className="whitespace-nowrap text-sm font-semibold sm:text-lg">
              {showAllPlayers ? "All Players" : "Recent Players"}
            </h2>
            <button
              type="button"
              onClick={() => setShowAllPlayers(showAll => !showAll)}
              className="whitespace-nowrap rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 sm:px-3 sm:py-2 sm:text-sm"
            >
              {showAllPlayers ? "Show recent" : "Show all"}
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <label htmlFor="player-sort-field" className="hidden text-sm font-medium sm:inline">
              Sort by
            </label>
            <select
              id="player-sort-field"
              value={sortField}
              onChange={event => setSortField(event.target.value as PlayerSortField)}
              className="w-24 rounded border border-gray-300 px-2 py-1 text-xs sm:w-auto sm:px-3 sm:py-2 sm:text-sm"
            >
              {playerSortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortAscending(ascending => !ascending)}
              aria-label={sortAscending ? "Sort ascending" : "Sort descending"}
              title={sortAscending ? "Sort ascending" : "Sort descending"}
              className="rounded border border-gray-300 px-2 py-1 text-lg leading-none hover:bg-gray-100 dark:hover:bg-gray-800 sm:px-3 sm:py-2"
            >
              {sortAscending ? "↑" : "↓"}
            </button>
          </div>
        </div>
        {isLoading ? (
          <p>Loading players...</p>
        ) : players.length === 0 ? (
          <p>No players have been added yet.</p>
        ) : listedPlayers.length === 0 ? (
          <p>No players appeared in the last 20 games. Show all players to view the full list.</p>
        ) : visiblePlayers.length === 0 ? (
          <p>No players are available for this sort.</p>
        ) : (
          <ul className="space-y-1">
            {visiblePlayers.map(({ player, stats }) => (
                <li key={player.id} className="flex flex-wrap items-center gap-2 py-1">
                  <div className="flex min-w-40 flex-1 flex-col gap-1">
                    <Link
                      href={`/players/${player.id}`}
                      className="w-fit font-semibold text-blue-700 hover:underline dark:text-blue-300"
                      style={{ color: getDefaultPlayerColor(player, players) }}
                    >
                      {player.Name}
                    </Link>
                    <PlayerStatsBadges stats={stats} sortField={sortField} />
                  </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}