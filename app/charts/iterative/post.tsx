"use client"
import dynamic from "next/dynamic";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});
import {Players} from "@/utils/supabase/types";
import { useState } from "react";

export default function Post({
  data,
  players,
  recentPlayers,
}: {
  data: Record<string, number | null>[];
  players: Players[];
  recentPlayers: Players[];
}) {
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const displayedPlayers = showAllPlayers ? players : recentPlayers;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAllPlayers(!showAllPlayers)}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {showAllPlayers ? "Show recent players" : "Show all players"}
        </button>
      </div>
      <div className="not-landscape:h-100 landscape:h-70">
        <LineChart
          data={data}
          players={displayedPlayers}
          lastPlayers={displayedPlayers}
          zoomIndex={10}
        />
      </div>
    </div>
  );
}