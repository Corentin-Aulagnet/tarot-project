import { Games,Players } from "@/utils/supabase/types";
import Posts from "./posts"; // client component
import { createClient } from "@/utils/supabase/client";

export default async function Page({ params }: { params: { pid: string } }) {
  const { pid } = await params

  const supabase = createClient();

  const { data: player }: { data: Players | null } = await supabase
    .from("Players")
    .select("*")
    .eq("id", pid)
    .single();
    
  if (!player) {
    return <div>Player not found</div>;
  }
  const [{ data, error }, playersResult] = await Promise.all([
    supabase.rpc("get_games_by_player", { player_id: pid }),
    supabase.from("Players").select("*"),
  ]);
  if (error) {
    console.error("Error fetching games for player:", error);
    return <div>Could not load player statistics. Please try again later.</div>;
  }
  if (playersResult.error) {
    console.error("Error fetching players for player statistics:", playersResult.error);
    return <div>Could not load player statistics. Please try again later.</div>;
  }
  const games: Games[] = data ?? [];
  return <Posts player={player} games={games} players={playersResult.data} />;
}
          
