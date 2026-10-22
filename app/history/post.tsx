"use client";
import { aggregateIterativeScores, aggregateTotalScores, buildGamePlayerTotals } from "@/lib/scoreUtils"
import {GamesTable} from "@/components/GameTable/GameTable"
import { Games, Players } from "@/utils/supabase/types";
import dynamic from 'next/dynamic';
import { getLastPlayers,filterInMonth } from "@/lib/gameUtils";
import { useState } from "react";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});

export default function Post({games, players}: { games: Games[] | null, players: Players[] | null }) {
  const [monthIndex, setMonthIndex] = useState(new Date().getUTCMonth());
  const [showAllPlayers, setShowAllPlayers] = useState(false);
    if (!games || !players) {
    return <div>Failed to load data</div>
  }

  const table = buildGamePlayerTotals(games, players)
  const totals = aggregateTotalScores(games, players)
 
  const gamesInMonth = filterInMonth(games, monthIndex);
  const recentPlayers = getLastPlayers(games, players, 20) ?? [];
  const displayedPlayers = showAllPlayers ? players : recentPlayers;
  const chartData = aggregateIterativeScores(gamesInMonth, players);
  const allGamesChartData = aggregateIterativeScores(games, players);
    return (<div>
    <h1 className="mb-2 text-xl font-extrabold">Month Data</h1>
    <div className="mb-8">
    <div className="h-[min(60vh,32rem)] min-h-64 w-full sm:h-[min(65vh,38rem)]">
      <div className="mb-2 flex items-center justify-between">
        <select
          value={monthIndex}
          onChange={(e) => setMonthIndex(parseInt(e.target.value, 10))}
          aria-label="Select month"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAllPlayers(!showAllPlayers)}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {showAllPlayers ? "Show recent players" : "Show all players"}
        </button>
      </div>
    <LineChart data={chartData} players={displayedPlayers} lastPlayers={displayedPlayers}  zoomIndex={10}/>
</div>
</div>
<h1 className="mb-2 font-extrabold">Games for {new Date(0, monthIndex).toLocaleString('default', { month: 'long' })}</h1>
    <GamesTable games={gamesInMonth} players={displayedPlayers} table={buildGamePlayerTotals(gamesInMonth, players)} totals={aggregateTotalScores(gamesInMonth, players)}/>
    <h1 className="mb-2 mt-6 text-xl font-extrabold">All Time Data</h1>
    <div className="mb-6 h-[min(60vh,32rem)] min-h-64 w-full sm:h-[min(65vh,38rem)]">
      <LineChart
        data={allGamesChartData}
        players={displayedPlayers}
        lastPlayers={displayedPlayers}
        zoomIndex={10}
      />
    </div>
    <h1 className="mb-2 font-extrabold">All Games</h1>
    <GamesTable games={games} players={displayedPlayers} table={table} totals={totals}/>
    </div>)}