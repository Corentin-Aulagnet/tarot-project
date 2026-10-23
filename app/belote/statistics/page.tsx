"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { BeloteHand, BeloteMatch, getMatchScore } from "@/lib/belote";

export default function BeloteStatisticsPage() {
  const [players, setPlayers] = useState<Players[]>([]);
  const [matches, setMatches] = useState<BeloteMatch[]>([]);
  const [hands, setHands] = useState<BeloteHand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("Players").select("*").order("Name", { ascending: true }),
      supabase.from("BeloteMatches").select("*"),
      supabase.from("BeloteHands").select("*"),
    ]).then(([playersResult, matchesResult, handsResult]) => {
      if (!active) return;
      const failure = playersResult.error ?? matchesResult.error ?? handsResult.error;
      if (failure) {
        console.error("Could not load Belote statistics:", failure);
        setError("Could not load Belote statistics.");
      } else {
        setPlayers(playersResult.data ?? []);
        setMatches(matchesResult.data ?? []);
        setHands(handsResult.data ?? []);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const rankings = useMemo(() => {
    const stats = new Map(players.map(player => [player.id, { matches: 0, wins: 0, points: 0 }]));
    matches.forEach(match => {
      const score = getMatchScore(hands.filter(hand => hand.match_id === match.id));
      const completed = score.team1 >= match.target_score || score.team2 >= match.target_score;
      const winner = !completed || score.team1 === score.team2
        ? null
        : score.team1 > score.team2 ? 1 : 2;
      const team1 = [match.team1_player1_id, match.team1_player2_id];
      const team2 = [match.team2_player1_id, match.team2_player2_id];
      team1.forEach(id => {
        const player = stats.get(id);
        if (player) {
          player.matches += 1;
          player.points += score.team1;
          if (winner === 1) player.wins += 1;
        }
      });
      team2.forEach(id => {
        const player = stats.get(id);
        if (player) {
          player.matches += 1;
          player.points += score.team2;
          if (winner === 2) player.wins += 1;
        }
      });
    });
    return players
      .map(player => ({ player, stats: stats.get(player.id)! }))
      .filter(item => item.stats.matches > 0)
      .sort((a, b) => b.stats.wins - a.stats.wins || b.stats.points - a.stats.points || a.player.Name.localeCompare(b.player.Name));
  }, [hands, matches, players]);

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold">Belote Statistics</h1>
        <p className="text-sm text-gray-400">Ranked by match wins, then points scored.</p>
      </div>
      {error && <p role="alert" className="text-red-500">{error}</p>}
      {loading ? <p>Loading statistics…</p> : matches.length === 0 ? (
        <p className="text-sm text-gray-400">Statistics will appear once a match has been played.</p>
      ) : (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Player standings</h2>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-2">
            {rankings.map(({ player, stats }, index) => (
              <li key={player.id} className={`rounded-md border p-3 ${
                index === 0 ? "border-orange-300 bg-orange-200 text-gray-900"
                  : index === 1 ? "border-slate-300 bg-slate-200 text-gray-900"
                    : index === 2 ? "border-stone-400 bg-stone-300 text-gray-900"
                      : "border-[#9fbe98] bg-[#c6dec1] text-gray-900"
              }`}>
                <Link href={`/belote/players/${player.id}`} className="font-semibold hover:underline" style={{ color: player.preferred_color ?? undefined }}>
                  {index + 1}. {player.Name}
                </Link>
                <p className="text-sm">{stats.wins} wins · {stats.matches} matches · {stats.points} points</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
