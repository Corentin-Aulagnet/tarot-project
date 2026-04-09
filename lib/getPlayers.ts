/**
 * getPlayers() — Server-side function to fetch all players from Supabase.
 * Used by Server Components that need player lists for selection/display.
 * 
 * @returns Promise<Players[]> — Array of all registered players
 * @throws Error if database query fails
 */

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