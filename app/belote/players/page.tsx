"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { BeloteMatch } from "@/lib/belote";
import {
  getAvailablePlayerColors,
  getUnassignedPlayerColor,
} from "@/lib/playerColors";
import PlayerColorPicker from "@/components/PlayerColorPicker";
import DuplicatePlayerPrompt from "@/components/DuplicatePlayerPrompt";
import { findDuplicatePlayer } from "@/lib/playerNames";

export default function BelotePlayersPage() {
  const [players, setPlayers] = useState<Players[]>([]);
  const [matches, setMatches] = useState<BeloteMatch[]>([]);
  const [name, setName] = useState("");
  const [preferredColor, setPreferredColor] = useState<string | null>(null);
  const [duplicatePlayer, setDuplicatePlayer] = useState<Players | null>(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("Players").select("*").order("Name", { ascending: true }),
      supabase.from("BeloteMatches").select("*"),
    ]).then(([playersResult, matchesResult]) => {
      if (!active) return;
      const failure = playersResult.error ?? matchesResult.error;
      if (failure) {
        console.error("Could not load Belote players:", failure);
        setError("Could not load Belote players.");
      } else {
        setPlayers(playersResult.data ?? []);
        setMatches(matchesResult.data ?? []);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const matchCounts = new Map<string, number>();
  matches.forEach(match => {
    [
      match.team1_player1_id,
      match.team1_player2_id,
      match.team2_player1_id,
      match.team2_player2_id,
    ].forEach(id => matchCounts.set(id, (matchCounts.get(id) ?? 0) + 1));
  });
  const recentPlayerIds = new Set(
    [...matches]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .flatMap(match => [
        match.team1_player1_id,
        match.team1_player2_id,
        match.team2_player1_id,
        match.team2_player2_id,
      ])
  );
  const listedPlayers = showAllPlayers
    ? players
    : players.filter(player => recentPlayerIds.has(player.id));
  const availableColors = getAvailablePlayerColors(players);
  const defaultColor = getUnassignedPlayerColor(players);

  const createPlayer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a player name.");
      return;
    }
    const existingPlayer = findDuplicatePlayer(players, trimmedName);
    if (existingPlayer) {
      setDuplicatePlayer(existingPlayer);
      setError(null);
      setMessage(null);
      return;
    }
    if (!defaultColor) {
      setError("No default player colors are available.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    setDuplicatePlayer(null);
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
      setSaving(false);
      console.error("Could not create Belote player:", insertError);
      if (insertError.code === "23505" && insertError.message.includes("players_name_unique")) {
        const { data: latestPlayers, error: lookupError } = await supabase
          .from("Players")
          .select("*")
          .order("Name", { ascending: true });
        if (lookupError) {
          console.error("Could not check for duplicate player name:", lookupError);
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
        : "Could not create this player. Please try again.");
      return;
    }

    let creationMessage = "Player added.";
    if (preferredColor) {
      const { error: colorError } = await supabase.rpc("set_player_preferred_color", {
        p_player_id: insertedPlayer.id,
        p_color: preferredColor,
      });
      if (colorError) {
        console.error("Could not assign the selected Belote player color:", colorError);
        creationMessage = "Player added with a default color; the selected color could not be assigned.";
      }
    }

    const { data: refreshedPlayers, error: refreshError } = await supabase
      .from("Players")
      .select("*")
      .order("Name", { ascending: true });
    setSaving(false);
    setName("");
    setPreferredColor(null);
    setMessage(creationMessage);
    if (refreshError) {
      console.error("Could not refresh Belote players after creation:", refreshError);
      setError("Player was added, but the player list could not be refreshed.");
      return;
    }
    setPlayers(refreshedPlayers ?? []);
  };

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Belote Players</h1>
          <p className="text-sm text-gray-400">These are the same player records used by Tarot. Belote profiles and stats are separate.</p>
        </div>
      </div>
      <form onSubmit={createPlayer} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          aria-label="New Player Name"
          placeholder="New Player Name"
          value={name}
          onChange={event => setName(event.target.value)}
          maxLength={20}
          required
          className="w-[20ch] max-w-full rounded border border-gray-600 bg-gray-950 px-3 py-2 text-white placeholder:text-gray-400"
        />
        <PlayerColorPicker
          color={preferredColor ?? defaultColor ?? "#6b7280"}
          availableColors={availableColors}
          onSelect={setPreferredColor}
          disabled={saving || availableColors.length === 0}
        />
        <button
          type="submit"
          disabled={saving || !defaultColor}
          className="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600 disabled:opacity-50"
        >
          {!defaultColor ? "No colors available" : saving ? "Adding…" : "Add player"}
        </button>
      </form>
      {duplicatePlayer && (
        <DuplicatePlayerPrompt
          player={duplicatePlayer}
          profileHref={`/belote/players/${duplicatePlayer.id}`}
          onChooseDifferentName={() => {
            setDuplicatePlayer(null);
            setName("");
            setError(null);
          }}
        />
      )}
      {error && <p role="alert" className="text-red-500">{error}</p>}
      {message && <p role="status" className="text-green-500">{message}</p>}
      <section>
        <div className="mb-3 flex flex-nowrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <h2 className="whitespace-nowrap text-sm font-semibold sm:text-lg">
              {showAllPlayers ? "All Players" : "Recent Players"}
            </h2>
            <button
              type="button"
              onClick={() => setShowAllPlayers(showAll => !showAll)}
              className="whitespace-nowrap rounded border border-gray-600 px-2 py-1 text-xs hover:bg-gray-800 sm:px-3 sm:py-2 sm:text-sm"
            >
              {showAllPlayers ? "Show recent" : "Show all"}
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <label htmlFor="belote-player-sort" className="hidden text-sm font-medium sm:inline">
              Sort by
            </label>
            <select
              id="belote-player-sort"
              value="name"
              onChange={() => undefined}
              className="w-24 rounded border border-gray-600 bg-gray-950 px-2 py-1 text-xs text-white sm:w-auto sm:px-3 sm:py-2 sm:text-sm"
            >
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        {loading ? (
          <p>Loading players…</p>
        ) : players.length === 0 ? (
          <p>No players have been added yet.</p>
        ) : listedPlayers.length === 0 ? (
          <p className="text-sm text-gray-400">No players appeared in the last 20 Belote matches. Show all players to view the full list.</p>
        ) : (
          <ul className="space-y-1">
            {[...listedPlayers]
              .sort((a, b) => a.Name.localeCompare(b.Name))
              .map(player => (
                <li key={player.id} className="flex flex-wrap items-center gap-2 py-1">
                  <div className="flex min-w-40 flex-1 flex-col gap-1">
                    <Link
                      href={`/belote/players/${player.id}`}
                      className="w-fit font-semibold text-blue-700 hover:underline dark:text-blue-300"
                      style={{ color: player.preferred_color ?? undefined }}
                    >
                      {player.Name}
                    </Link>
                    <ul aria-label={`${player.Name} Belote statistics`} className="flex flex-wrap gap-1">
                      <li className="rounded-full border border-gray-600 bg-black/20 px-2 py-0.5 text-xs leading-tight">
                        Matches {matchCounts.get(player.id) ?? 0}
                      </li>
                    </ul>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}
