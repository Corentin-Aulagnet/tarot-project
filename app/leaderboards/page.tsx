//import "@/globals.css";
import { createClient } from "@/utils/supabase/client";

import Post from "./post";

export const dynamic = "force-dynamic";
export default async function Page() {

const supabase = createClient();
  const { data: games }  = await supabase.from("Games").select("*").order("created_at", { ascending: false });
  const { data: players }  = await supabase.from("Players").select("*").order("Name", { ascending: true });
  const monthIndex = new Date().getUTCMonth()
  const monthName = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
}).format(new Date())
//console.log("Games:", games?.length);
  if (!games || !players) {
    return <div>Failed to load data</div>
  }
  return (<main className="p-6">
    <Post games={games} players={players} monthIndex={monthIndex} monthName={monthName} />
  </main>);
}
