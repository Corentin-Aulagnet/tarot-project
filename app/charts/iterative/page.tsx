
import "../../globals.css";
import { aggregateIterativeScores } from "@/lib/scoreUtils";
import { createClient } from "@/utils/supabase/client";
import { cookies } from "next/headers";
import Post from "./post";
import { getLastPlayers } from "@/lib/gameUtils";
export const dynamic = "force-dynamic";
export default async function Page() {

const supabase = createClient();
  const { data: games }  = await supabase.from("Games").select("*").order("created_at", { ascending: false });
  const { data: players }  = await supabase.from("Players").select("*").order("Name", { ascending: true });
  if (!games || !players) {
    return <div>Failed to load data</div>
  }
  const lastPlayers = getLastPlayers(games, players) || players;
  return (<main className="p-6">
    <h1 className="font-bold mb-4"style={{ fontFamily: "Arial, sans-serif" }}>Iterative Total Line Chart</h1>
    <Post data={aggregateIterativeScores(games, players)} players={players} lastPlayers={lastPlayers} />
  </main>);
}