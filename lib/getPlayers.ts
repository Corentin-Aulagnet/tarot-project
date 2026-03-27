import { createClient } from "../utils/supabase/server";
import { cookies } from "next/headers";
export async function getPlayers() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("Players")
    .select("*");

  if (error) throw error;
  return data;
}