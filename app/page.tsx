//"use client";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"
import {buildGamePlayerTotals,aggregateTotalScores,aggregateIterativeScores} from "@/lib/scoreUtils"
import { Metadata } from 'next';
import {GamesTable,GameTableProps} from "@/components/GameTable/GameTable"
import {IterativeTotalLineChartCanOpen} from "@/components/IterativeTotalLineChart";
import Example from "@/components/NavBar"
import "./globals.css"
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // ensure per-request

export async function generateMetadata(): Promise<Metadata> {

  return {
    title:"Tarot Score Tracker",
    description: "Track your tarot games and scores",
  };
}
export default async function HomePage() {
  const supabase = createClient();
  const { data: games } = await supabase
    .from("Games")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: players } = await supabase
    .from("Players")
    .select("*")
    .order("Name", { ascending: true })

  if (!games || !players) {
    return <div>Failed to load data</div>
  }

  const table = buildGamePlayerTotals(games, players)
  const totals = aggregateTotalScores(games, players)
  const chartData = aggregateIterativeScores(games, players)    
  return (<main className="p-6">
    <Example/>
    
    <IterativeTotalLineChartCanOpen chartData={chartData} players={players}/>
    
    <h1 className="font-extrabold">All Games</h1>
    <GamesTable games={games} players={players} table={table} totals={totals}/>
    {/*<StickyTable/>*/}
     <div className="flex justify-center mt-6">
    <Link  href="/games/new"
   
  className="bg-blue-500 text-white px-6 py-3 rounded text-lg hover:bg-blue-600 transition"
>
  Start New Game
</Link></div>
  </main>)
}
