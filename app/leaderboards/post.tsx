"use client"
import { aggregateTotalScores, getMonthScores, getPlayersByMostPlayed } from "@/lib/scoreUtils"
import { Players,Games } from "@/utils/supabase/types"

export default function Post({ games, players,monthIndex,monthName }: { games:Games[], players: Players[],monthIndex:number,monthName:string }){
    const [playerGameCount,_mostPlayedPlayers] = getPlayersByMostPlayed(games, players);
    const mostPlayedPlayers = _mostPlayedPlayers.slice(0,10);
    
    const sortedGames = [...games].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const gamesInMonth = sortedGames.filter(g => {
        const gameDate = new Date(g.created_at)
    return gameDate.getUTCMonth() === monthIndex
  });
  const bestOfMonth = aggregateTotalScores(gamesInMonth, mostPlayedPlayers);
  const bestOfMonthSorted = Object.entries(bestOfMonth).sort((a,b) => b[1] - a[1]).slice(0,3);
  const worstOfMonthSorted = Object.entries(bestOfMonth).sort((a,b) => a[1] - b[1]).slice(0,3);
    return <div className="p-6">
        <h1 className="font-bold mb-4" style={{ fontFamily: "Arial, sans-serif" }}>Leaderboards</h1>
        <p className="font-semibold mb-4">Most Played Players (games played overall, on a total of {games.length} games):</p>
        <ul>
            {mostPlayedPlayers.map((player) => (
                <li key={player.id}>{player.Name}: {playerGameCount[player.id] || 0}</li>
            ))}
        </ul>
        <p className="font-semibold mb-4">Best of {monthName} (points won in {monthName})</p>
        <ul>
            {bestOfMonthSorted.map(([playerId, score]) => (
                <li key={playerId}>
                    {mostPlayedPlayers.find(p => p.id === playerId)?.Name}: {score} 
                </li>
            ))}
        </ul>
        <p className="font-semibold mb-4">Worst of {monthName} (points lost in {monthName})</p>
        <ul>
            {worstOfMonthSorted.map(([playerId, score]) => (
                <li key={playerId}>
                    {mostPlayedPlayers.find(p => p.id === playerId)?.Name}: {score}
                </li>
            ))}
        </ul>
    </div>
}