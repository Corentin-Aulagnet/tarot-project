"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { findDuplicatePlayer } from "@/lib/playerNames";
import { getAvailablePlayerColors, getUnassignedPlayerColor } from "@/lib/playerColors";
import { getTrickGameLoadError, TrickGameRecord, TrickGameVariant } from "@/lib/trickGames";
import DuplicatePlayerPrompt from "@/components/DuplicatePlayerPrompt";
import PlayerColorPicker from "@/components/PlayerColorPicker";

export default function TrickGamePlayers({ variant }: { variant: TrickGameVariant }) {
  const title = variant === "coinche" ? "Coinche" : "Belote";
  const [players, setPlayers] = useState<Players[]>([]);
  const [games, setGames] = useState<TrickGameRecord[]>([]);
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
    const load = async () => {
      const [playerResult, gameResult] = await Promise.all([
        supabase.from("Players").select("*").order("Name", { ascending: true }),
        variant === "coinche"
          ? supabase.from("CoincheGames").select("*").order("created_at", { ascending: false })
          : supabase.from("BeloteGames").select("*").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      const failure = playerResult.error ?? gameResult.error;
      if (failure) {
        console.error(`Could not load ${title} players:`, failure);
        setError(getTrickGameLoadError(variant, failure.code));
      } else {
        setPlayers(playerResult.data ?? []);
        setGames((gameResult.data ?? []) as TrickGameRecord[]);
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [title, variant]);

  const gameCounts = new Map<string, number>();
  const recentPlayerIds = new Set(
    games.slice(0, 20).flatMap(game => {
      const ids = [
        game.team1_player1_id, game.team1_player2_id,
        game.team2_player1_id, game.team2_player2_id,
      ];
      ids.forEach(id => gameCounts.set(id, (gameCounts.get(id) ?? 0) + 1));
      return ids;
    })
  );
  const listedPlayers = showAllPlayers ? players : players.filter(player => recentPlayerIds.has(player.id));
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
      .insert({ Name: trimmedName, preferred_color: defaultColor, preferred_color_selected: false })
      .select("id")
      .single();
    if (insertError) {
      setSaving(false);
      console.error(`Could not create ${title} player:`, insertError);
      setError(insertError.code === "23505"
        ? "A player with this name or color already exists. Please try again."
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
        console.error(`Could not assign the selected ${title} player color:`, colorError);
        creationMessage = "Player added with a default color; the selected color could not be assigned.";
      }
    }

    const { data: refreshedPlayers, error: refreshError } = await supabase
      .from("Players").select("*").order("Name", { ascending: true });
    setSaving(false);
    setName("");
    setPreferredColor(null);
    setMessage(creationMessage);
    if (refreshError) {
      console.error(`Could not refresh ${title} players:`, refreshError);
      setError("Player was added, but the player list could not be refreshed.");
      return;
    }
    setPlayers(refreshedPlayers ?? []);
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-3 sm:p-4">
      <div>
        <h1 className="text-xl font-bold">{title} Players</h1>
        <p className="text-xs text-gray-400">Player profiles are shared with Tarot and other game apps.</p>
      </div>
      <form onSubmit={createPlayer} className="flex flex-wrap items-center gap-2">
        <input type="text" aria-label="New Player Name" placeholder="New Player Name"
          value={name} onChange={event => setName(event.target.value)} maxLength={20} required
          className="w-[20ch] max-w-full rounded border border-gray-600 bg-gray-950 px-3 py-1.5 text-sm text-white placeholder:text-gray-400" />
        <PlayerColorPicker color={preferredColor ?? defaultColor ?? "#6b7280"}
          availableColors={availableColors} onSelect={setPreferredColor}
          disabled={saving || availableColors.length === 0} />
        <button type="submit" disabled={saving || !defaultColor}
          className="rounded bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50">
          {!defaultColor ? "No colors available" : saving ? "Adding…" : "Add player"}
        </button>
      </form>
      {duplicatePlayer && (
        <DuplicatePlayerPrompt player={duplicatePlayer}
          profileHref={`/${variant}/players/${duplicatePlayer.id}`}
          onChooseDifferentName={() => {
            setDuplicatePlayer(null);
            setName("");
            setError(null);
          }} />
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {message && <p role="status" className="text-sm text-green-400">{message}</p>}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Players</h2>
          <button type="button" onClick={() => setShowAllPlayers(value => !value)}
            className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800">
            {showAllPlayers ? "Show recent players" : "Show all players"}
          </button>
        </div>
        {loading ? <p className="text-sm text-gray-400">Loading players…</p> : error ? null : listedPlayers.length === 0 ? (
          <p className="text-sm text-gray-400">
            {players.length === 0 ? "No players have been added yet." : "No recent players. Show all players to view the full list."}
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-1">
            {[...listedPlayers].sort((a, b) => a.Name.localeCompare(b.Name)).map(player => (
              <li key={player.id} className="flex items-center justify-between gap-2 rounded border border-gray-800 px-2 py-1.5">
                <Link href={`/${variant}/players/${player.id}`} className="truncate text-sm font-medium hover:underline"
                  style={{ color: player.preferred_color ?? undefined }}>
                  {player.Name}
                </Link>
                <span className="shrink-0 text-xs text-gray-500">{gameCounts.get(player.id) ?? 0} games</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
