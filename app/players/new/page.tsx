"use client";
import "../../globals.css";
import {supabase} from "@/utils/supabase/client";
import { Games, Players } from "@/utils/supabase/types";
import { buildGamePlayerTotals } from "@/lib/scoreUtils";
import { getPlayerStatistics } from "@/lib/playerStats";
import { getAvailablePlayerColors } from "@/lib/playerColors";
import PlayerStatsBadges from "@/components/PlayerStatsBadges";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PlayerSortField =
  | "name"
  | "gamesPlayed"
  | "gamesWon"
  | "averageScoredPointsPerGame"
  | "maxScored"
  | "maxLost"
  | "averageStartingBouts"
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
  { value: "averageEndingBouts", label: "Bouts Won" },
  { value: "gamesTaken", label: "Taken" },
  { value: "favoriteCalledPlayer", label: "Favourite called partner" },
  { value: "calledCount", label: "Called" },
  { value: "favoriteSuit", label: "Favourite suit" },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Players[]>([]);
  const [games, setGames] = useState<Games[]>([]);
  const [name, setName] = useState("");
  const [preferredColor, setPreferredColor] = useState("");
  const [sortField, setSortField] = useState<PlayerSortField>("name");
  const [sortAscending, setSortAscending] = useState(true);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

    setError(null);
    setMessage(null);
    setIsSaving(true);
    const selectedColor = preferredColor || availableColors[0]?.value;
    if (!selectedColor) {
      setIsSaving(false);
      setError("No unused player colors are available.");
      return;
    }
    const { error: insertError } = await supabase
      .from("Players")
      .insert({ Name: trimmedName, preferred_color: selectedColor });
    setIsSaving(false);

    if (insertError) {
      console.error("Error creating player:", insertError);
      setError(insertError.code === "23505"
        ? "That color is already in use. Please choose another."
        : "Could not create player. Please try again.");
      return;
    }

    setName("");
    setPreferredColor("");
    setMessage("Player added.");
    await refreshPlayers();
  };

  const availableColors = getAvailablePlayerColors(players);
  const gamePlayerTotals = buildGamePlayerTotals(games, players);
  const playersWithStats = players.map(player => ({
    player,
    stats: getPlayerStatistics(player, games, players, gamePlayerTotals),
  }));
  const recentGameIds = new Set(
    [...games]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .map(game => game.id)
  );
  const recentPlayerIds = new Set(
    games
      .filter(game => recentGameIds.has(game.id))
      .flatMap(game => game.players_uid)
  );
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
          <label htmlFor="name" className="font-medium">New player</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
            className="w-[20ch] max-w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="new-player-color" className="font-medium">Color</label>
          <select
            id="new-player-color"
            value={preferredColor || availableColors[0]?.value || ""}
            onChange={event => setPreferredColor(event.target.value)}
            disabled={availableColors.length === 0}
            className="rounded border border-gray-300 px-2 py-2"
          >
            {availableColors.map(color => (
              <option key={color.value} value={color.value}>{color.name}</option>
            ))}
          </select>
          {preferredColor && (
            <span
              aria-label="Selected player color"
              className="size-6 rounded-full border border-gray-400"
              style={{ backgroundColor: preferredColor }}
            />
          )}
        </div>
        <button
          type="submit"
          disabled={isSaving || availableColors.length === 0}
          className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 disabled:opacity-50"
        >
          {availableColors.length === 0 ? "No colors available" : isSaving ? "Adding..." : "Add"}
        </button>
      </form>

      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      {message && <p role="status" className="mt-4 text-green-700">{message}</p>}

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              {showAllPlayers ? "All Players" : "Recent Players"}
            </h2>
            <button
              type="button"
              onClick={() => setShowAllPlayers(showAll => !showAll)}
              className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {showAllPlayers ? "Show recent" : "Show all"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="player-sort-field" className="text-sm font-medium">
              Sort by
            </label>
            <select
              id="player-sort-field"
              value={sortField}
              onChange={event => setSortField(event.target.value as PlayerSortField)}
              className="rounded border border-gray-300 px-3 py-2"
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
              className="rounded border border-gray-300 px-3 py-2 text-lg leading-none hover:bg-gray-100 dark:hover:bg-gray-800"
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
                    >
                      {player.Name}
                    </Link>
                    <PlayerStatsBadges stats={stats} />
                  </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}