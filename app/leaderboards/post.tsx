"use client"
import { aggregateTotalScores, getMonthScores, getPlayersByMostPlayed } from "@/lib/scoreUtils"
import { Players,Games } from "@/utils/supabase/types"
import { TrendingUp,TrendingDown } from "@deemlol/next-icons"

import { motion } from "framer-motion";
import { useState } from "react";
export  function AnimatedPodium({podiumData}:{ podiumData: { id: number,changeInScore:number,previousScore:number,actualScore:number, name: string | undefined ,color: string, activeColor: string,baseHeight: number}[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div className="flex items-end justify-center gap-6 h-[500px] p-10">
      {podiumData.map((item) => {
        const isActive = activeId === item.id;

        return (
          <motion.div
            key={item.id}
            layout
            onClick={() =>
              setActiveId(isActive ? null : item.id)
            }
            animate={{
              height: isActive
                ? item.baseHeight +120
                : item.baseHeight,
              y: isActive ? -10 : 0,
              scale: isActive ? 1.05 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
            }}
            className={`
              relative
              w-40
              cursor-pointer
              rounded-3xl
              p-4
              text-white
              shadow-2xl
              flex
              flex-col
              items-center
              justify-start
              overflow-hidden
              transition-colors
              duration-300
              ${
                isActive
                  ? item.activeColor
                  : item.color
              }
            `}
          >
            <div className="text-4xl font-bold">
              #{item.id}
            </div>

            <div className="mt-2 text-xl font-semibold">
              {item.name}
            </div>

            <motion.div
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                y: isActive ? 0 : 20,
              }}
              transition={{ duration: 0.25 }}
              className="mt-6 text-center"
            >
                <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-lg font-medium">
                    {item.previousScore} pts</p>
               <div className="flex items-center justify-center gap-2">
                    {item.changeInScore > 0 ? (
                    
                    <TrendingUp className="text-green-300" />) : item.changeInScore < 0 ? (
                    <TrendingDown className="text-red-300" />) : null}
                <p className="text-lg font-medium">
              
                {item.changeInScore > 0 ? `+${item.changeInScore}` : item.changeInScore} pts
              </p></div>
              <p className="text-lg font-medium">
                    {item.actualScore} pts</p>
      </div>
             {/* <p className="mt-2 text-sm opacity-80">
                Additional information about the player
                can appear here.
              </p>*/}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
export function Podium({items}:{ items: { place: number; name: string | undefined; height: string }[] }) {

  return (
    <div className="flex items-end justify-center gap-6 h-80">
      {items.map((item) => (
        <div
          key={item.place}
          className={`
            ${item.height}
            w-32
            rounded-2xl
            bg-zinc-800
            text-white
            flex
            flex-col
            items-center
            justify-center
            shadow-lg
          `}
        >
          <div className="text-3xl font-bold">
            #{item.place}
          </div>

          <div className="mt-2 text-lg">
            {item.name}
          </div>
        </div>
      ))}
    </div>
  );
}


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
  const pointsPerPlayer = aggregateTotalScores(games,players);
  console.log("Best Players:", bestOfMonthSorted);
  console.log("Worst Players:", worstOfMonthSorted);
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
                <div key ={playerId}className="flex items-center gap-1">
                <TrendingUp className="text-green-500" />
                <li>
                    {mostPlayedPlayers.find(p => p.id === playerId)?.Name}: +{score} 
                </li>
                </div>
            ))}
        </ul>
        <p className="font-semibold mb-4">Worst of {monthName} (points lost in {monthName})</p>
        <ul>
            {worstOfMonthSorted.map(([playerId, score]) => (
                <div key ={playerId}className="flex items-center gap-1">
                <TrendingDown className="text-red-500" />
                <li>
                    {mostPlayedPlayers.find(p => p.id === playerId)?.Name}: {score}
                </li>
                </div>
            ))}
        </ul>
        <Podium items={bestOfMonthSorted.map((value, index) => {
          const [playerId, score] = value;
          console.log("Player ID:", playerId, "Score:", score,"index:", index,"height:", `h-${32 + (3-(index)) * 8}`);
          return {
            place: index + 1,
            name: mostPlayedPlayers.find(p => p.id === playerId)?.Name,
            height: `h-${56 - index*(index===1?16:4)}`//Gets the height to 56 then 40 then 32, to make the podium look better
          };
        })} />
        <AnimatedPodium podiumData={bestOfMonthSorted.map((value, index) => {
          const [playerId, changeInScore] = value;
          console.log("Player ID:", playerId, "Score:", changeInScore,"index:", index,"height:", 200 + (3-(index)) * 40);
            return {
                id: index+1,
                changeInScore: changeInScore,
                name: mostPlayedPlayers.find(p => p.id === playerId)?.Name,
                color: index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-500",
                activeColor: "bg-green-600" ,
                baseHeight: 260 - index*(index===1?80:60),
                previousScore: pointsPerPlayer[playerId] - changeInScore,
                actualScore: pointsPerPlayer[playerId],
                
            }
        })}/>
    </div>
    
}