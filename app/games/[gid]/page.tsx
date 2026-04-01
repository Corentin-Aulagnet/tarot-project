import Posts from "./posts"; // client component
import { createClient } from "@/utils/supabase/client";

export default async function Page({ params }: { params: { gid: string } }) {
  const { gid } = await params

  const supabase = createClient();

  const { data: game } = await supabase
    .from("Games")
    .select("*")
    .eq("id", gid)
    .single();

  return <Posts initialGame={game} />;
}
          
