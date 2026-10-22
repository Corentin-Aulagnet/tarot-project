"use client";
import { useState } from "react";
import { aggregateIterativeScores, aggregateTotalScores, buildGamePlayerTotals } from "@/lib/scoreUtils"
import {GamesTable} from "@/components/GameTable/GameTable"
import { Games, Players } from "@/utils/supabase/types";
import dynamic from 'next/dynamic';
import { getLastPlayers,filterInMonth } from "@/lib/gameUtils";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});

export default function Post({games, players}: { games: Games[] | null, players: Players[] | null }) {
  const [monthIndex, setMonthIndex] = useState(new Date().getUTCMonth());
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  if (!games || !players) {
    return <div>Failed to load data</div>
  }

  const recentPlayers = getLastPlayers(games, players, 20) ?? [];
  const displayedPlayers = showAllPlayers ? players : recentPlayers;
  const table = buildGamePlayerTotals(games, players)
  const totals = aggregateTotalScores(games, players)
 
  const gamesInMonth = filterInMonth(games, monthIndex);
  const chartData = aggregateIterativeScores(gamesInMonth, players);
  const allGamesChartData = aggregateIterativeScores(games, players);
  const monthName = new Date(0, monthIndex).toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-8">
      <section className="pb-4">
        <h1 className="mb-2 text-xl font-extrabold">Month Data</h1>
        <div className="h-[min(60vh,32rem)] min-h-64 w-full sm:h-[min(65vh,38rem)]">
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
          table={buildGamePlayerTotals(gamesInMonth, players)}
          totals={aggregateTotalScores(gamesInMonth, players)}
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
        <div className="h-[min(60vh,32rem)] min-h-64 w-full sm:h-[min(65vh,38rem)]">
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