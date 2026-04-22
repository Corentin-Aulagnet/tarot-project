"use client"
import dynamic from "next/dynamic";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});
import {Players} from "@/utils/supabase/supabase";
export default function Post({ data, players }: { data: Record<string, number | null>[], players: Players[] }) {
  return (
    <div className="not-landscape:h-100 landscape:h-70">
      <LineChart data={data} players={players} />
    </div>
  );
}