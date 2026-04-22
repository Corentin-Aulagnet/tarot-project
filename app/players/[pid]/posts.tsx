"use client"
import { Constants,Games,getWinningTeam,Players } from "@/utils/supabase/supabase";
import { aggregateIterativeScores,buildGamePlayerTotals } from "@/lib/scoreUtils";
import dynamic from "next/dynamic";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});


export default function Posts({ player,games }:{ player: Players,games:Games[]|null}) {
    const pointsPerGame = games? buildGamePlayerTotals(games, [player]):null;
    
    
    return (<div>
        <h1>{player.Name}</h1>
        <h2>Games</h2>
        <div className= "not-landscape:h-100 landscape:h-70"><LineChart  data={aggregateIterativeScores(games || [], [player])} players={[player]} zoomIndex={null}/></div>
        <ul>Games played: {games?.length || 0}</ul>
        <ul>Games won: {games?.filter(game => getWinningTeam(game).includes(player.id)).length || 0}</ul>
        <ul>Average points per game: {games?.length ? (games.reduce((sum, game) => sum + (pointsPerGame?.[game.id]?.[player.id] || 0), 0) / games.length).toFixed(2) : '0.00'}</ul>
    </div>
    )
}