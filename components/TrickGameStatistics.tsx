"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import {
  getTrickGameLoadError,
  scoreTrickGameHistory,
  TrickGameRecord,
  TrickGameVariant,
} from "@/lib/trickGames";

export default function TrickGameStatistics({ variant }: { variant: TrickGameVariant }) {
  const isCoinche = variant === "coinche";
  const gameTitle = isCoinche ? "Coinche" : "Belote";
  const [games, setGames] = useState<TrickGameRecord[]>([]);
  const [players, setPlayers] = useState<Players[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("Players").select("*").order("Name", { ascending: true }),
      isCoinche ? supabase.from("CoincheGames").select("*") : supabase.from("BeloteGames").select("*"),
    ]).then(([playersResult, gamesResult]) => {
      if (!active) return;
      const failure = playersResult.error ?? gamesResult.error;
      if (failure) {
        console.error(`Could not load ${variant} statistics:`, failure);
        setError(getTrickGameLoadError(variant, failure.code));
      } else {
        setPlayers(playersResult.data ?? []);
        setGames((gamesResult.data ?? []) as TrickGameRecord[]);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [isCoinche, variant]);

  const rankings = useMemo(() => {
    const scores = scoreTrickGameHistory(variant, games).scoresByGameId;
    const stats = new Map(players.map(player => [player.id, { games: 0, wins: 0, points: 0 }]));
    for (const game of games) {
      const score = scores.get(game.id);
      if (!score) continue;
      const teams = [
        { ids: [game.team1_player1_id, game.team1_player2_id], team: 1 as const, points: score.team1 },
        { ids: [game.team2_player1_id, game.team2_player2_id], team: 2 as const, points: score.team2 },
      ];
      for (const team of teams) {
        for (const id of team.ids) {
          const playerStats = stats.get(id);
          if (!playerStats) continue;
          playerStats.games += 1;
          playerStats.points += team.points;
          if (score.winnerTeam === team.team) playerStats.wins += 1;
        }
      }
    }
    return players
      .flatMap(player => {
        const playerStats = stats.get(player.id);
        return playerStats && playerStats.games > 0 ? [{ player, stats: playerStats }] : [];
      })
      .sort((a, b) =>
        b.stats.wins - a.stats.wins || b.stats.points - a.stats.points
        || a.player.Name.localeCompare(b.player.Name)
      );
  }, [games, players, variant]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-3 sm:p-4">
      <div>
        <h1 className="text-xl font-bold">{gameTitle} Statistics</h1>
        <p className="text-xs text-gray-400">Ranked by wins, then balanced points per player.</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {loading ? <p className="text-sm text-gray-400">Loading statistics…</p> : error ? null : games.length === 0 ? (
        <p className="text-sm text-gray-400">Statistics will appear after the first game.</p>
      ) : (
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
          {rankings.map(({ player, stats }, index) => (
            <li key={player.id} className={`rounded border p-2 ${
              index === 0 ? "border-orange-300 bg-orange-200 text-gray-900"
                : index === 1 ? "border-slate-300 bg-slate-200 text-gray-900"
                  : index === 2 ? "border-stone-400 bg-stone-300 text-gray-900"
                    : "border-[#9fbe98] bg-[#c6dec1] text-gray-900"
            }`}>
              <Link href={`/${variant}/players/${player.id}`} className="text-sm font-semibold hover:underline"
                style={{ color: player.preferred_color ?? undefined }}>
                {index + 1}. {player.Name}
              </Link>
              <p className="text-xs">{stats.wins} wins · {stats.games} games · {stats.points} points</p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
