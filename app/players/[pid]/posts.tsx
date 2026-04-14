"use client";
import { Constants,Games,getWinningTeam,Players } from "@/utils/supabase/supabase";
import { IterativeTotalLineChart } from "@/components/IterativeTotalLineChart";
import { aggregateIterativeScores,buildGamePlayerTotals } from "@/lib/scoreUtils";

export default function Posts({ player,games }:{ player: Players,games:Games[]|null }) {
    const pointsPerGame = games? buildGamePlayerTotals(games, [player]):null;
    return (<div>
        <h1>{player.Name}</h1>
        <h2>Games</h2>
        <IterativeTotalLineChart chartData={aggregateIterativeScores(games || [], [player])} players={[player]} />
        <ul>Games played: {games?.length || 0}</ul>
        <ul>Games won: {games?.filter(game => getWinningTeam(game).includes(player.id)).length || 0}</ul>
        <ul>Average points per game: {games?.length ? (games.reduce((sum, game) => sum + (pointsPerGame?.[game.id]?.[player.id] || 0), 0) / games.length).toFixed(2) : '0.00'}</ul>
    </div>
    )
}