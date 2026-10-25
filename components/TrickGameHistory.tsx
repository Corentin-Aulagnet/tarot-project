"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import {
  BeloteGame,
  CoincheGame,
  formatTrickGameDate,
  getTrickGameLoadError,
  scoreTrickGameHistory,
  TrickGameRecord,
  TrickGameVariant,
} from "@/lib/trickGames";

export default function TrickGameHistory({ variant }: { variant: TrickGameVariant }) {
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
      isCoinche
        ? supabase.from("CoincheGames").select("*").order("created_at", { ascending: false })
        : supabase.from("BeloteGames").select("*").order("created_at", { ascending: false }),
    ]).then(([playerResult, gameResult]) => {
      if (!active) return;
      const failure = playerResult.error ?? gameResult.error;
      if (failure) {
        console.error(`Could not load ${variant} games:`, failure);
        setError(getTrickGameLoadError(variant, failure.code));
      } else {
        setPlayers(playerResult.data ?? []);
        setGames((gameResult.data ?? []) as TrickGameRecord[]);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [isCoinche, variant]);

  const playersById = new Map(players.map(player => [player.id, player]));
  const scores = scoreTrickGameHistory(variant, games).scoresByGameId;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">{gameTitle}</h1>
          <p className="text-xs text-gray-400">Single games · zero-sum player scoring</p>
        </div>
        <Link href={`/${variant}/new`} className="rounded bg-gray-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700">
          New Game
        </Link>
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <section className="space-y-2">
        <h2 className="text-base font-bold">Games</h2>
        {loading ? <p className="text-sm text-gray-400">Loading games…</p> : error ? null : games.length === 0 ? (
          <p className="text-sm text-gray-400">No {gameTitle} games recorded yet.</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-2">
            {games.map(game => {
              const score = scores.get(game.id);
              if (!score) return null;
              return (
                <li key={game.id}>
                  <Link href={`/${variant}/${game.id}`} className="block rounded border border-gray-700 bg-gray-900 p-3 hover:border-gray-500">
                    <div className="flex items-start justify-between gap-2 text-xs text-gray-400">
                      <time>{formatTrickGameDate(game.created_at)}</time>
                      <span>{game.contract_type ?? gameTitle}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          <span style={{ color: playersById.get(game.team1_player1_id)?.preferred_color ?? undefined }}>
                            {playersById.get(game.team1_player1_id)?.Name ?? "Player"}
                          </span>
                          {" & "}
                          <span style={{ color: playersById.get(game.team1_player2_id)?.preferred_color ?? undefined }}>
                            {playersById.get(game.team1_player2_id)?.Name ?? "Player"}
                          </span>
                        </p>
                        <p className={`text-lg font-bold ${score.team1 >= 0 ? "text-green-300" : "text-red-300"}`}>
                          {score.team1 > 0 ? "+" : ""}{score.team1}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">vs</span>
                      <div className="min-w-0 text-right">
                        <p className="truncate font-medium">
                          <span style={{ color: playersById.get(game.team2_player1_id)?.preferred_color ?? undefined }}>
                            {playersById.get(game.team2_player1_id)?.Name ?? "Player"}
                          </span>
                          {" & "}
                          <span style={{ color: playersById.get(game.team2_player2_id)?.preferred_color ?? undefined }}>
                            {playersById.get(game.team2_player2_id)?.Name ?? "Player"}
                          </span>
                        </p>
                        <p className={`text-lg font-bold ${score.team2 >= 0 ? "text-green-300" : "text-red-300"}`}>
                          {score.team2 > 0 ? "+" : ""}{score.team2}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Cards {game.team1_points}–{162 - game.team1_points}
                      {game.belote_team ? ` · Team ${game.belote_team} Belote` : ""}
                      {score.heldPoints ? " · 81 held" : ""}
                    </p>
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

export type { BeloteGame, CoincheGame };
