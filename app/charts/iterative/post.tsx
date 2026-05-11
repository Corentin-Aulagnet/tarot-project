"use client"
import dynamic from "next/dynamic";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});
import {Players} from "@/utils/supabase/types";
export default function Post({ data, players, lastPlayers }: { data: Record<string, number | null>[], players: Players[], lastPlayers: Players[] }) {
  return (
    <div className="not-landscape:h-100 landscape:h-70">
      <LineChart data={data} players={players} lastPlayers={lastPlayers} zoomIndex={10} />
    </div>
  );
}