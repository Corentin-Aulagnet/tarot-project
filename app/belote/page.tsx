"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { BeloteHand, BeloteMatch, formatBeloteDate, getMatchScore } from "@/lib/belote";

export default function BeloteHomePage() {
  const [matches, setMatches] = useState<BeloteMatch[]>([]);
  const [hands, setHands] = useState<BeloteHand[]>([]);
  const [players, setPlayers] = useState<Players[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [matchResult, handResult, playerResult] = await Promise.all([
        supabase.from("BeloteMatches").select("*").order("created_at", { ascending: false }),
        supabase.from("BeloteHands").select("*").order("created_at", { ascending: true }),
        supabase.from("Players").select("*").order("Name", { ascending: true }),
      ]);
      if (!active) return;
      const failure = matchResult.error ?? handResult.error ?? playerResult.error;
      if (failure) {
        console.error("Could not load Belote home:", failure);
        setError("Could not load Belote matches. Please try again.");
      } else {
        setMatches(matchResult.data ?? []);
        setHands(handResult.data ?? []);
        setPlayers(playerResult.data ?? []);
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const playerNames = new Map(players.map(player => [player.id, player.Name]));

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Belote</h1>
          <p className="text-sm text-gray-400">Four players · two fixed teams · classic scoring</p>
        </div>
        <Link href="/belote/new" className="rounded bg-gray-800 px-4 py-2 font-semibold text-white hover:bg-gray-700">
          Start a match
        </Link>
      </div>

      <p className="rounded-md border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-200">
        App under development
      </p>

      {error && <p role="alert" className="text-red-500">{error}</p>}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Matches</h2>
        {loading ? <p>Loading matches…</p> : matches.length === 0 ? (
          <p className="text-sm text-gray-400">No Belote matches recorded yet. Start a match to get going.</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
            {matches.map(match => {
              const matchHands = hands.filter(hand => hand.match_id === match.id);
              const score = getMatchScore(matchHands);
              const completed = score.team1 >= match.target_score || score.team2 >= match.target_score;
              return (
                <li key={match.id}>
                  <Link href={`/belote/${match.id}`} className="block rounded-lg border border-gray-700 bg-gray-900 p-4 shadow hover:border-gray-500">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <time className="text-sm text-gray-400">{formatBeloteDate(match.created_at)}</time>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${completed ? "bg-gray-700 text-gray-300" : "bg-green-900 text-green-200"}`}>
                        {completed ? "Finished" : "In progress"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{playerNames.get(match.team1_player1_id) ?? "Player"} &amp; {playerNames.get(match.team1_player2_id) ?? "Player"}</p>
                        <p className="text-2xl font-bold">{score.team1}</p>
                      </div>
                      <span className="text-xs text-gray-500">vs</span>
                      <div className="min-w-0 text-right">
                        <p className="truncate font-semibold">{playerNames.get(match.team2_player1_id) ?? "Player"} &amp; {playerNames.get(match.team2_player2_id) ?? "Player"}</p>
                        <p className="text-2xl font-bold">{score.team2}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{matchHands.length} {matchHands.length === 1 ? "hand" : "hands"} · target {match.target_score}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
