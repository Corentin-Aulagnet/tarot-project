"use client";

/**
 * Belote / Coinche home page: same layout as the Tarot home page (app/post.tsx).
 * Month chart + table, then all-time chart + table, with a recent/all players toggle.
 * Scores are computed over the full history so held 81-point carries stay correct inside a month.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { GamesTable } from "@/components/GameTable/GameTable";
import { filterInMonth } from "@/lib/gameUtils";
import {
  aggregateTrickGameIterativeScores,
  BeloteGame,
  buildTrickGamePlayerTotals,
  CoincheGame,
  getRecentTrickGamePlayers,
  getTrickGameLoadError,
  isTrickGameTaker,
  scoreTrickGameHistory,
  sumTrickGamePlayerTotals,
  TrickGameRecord,
  TrickGameVariant,
} from "@/lib/trickGames";

const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false,
});

export default function TrickGameHistory({ variant }: { variant: TrickGameVariant }) {
  const isCoinche = variant === "coinche";
  const [games, setGames] = useState<TrickGameRecord[]>([]);
  const [players, setPlayers] = useState<Players[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthIndex, setMonthIndex] = useState(new Date().getUTCMonth());
  const [showAllPlayers, setShowAllPlayers] = useState(false);

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

  const scores = useMemo(() => scoreTrickGameHistory(variant, games).scoresByGameId, [variant, games]);
  const recentPlayers = useMemo(() => getRecentTrickGamePlayers(games, players), [games, players]);
  const displayedPlayers = showAllPlayers || recentPlayers.length === 0 ? players : recentPlayers;
  const table = useMemo(() => buildTrickGamePlayerTotals(games, scores), [games, scores]);
  const totals = useMemo(() => sumTrickGamePlayerTotals(players, table), [players, table]);
  const gamesInMonth = useMemo(() => filterInMonth(games, monthIndex), [games, monthIndex]);
  const monthlyTable = useMemo(() => buildTrickGamePlayerTotals(gamesInMonth, scores), [gamesInMonth, scores]);
  const monthlyTotals = useMemo(() => sumTrickGamePlayerTotals(players, monthlyTable), [players, monthlyTable]);
  const chartData = useMemo(
    () => aggregateTrickGameIterativeScores(gamesInMonth, players, monthlyTable),
    [gamesInMonth, players, monthlyTable]
  );
  const allGamesChartData = useMemo(
    () => aggregateTrickGameIterativeScores(games, players, table),
    [games, players, table]
  );
  const monthName = new Date(0, monthIndex).toLocaleString("default", { month: "long" });

  const tableProps = {
    players: displayedPlayers,
    recentPlayers: !showAllPlayers,
    getGameHref: (game: TrickGameRecord) => `/${variant}/${game.id}`,
    getGameLabel: (game: TrickGameRecord) => isCoinche
      ? [
          game.capot_announced ? "Capot" : game.contract_points,
          game.contract_type,
          game.surcoinched ? "×4" : game.coinched ? "×2" : null,
        ].filter(part => part != null && part !== "").join(" ")
      : game.contract_type,
    isTaker: isTrickGameTaker,
    getPlayerHref: (playerId: string) => `/${variant}/players/${playerId}`,
  };

  const playersToggle = (
    <button
      type="button"
      onClick={() => setShowAllPlayers(showAll => !showAll)}
      className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {showAllPlayers ? "Show recent players" : "Show all players"}
    </button>
  );

  if (loading) return <main className="p-6 text-sm text-gray-400">Loading games…</main>;
  if (error) return <main className="p-6"><p role="alert" className="text-sm text-red-400">{error}</p></main>;

  return (
    <main className="p-6">
      <div className="space-y-8">
        <section className="pb-4">
          <h1 className="mb-2 text-xl font-extrabold">Month Data</h1>
          <div className="h-[min(42vh,22.4rem)] min-h-[11.2rem] w-full sm:h-[min(45.5vh,26.6rem)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="month-select" className="sr-only">Select month</label>
              <select
                id="month-select"
                value={monthIndex}
                onChange={event => setMonthIndex(Number(event.target.value))}
                aria-label="Select month"
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index} value={index}>
                    {new Date(0, index).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
              {playersToggle}
            </div>
            <LineChart data={chartData} players={displayedPlayers} lastPlayers={displayedPlayers} zoomIndex={10} />
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-extrabold">Games for {monthName}</h2>
          <GamesTable {...tableProps} games={gamesInMonth} table={monthlyTable} totals={monthlyTotals} />
        </section>
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">All Time Data</h2>
            {playersToggle}
          </div>
          <div className="h-[min(42vh,22.4rem)] min-h-[11.2rem] w-full sm:h-[min(45.5vh,26.6rem)]">
            <LineChart data={allGamesChartData} players={displayedPlayers} lastPlayers={displayedPlayers} zoomIndex={10} />
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-extrabold">All Games</h2>
          <GamesTable {...tableProps} games={games} table={table} totals={totals} />
        </section>
      </div>
    </main>
  );
}

export type { BeloteGame, CoincheGame };
