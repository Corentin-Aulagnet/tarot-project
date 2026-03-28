//"use client";
import Link from "next/link";
//import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"
import {buildGamePlayerTotals} from "@/lib/scoreUtils"
import {GamesTable,GameTableProps} from "@/components/GameTable/GameTable"

import Example from "@/components/NavBar"
import "./globals.css"

export default async function HomePage() {
  const supabase = createClient()

  const { data: games } = await supabase
    .from("Games")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: players } = await supabase
    .from("Players")
    .select("*")

  if (!games || !players) {
    return <div>Failed to load data</div>
  }

  const table = buildGamePlayerTotals(games, players)

  return (<main className="p-6">
    <Example/>
    <h1 className="font-extrabold">All Games</h1>
    <GamesTable games={games} players={players} table={table} />
    <Link  href="/games/new"
  className="bg-blue-500 text-black px-6 py-3 rounded text-lg hover:bg-blue-600 transition"
>
  Start New Game
</Link>
  </main>)
}
/*
export default function HomePage() {
  const [data,setData] = useState<GameTableProps | null>(null)

async function fetchData() {
  const supabase = createClient();
    // 1. Get everything
    const { data: games } = await supabase.from("Games").select("*").order("created_at", { ascending: false })
    const { data: players } = await supabase.from("Players").select("*")
    console.log({ games, players })
    if (!games || !players) {
      console.error("Failed to fetch data", { games, players })
      return
    }
    setData({ games: games, players, table: buildGamePlayerTotals(games, players) })
  }
useEffect(() => {
  fetchData()
},[])
  
  if (!data) return <p className="p-6">Loading...</p>
  // 2. Build totals per game per player
  return (
    <main className="p-6">
   


      <nav className="flex gap-4 p-4">
  <Link href="/">Home</Link>
  <Link href="/games/new">New Game</Link>
</nav>
      <h1 className="text-2xl font-bold mb-4">All Games</h1>
      {data && <GamesTable {...data}/>}
      <Link  href="/games/new"
  className="bg-blue-500 text-black px-6 py-3 rounded text-lg hover:bg-blue-600 transition"
>
  Start New Game
</Link>
    </main>
  )
}*/