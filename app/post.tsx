"use client";
import { useMemo, useState } from "react";
import {
  aggregateIterativeScores,
  aggregateTotalsFromGamePlayerTotals,
  buildGamePlayerTotals,
} from "@/lib/scoreUtils"
import {GamesTable} from "@/components/GameTable/GameTable"
import { Games, Players } from "@/utils/supabase/types";
import dynamic from 'next/dynamic';
import { getLastPlayers,filterInMonth } from "@/lib/gameUtils";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});

const EMPTY_GAMES: Games[] = [];
const EMPTY_PLAYERS: Players[] = [];

export default function Post({games, players}: { games: Games[] | null, players: Players[] | null }) {
  const [monthIndex, setMonthIndex] = useState(new Date().getUTCMonth());
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const allGames = games ?? EMPTY_GAMES;
  const allPlayers = players ?? EMPTY_PLAYERS;

  const recentPlayers = useMemo(() => getLastPlayers(allGames, allPlayers, 20) ?? [], [allGames, allPlayers]);
  const displayedPlayers = showAllPlayers ? allPlayers : recentPlayers;
  const table = useMemo(() => buildGamePlayerTotals(allGames), [allGames]);
  const totals = useMemo(
    () => aggregateTotalsFromGamePlayerTotals(allGames, allPlayers, table),
    [allGames, allPlayers, table]
  );
  const gamesInMonth = useMemo(() => filterInMonth(allGames, monthIndex), [allGames, monthIndex]);
  const chartData = useMemo(() => aggregateIterativeScores(gamesInMonth, allPlayers), [gamesInMonth, allPlayers]);
  const allGamesChartData = useMemo(() => aggregateIterativeScores(allGames, allPlayers), [allGames, allPlayers]);
  const monthlyTable = useMemo(() => buildGamePlayerTotals(gamesInMonth), [gamesInMonth]);
  const monthlyTotals = useMemo(
    () => aggregateTotalsFromGamePlayerTotals(gamesInMonth, allPlayers, monthlyTable),
    [gamesInMonth, monthlyTable, allPlayers]
  );
  const monthName = new Date(0, monthIndex).toLocaleString("default", { month: "long" });

  if (!games || !players) {
    return <div>Failed to load data</div>
  }

  return (
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
            <button
              type="button"
              onClick={() => setShowAllPlayers(showAll => !showAll)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {showAllPlayers ? "Show recent players" : "Show all players"}
            </button>
          </div>
          <LineChart
            data={chartData}
            players={displayedPlayers}
            lastPlayers={displayedPlayers}
            zoomIndex={10}
          />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-extrabold">Games for {monthName}</h2>
        <GamesTable
          games={gamesInMonth}
          players={displayedPlayers}
          table={monthlyTable}
          totals={monthlyTotals}
          recentPlayers={!showAllPlayers}
        />
      </section>
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">All Time Data</h2>
          <button
            type="button"
            onClick={() => setShowAllPlayers(showAll => !showAll)}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {showAllPlayers ? "Show recent players" : "Show all players"}
          </button>
        </div>
        <div className="h-[min(42vh,22.4rem)] min-h-[11.2rem] w-full sm:h-[min(45.5vh,26.6rem)]">
          <LineChart
            data={allGamesChartData}
            players={displayedPlayers}
            lastPlayers={displayedPlayers}
            zoomIndex={10}
          />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-extrabold">All Games</h2>
        <GamesTable
          games={games}
          players={displayedPlayers}
          table={table}
          totals={totals}
          recentPlayers={!showAllPlayers}
        />
      </section>
    </div>
  );
}