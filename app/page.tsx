

import { createClient } from "@/utils/supabase/client"
import "./globals.css"
import Post from "./post";

export const dynamic = "force-dynamic";
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

    
  return (<main className="p-6">
    
    <Post games={games} players={players}/>
  </main>)
}
