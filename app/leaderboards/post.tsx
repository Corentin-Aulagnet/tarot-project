"use client"
import { getPlayersByMostPlayed } from "@/lib/scoreUtils"
import { Players,Games } from "@/utils/supabase/types"

export default function Post({ games, players,}: { games:Games[], players: Players[]}){
    const mostPlayedPlayers = getPlayersByMostPlayed(games, players);
    
    return <div className="p-6">
        <h1 className="font-bold mb-4" style={{ fontFamily: "Arial, sans-serif" }}>Leaderboards</h1>
        <p className="font-semibold mb-4">Most Played Players:</p>
        <ul>
            {mostPlayedPlayers.map((player) => (
                <li key={player.id}>{player.Name}</li>
            ))}
        </ul>
        <p className="font-semibold mb-4">Best of {new Date().toLocaleString("en-US",{month:'long'})}</p>
        <ul>
            
        </ul>
    </div>
}