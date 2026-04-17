"use client"
import {LineChart} from "@/components/LineChart";
import {Players} from "@/utils/supabase/supabase";
export default function Post({ data, players }: { data: Record<string, number | null>[], players: Players[] }) {
  return (
    <div>
      <h2>Iterative Total Line Chart</h2>
      <LineChart data={data} players={players} />
    </div>
  );
}