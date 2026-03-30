
import "../../globals.css";
import { IterativeTotalLineChart } from "@/components/IterativeTotalLineChart"
import Example from "@/components/NavBar";
import { aggregateIterativeScores } from "@/lib/scoreUtils";
import { supabase } from "@/utils/supabase/server";

export default async function Page({ searchParams }) {
 const { data: games }  = await supabase.from("Games").select("*").order("created_at", { ascending: false });
  const { data: players }  = await supabase.from("Players").select("*");
  if (!games || !players) {
    return <div>Failed to load data</div>
  }
  return (<main className="p-6">
    <Example/>
    <h1 className="font-bold mb-4"style={{ fontFamily: "Arial, sans-serif" }}>Iterative Total Line Chart</h1>
    <IterativeTotalLineChart chartData={aggregateIterativeScores(games, players)} players={players} />
  </main>);
}