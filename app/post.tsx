"use client";
import { aggregateIterativeScores, aggregateTotalScores, buildGamePlayerTotals } from "@/lib/scoreUtils"
import {GamesTable} from "@/components/GameTable/GameTable"
import Link from "next/link";
import { Games, Players } from "@/utils/supabase/supabase";
import dynamic from 'next/dynamic';

const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});
export default function Post({games, players}: { games: Games[] | null, players: Players[] | null }) {
    if (!games || !players) {
    return <div>Failed to load data</div>
  }

  const table = buildGamePlayerTotals(games, players)
  const totals = aggregateTotalScores(games, players)
  const chartData = aggregateIterativeScores(games, players)  
    return (<div>
    <div className= "not-landscape:h-100 landscape:h-70" >
    <LineChart data={chartData} players={players}  zoomIndex={10}/>
</div>
    <h1 className="font-extrabold">All Games</h1>
    <GamesTable games={games} players={players} table={table} totals={totals}/>
    {/*<StickyTable/>*/}
     <div className="flex justify-center mt-6">
    <Link  href="/games/new"
   
  className="bg-blue-500 text-white px-6 py-3 rounded text-lg hover:bg-blue-600 transition"
>
  Start New Game
</Link></div></div>)}