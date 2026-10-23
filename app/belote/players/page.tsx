"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { BeloteMatch } from "@/lib/belote";

export default function BelotePlayersPage() {
  const [players, setPlayers] = useState<Players[]>([]);
  const [matches, setMatches] = useState<BeloteMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("Players").select("*").order("Name", { ascending: true }),
      supabase.from("BeloteMatches").select("*"),
    ]).then(([playersResult, matchesResult]) => {
      if (!active) return;
      const failure = playersResult.error ?? matchesResult.error;
      if (failure) {
        console.error("Could not load Belote players:", failure);
        setError("Could not load Belote players.");
      } else {
        setPlayers(playersResult.data ?? []);
        setMatches(matchesResult.data ?? []);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const matchCounts = new Map<string, number>();
  matches.forEach(match => {
    [
      match.team1_player1_id,
      match.team1_player2_id,
      match.team2_player1_id,
      match.team2_player2_id,
    ].forEach(id => matchCounts.set(id, (matchCounts.get(id) ?? 0) + 1));
  });

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Belote Players</h1>
          <p className="text-sm text-gray-400">These are the same player records used by Tarot. Belote profiles and stats are separate.</p>
        </div>
        <Link href="/players/new" className="rounded border border-gray-600 px-3 py-2 text-sm hover:bg-gray-800">Manage players</Link>
      </div>
      {error && <p role="alert" className="text-red-500">{error}</p>}
      {loading ? <p>Loading players…</p> : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-2">
          {players.map(player => (
            <li key={player.id}>
              <Link href={`/belote/players/${player.id}`} className="flex items-center justify-between gap-2 rounded border border-gray-700 bg-gray-900 p-3 hover:border-gray-500">
                <span className="font-semibold" style={{ color: player.preferred_color ?? undefined }}>{player.Name}</span>
                <span className="text-xs text-gray-400">{matchCounts.get(player.id) ?? 0} matches</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
