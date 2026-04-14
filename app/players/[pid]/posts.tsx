"use client";

import { useState } from "react";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from "next/navigation";
import { Constants,Games,Players } from "@/utils/supabase/supabase";
import { supabase } from "@/utils/supabase/client";
import { useEffect } from "react";
import Link from "next/link";
import { IterativeTotalLineChart } from "@/components/IterativeTotalLineChart";
import { aggregateIterativeScores } from "@/lib/scoreUtils";
export default function Posts({ player,games }:{ player: Players,games:Games[]|null }) {
    return (<div>
        <h1>{player.Name}</h1>
        <h2>Games</h2>
        <IterativeTotalLineChart chartData={aggregateIterativeScores(games || [], [player])} players={[player]} />
        <ul>
            {games?.map(game => (
                <li key={game.id}>
                    <Link href={`/games/${game.id}`}>
                        {`${new Date(game.created_at).toLocaleDateString()} ${new Date(game.created_at).toLocaleTimeString()}`}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
    )
}