"use client"
import { aggregateTotalScores, getMonthScores, getPlayersByMostPlayed } from "@/lib/scoreUtils"
import { Players,Games } from "@/utils/supabase/types"
import { TrendingUp,TrendingDown } from "@deemlol/next-icons"

import { motion } from "framer-motion";
import { useState } from "react";
export  function AnimatedPodium({podiumData,fix}:{ podiumData: { id: number,changeInScore:number,previousScore:number,actualScore:number, name: string | undefined ,color: string, activeColor: string,baseHeight: number}[] ,fix:string}) {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div className='flex flex-col items-center gap-6'>
      <motion.div
            key={podiumData[0].id}
            layout
            onClick={() =>
              setActiveId(activeId === podiumData[0].id ? null : podiumData[0].id)
            }
            animate={{
              width: activeId === podiumData[0].id
                ? 300
                : 150,
              //y: activeId === podiumData[0].id ? -20 : 0,
              //width: activeId === podiumData[0].id ? 400 : 120,
              scale: activeId === podiumData[0].id ? 1.05 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
            }} className={`
              relative
              w-54
              rounded-3xl
              cursor-pointer
              p-4
              text-white
              shadow-2xl
              flex
              items-center
              justify-center
              overflow-hidden
              transition-colors
              duration-300
              ${
                activeId === podiumData[0].id
                  ?  podiumData[0].activeColor
                  :  podiumData[0].color
              }
            `}>
              <div className="flex flex-col items-center justify-center gap-2">
              <div className={"flex flex-"+(activeId === podiumData[0].id ? "row" : "col")+" items-center justify-center gap-2"}>
              <div className="text-4xl font-bold">
              #{podiumData[0].id}
            </div>

            <div className="mt-2 text-xl font-semibold">
              {podiumData[0].name}
            </div></div><motion.div
              initial={false}
              animate={{
                opacity: activeId === podiumData[0].id ? 1 : 0,
    height: activeId === podiumData[0].id ? "auto" : 0,
    marginTop: activeId === podiumData[0].id ? 8 : 0,
    display: activeId === podiumData[0].id ? "flex" : "none",
              }}
              //transition={{ duration: 0.300 }}
              className="relative
              
              cursor-pointer
              p-4
              text-white
              shadow-2xl
              flex
              items-center
              justify-center
              overflow-hidden
              transition-colors
              duration-100"
            >
                <div className="flex flex-row items-center justify-center gap-2">
                    <p className="overflow-hidden text-lg font-medium">
                    {podiumData[0].previousScore} pts</p>
               <div className="flex items-center justify-center gap-2">
                    {podiumData[0].changeInScore > 0 ? (
                    
                    <TrendingUp className="text-green-300" />) : podiumData[0].changeInScore < 0 ? (
                    <TrendingDown className="text-red-300" />) : null}
                <p className="text-lg font-medium">
              
                {podiumData[0].changeInScore > 0 ? `+${podiumData[0].changeInScore}` : podiumData[0].changeInScore}
              </p></div>
              <p className="text-lg font-medium">
                    {podiumData[0].actualScore} pts</p>
      </div>
             {/* <p className="mt-2 text-sm opacity-80">
                Additional information about the player
                can appear here.
              </p>*/}
            </motion.div></div></motion.div>
    
    <div className='flex gap-4'>
<motion.div
            key={podiumData[1].id}
            layout
            onClick={() =>
              setActiveId(activeId === podiumData[1].id ? null : podiumData[1].id)
            }
            animate={{
              width:
                activeId === podiumData[1].id
                  ? 260
                  : activeId === podiumData[2].id
                    ? 65
                    : 175,
              //y: activeId === podiumData[1].id ? -20 : 0,
              //width: activeId === podiumData[1].id ? 400 : 120,
              scale:
                activeId === podiumData[1].id
                  ? 1.05
                  : activeId === podiumData[2].id
                    ? 0.96
                    : 1,
              
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
            }} className={`
              relative
              w-54 rounded-3xl
              cursor-pointer
              p-4
              text-white
              shadow-2xl
              flex
              items-center
              justify-center
              overflow-hidden
              transition-colors
              duration-300
              ${
                activeId === podiumData[1].id
                  ?  podiumData[1].activeColor
                  :  podiumData[1].color
              }
            `}>
              <div className="flex flex-col items-center justify-center gap-2">
              <div className={"flex flex-"+(activeId === podiumData[1].id ? "row" : "col")+" items-center justify-center gap-2"}>
              <div className="text-4xl font-bold">
              #{podiumData[1].id}
            </div>

            <div className="mt-2 text-xl font-semibold">
              {podiumData[1].name}
            </div></div><motion.div 
              initial={false}
              animate={{
                opacity: activeId === podiumData[1].id ? 1 : 0,
    height: activeId === podiumData[1].id ? "auto" : 0,
    marginTop: activeId === podiumData[1].id ? 8 : 0,
    display: activeId === podiumData[1].id ? "flex" : "none",
                
              }}
              transition={{ duration: 0.2 }}
              className="relative
              
              cursor-pointer
              p-4
              text-white
              shadow-2xl
              items-center
              justify-center
              overflow-hidden
              transition-colors"
            >
                <div className="flex flex-row items-center justify-center gap-2">
                    <p className="text-lg font-medium">
                    {podiumData[1].previousScore} pts</p>
               <div className="flex items-center justify-center gap-2">
                    {podiumData[1].changeInScore > 0 ? (
                    
                    <TrendingUp className="text-green-300" />) : podiumData[1].changeInScore < 0 ? (
                    <TrendingDown className="text-red-300" />) : null}
                <p className="text-lg font-medium">
              
                {podiumData[1].changeInScore > 0 ? `+${podiumData[1].changeInScore}` : podiumData[1].changeInScore}
              </p></div>
              <p className="text-lg font-medium">
                    {podiumData[1].actualScore} pts</p>
      </div>
             {/* <p className="mt-2 text-sm opacity-80">
                Additional information about the player
                can appear here.
              </p>*/}
            </motion.div>
            </div></motion.div>

            <motion.div
            key={podiumData[2].id}
            layout
            onClick={() =>
              setActiveId(activeId === podiumData[2].id ? null : podiumData[2].id)
            }
            animate={{
               width:
                activeId === podiumData[2].id
                  ? 260
                  : activeId === podiumData[1].id
                    ? 65
                    : 150,
              //y: activeId === podiumData[1].id ? -20 : 0,
              //width: activeId === podiumData[1].id ? 400 : 120,
              scale:
                activeId === podiumData[2].id
                  ? 1.05
                  : activeId === podiumData[1].id
                    ? 0.96
                    : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
            }} className={`
              
              relative
              w-54 rounded-3xl
              cursor-pointer
              p-4
              text-white
              shadow-2xl
              flex
              items-center
              justify-center
              overflow-hidden
              transition-colors
              duration-300
              ${
                activeId === podiumData[2].id
                  ?  podiumData[2].activeColor
                  :  podiumData[2].color
              }
            `}>
              <div className="flex flex-col items-center justify-center gap-2">
              <div className={"flex flex-"+(activeId === podiumData[2].id ? "row" : "col")+" items-center justify-center gap-2"}>
              <div className="text-4xl font-bold">
              #{podiumData[2].id}
            </div>

            <div className="mt-2 text-xl font-semibold">
              {podiumData[2].name}
            </div>
            </div>
            <motion.div
              initial={false}
              animate={{
                opacity: activeId === podiumData[2].id ? 1 : 0,
    height: activeId === podiumData[2].id ? "auto" : 0,
    marginTop: activeId === podiumData[2].id ? 8 : 0,
    display: activeId === podiumData[2].id ? "flex" : "none",
              }}
              //transition={{ duration: 0.300 }}
              className="relative
              
              cursor-pointer
              p-4
              text-white
              shadow-2xl
              flex
              items-center
              justify-center
              overflow-hidden
              transition-colors
              duration-100"
            >
                <div className="flex flex-row items-center justify-center gap-2">
                    <p className="text-lg font-medium">
                    {podiumData[2].previousScore} pts</p>
               <div className="flex items-center justify-center gap-2">
                    {podiumData[2].changeInScore > 0 ? (
                    
                    <TrendingUp className="text-green-300" />) : podiumData[2].changeInScore < 0 ? (
                    <TrendingDown className="text-red-300" />) : null}
                <p className="text-lg font-medium">
              
                {podiumData[2].changeInScore > 0 ? `+${podiumData[2].changeInScore}` : podiumData[2].changeInScore}
              </p></div>
              <p className="text-lg font-medium">
                    {podiumData[2].actualScore} pts</p>
      </div>
             {/* <p className="mt-2 text-sm opacity-80">
                Additional information about the player
                can appear here.
              </p>*/}
            </motion.div>
            </div>
            </motion.div>
            
            
    </div>
    </div>
  );}
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

    return <div className="p-6">
        <h1 className="font-bold mb-4" style={{ fontFamily: "Arial, sans-serif" }}>Leaderboards</h1>
        <p className="font-semibold mb-4">Best of {monthName} (points won in {monthName})</p>
        <AnimatedPodium podiumData={bestOfMonthSorted.map((value, index) => {
          const [playerId, changeInScore] = value;

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
        })} fix='end'/>
        <p className="font-semibold mb-4">Worst of {monthName} (points lost in {monthName})</p>
        <AnimatedPodium podiumData={worstOfMonthSorted.map((value, index) => {
          const [playerId, changeInScore] = value;

            return {
                id: index+1,
                changeInScore: changeInScore,
                name: mostPlayedPlayers.find(p => p.id === playerId)?.Name,
                color: index === 0 ? "bg-orange-500" : index === 1 ? "bg-gray-400" : "bg-yellow-500",
                activeColor: "bg-red-600" ,
                baseHeight: 260 - index*(index===1?80:60),
                previousScore: pointsPerPlayer[playerId] - changeInScore,
                actualScore: pointsPerPlayer[playerId],
                
            }
        })} fix='start'/>
        
        <p className="font-semibold mb-4">Most Played Players (games played overall, on a total of {games.length} games):</p>
        <ul>
            {mostPlayedPlayers.map((player) => (
                <li key={player.id}>{player.Name}: {playerGameCount[player.id] || 0}</li>
            ))}
        </ul>
        
    </div>
    
}