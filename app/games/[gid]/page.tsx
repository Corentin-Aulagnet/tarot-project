import { Games } from "@/utils/supabase/supabase";
import Posts from "./posts"; // client component
import { createClient } from "@/utils/supabase/client";

export default async function Page({ params }: { params: { gid: string } }) {
  const { gid } = await params

  const supabase = createClient();

  const { data: game }: { data: Games | null } = await supabase
    .from("Games")
    .select("*")
    .eq("id", gid)
    .single();

  if (!game) {
    return <div>Game not found</div>;
  }

  return <Posts initialGame={game} />;
}
          
