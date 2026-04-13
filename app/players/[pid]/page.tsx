import { Games,Players } from "@/utils/supabase/supabase";
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
const { data, error } = await supabase.rpc('get_games_by_player', {player_id: pid });
if (error)console.error(error);
const games: Games[] = data || [];
return <Posts player={player} games={games} />;
}
          
