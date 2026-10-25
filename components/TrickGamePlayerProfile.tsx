"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Players } from "@/utils/supabase/types";
import { supabase } from "@/utils/supabase/client";
import {
  formatTrickGameDate,
  getTrickGameLoadError,
  scoreTrickGameHistory,
  TrickGameRecord,
  TrickGameVariant,
} from "@/lib/trickGames";

export default function TrickGamePlayerProfile({ variant }: { variant: TrickGameVariant }) {
  const { pid } = useParams<{ pid: string }>();
  const title = variant === "coinche" ? "Coinche" : "Belote";
  const [player, setPlayer] = useState<Players | null>(null);
  const [games, setGames] = useState<TrickGameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [playerResult, gamesResult] = await Promise.all([
        supabase.from("Players").select("*").eq("id", pid).single(),
        variant === "coinche"
          ? supabase.from("CoincheGames").select("*").order("created_at", { ascending: false })
          : supabase.from("BeloteGames").select("*").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      const failure = playerResult.error ?? gamesResult.error;
      if (failure) {
        console.error(`Could not load ${title} player profile:`, failure);
        setError(getTrickGameLoadError(variant, failure.code));
      } else {
        setPlayer(playerResult.data);
        setGames((gamesResult.data ?? []) as TrickGameRecord[]);
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [pid, title, variant]);

  const scores = useMemo(() => scoreTrickGameHistory(variant, games).scoresByGameId, [games, variant]);
  const playerGames = games.filter(game => [
    game.team1_player1_id, game.team1_player2_id,
    game.team2_player1_id, game.team2_player2_id,
  ].includes(pid));
  const totals = playerGames.reduce((stats, game) => {
    const score = scores.get(game.id);
    if (!score) return stats;
    const playerTeam = game.team1_player1_id === pid || game.team1_player2_id === pid ? 1 : 2;
    const points = playerTeam === 1 ? score.team1 : score.team2;
    return {
      games: stats.games + 1,
      wins: stats.wins + Number(score.winnerTeam === playerTeam),
      points: stats.points + points,
    };
  }, { games: 0, wins: 0, points: 0 });

  if (loading) return <main className="p-4 text-sm text-gray-300">Loading player…</main>;
  if (!player || error) {
    return <main className="p-4"><p role="alert" className="text-sm text-red-400">{error ?? "Player not found."}</p></main>;
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-3 sm:p-4">
      <div>
        <Link href={`/${variant}/players`} className="text-xs text-gray-400 hover:text-white">← {title} players</Link>
        <h1 className="mt-1 text-xl font-bold" style={{ color: player.preferred_color ?? undefined }}>{player.Name}</h1>
      </div>
      <section className="grid grid-cols-3 gap-2">
        {[["Games", totals.games], ["Wins", totals.wins], ["Balanced points", totals.points]].map(([label, value]) => (
          <div key={label} className="rounded border border-gray-700 bg-gray-900 p-2">
            <p className="text-xs text-gray-400">{label}</p><p className="text-lg font-bold">{value}</p>
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Recent games</h2>
        {playerGames.length === 0 ? <p className="text-sm text-gray-400">No games recorded for this player yet.</p> : (
          <ul className="space-y-1">
            {playerGames.map(game => {
              const score = scores.get(game.id);
              if (!score) return null;
              const team: 1 | 2 = game.team1_player1_id === pid || game.team1_player2_id === pid ? 1 : 2;
              const points = team === 1 ? score.team1 : score.team2;
              return (
                <li key={game.id}>
                  <Link href={`/${variant}/${game.id}`} className="flex items-center justify-between gap-2 rounded border border-gray-800 px-2 py-1.5 text-xs hover:border-gray-600">
                    <span>{formatTrickGameDate(game.created_at)} · Team {team} · {game.contract_type ?? title}</span>
                    <span className={`font-semibold ${points >= 0 ? "text-green-300" : "text-red-300"}`}>{points > 0 ? "+" : ""}{points}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
