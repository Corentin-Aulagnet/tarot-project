"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Players } from "@/utils/supabase/types";
import { supabase } from "@/utils/supabase/client";
import {
  formatTrickGameDate,
  getTrickGameLoadError,
  scoreTrickGameHistory,
  TrickGameRecord,
  TrickGameVariant,
} from "@/lib/trickGames";

export default function TrickGameDetails({ variant }: { variant: TrickGameVariant }) {
  const params = useParams<Record<string, string>>();
  const gameId = params.gameId ?? params.matchId;
  const isCoinche = variant === "coinche";
  const gameTitle = isCoinche ? "Coinche" : "Belote";
  const [games, setGames] = useState<TrickGameRecord[]>([]);
  const [players, setPlayers] = useState<Players[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("Players").select("*"),
      isCoinche
        ? supabase.from("CoincheGames").select("*").order("created_at", { ascending: true })
        : supabase.from("BeloteGames").select("*").order("created_at", { ascending: true }),
    ]).then(([playerResult, gameResult]) => {
      if (!active) return;
      const failure = playerResult.error ?? gameResult.error;
      if (failure) {
        console.error(`Could not load ${variant} game:`, failure);
        setError(getTrickGameLoadError(variant, failure.code));
      } else {
        setPlayers(playerResult.data ?? []);
        setGames((gameResult.data ?? []) as TrickGameRecord[]);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [isCoinche, variant]);

  const playersById = useMemo(() => new Map(players.map(player => [player.id, player])), [players]);
  const game = games.find(item => item.id === gameId);
  const scores = scoreTrickGameHistory(variant, games).scoresByGameId;
  const score = game ? scores.get(game.id) : undefined;

  if (loading) return <main className="p-4 text-sm text-gray-300">Loading game…</main>;
  if (!game || !score) {
    return <main className="p-4"><p role="alert" className="text-sm text-red-400">{error ?? `${gameTitle} game not found.`}</p></main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href={`/${variant}`} className="text-xs text-gray-400 hover:text-white">← {gameTitle} games</Link>
          <h1 className="mt-1 text-lg font-bold">{gameTitle} · {formatTrickGameDate(game.created_at)}</h1>
        </div>
        <Link href={`/${variant}/new`} className="rounded bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700">New Game</Link>
      </div>

      <section className="grid grid-cols-2 gap-2">
        {[
          { playerIds: [game.team1_player1_id, game.team1_player2_id], points: score.team1 },
          { playerIds: [game.team2_player1_id, game.team2_player2_id], points: score.team2 },
        ].map((team, index) => (
          <div key={index} className="rounded border border-gray-700 bg-gray-900 p-3 text-center">
            <p className="truncate text-xs text-gray-300">
              {team.playerIds.map((playerId, playerIndex) => (
                <span key={playerId}>
                  {playerIndex > 0 && " & "}
                  <span style={{ color: playersById.get(playerId)?.preferred_color ?? undefined }}>
                    {playersById.get(playerId)?.Name ?? "Player"}
                  </span>
                </span>
              ))}
            </p>
            <p className={`text-2xl font-bold ${team.points >= 0 ? "text-green-300" : "text-red-300"}`}>
              {team.points > 0 ? "+" : ""}{team.points}
            </p>
            <p className="text-xs text-gray-500">per player</p>
          </div>
        ))}
      </section>

      <section className="rounded border border-gray-700 bg-gray-900 p-3 text-sm">
        <h2 className="mb-2 text-sm font-semibold">Game details</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <dt className="text-gray-400">Takers</dt><dd>Team {game.contract_team}</dd>
          {game.contract_type && <><dt className="text-gray-400">Called colour</dt><dd>{game.contract_type}</dd></>}
          {isCoinche && game.contract_points != null && (
            <><dt className="text-gray-400">Contract</dt><dd>{game.contract_points} points</dd></>
          )}
          <dt className="text-gray-400">Cards</dt><dd>{game.team1_points}–{162 - game.team1_points}</dd>
          <dt className="text-gray-400">Belote / Rebelote</dt><dd>{game.belote_team ? `Team ${game.belote_team}` : "None"}</dd>
          {isCoinche && game.coinched && <><dt className="text-gray-400">Coinched</dt><dd>Yes</dd></>}
          {isCoinche && game.surcoinched && <><dt className="text-gray-400">Sur-coinched</dt><dd>Yes</dd></>}
          {isCoinche && game.capot_announced && <><dt className="text-gray-400">Capot annoncé</dt><dd>Yes</dd></>}
          <dt className="text-gray-400">Contract</dt><dd>{score.contractMade ? "Made" : "Not made"}</dd>
          <dt className="text-gray-400">Team differential</dt><dd>{score.differential}</dd>
          {score.heldPoints > 0 && <><dt className="text-amber-300">Points held</dt><dd className="text-amber-300">81 · next same lineup game</dd></>}
        </dl>
      </section>
    </main>
  );
}
