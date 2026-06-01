"use client";
import { aggregateIterativeScores, aggregateTotalScores, buildGamePlayerTotals } from "@/lib/scoreUtils"
import {GamesTable} from "@/components/GameTable/GameTable"
import Link from "next/link";
import { Games, Players } from "@/utils/supabase/types";
import dynamic from 'next/dynamic';
import { getLastPlayers,filterInMonth } from "@/lib/gameUtils";
import { useState } from "react";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});

export default function Post({games, players}: { games: Games[] | null, players: Players[] | null }) {
  const [monthIndex, setMonthIndex] = useState(new Date().getUTCMonth());
    if (!games || !players) {
    return <div>Failed to load data</div>
  }

  const table = buildGamePlayerTotals(games, players)
  const totals = aggregateTotalScores(games, players)
 
  const gamesInMonth = filterInMonth(games, monthIndex);
  const lastPlayers = getLastPlayers(games, players) || players;
   const chartData = aggregateIterativeScores(gamesInMonth, players)
    return (<div>
    <div className= "not-landscape:h-100 landscape:h-70" >
      <div className="flex justify-start mb-2">
        <select
          value={monthIndex}
          onChange={(e) => setMonthIndex(parseInt(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>
    <LineChart data={chartData} players={players} lastPlayers={lastPlayers}  zoomIndex={10}/>
</div>
<h1 className="font-extrabold">Games for {new Date(0, monthIndex).toLocaleString('default', { month: 'long' })}</h1>
    <GamesTable games={gamesInMonth} players={players} table={buildGamePlayerTotals(gamesInMonth, players)} totals={aggregateTotalScores(gamesInMonth, players)}/>
    <h1 className="font-extrabold">All Games</h1>
    <GamesTable games={games} players={players} table={table} totals={totals}/>
    </div>)}