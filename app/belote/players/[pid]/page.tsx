"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { BeloteHand, BeloteMatch, formatBeloteDate, scoreBeloteHand } from "@/lib/belote";

export default function BelotePlayerPage() {
  const { pid } = useParams<{ pid: string }>();
  const [player, setPlayer] = useState<Players | null>(null);
  const [matches, setMatches] = useState<BeloteMatch[]>([]);
  const [hands, setHands] = useState<BeloteHand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [playerResult, matchResult, handResult] = await Promise.all([
        supabase.from("Players").select("*").eq("id", pid).single(),
        supabase.from("BeloteMatches").select("*").order("created_at", { ascending: false }),
        supabase.from("BeloteHands").select("*").order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      const failure = playerResult.error ?? matchResult.error ?? handResult.error;
      if (failure) {
        console.error("Could not load Belote player profile:", failure);
        setError("Could not load this Belote player profile.");
      } else {
        setPlayer(playerResult.data);
        const playerMatches = (matchResult.data ?? []).filter(match => [
          match.team1_player1_id,
          match.team1_player2_id,
          match.team2_player1_id,
          match.team2_player2_id,
        ].includes(pid));
        const matchIds = new Set(playerMatches.map(match => match.id));
        setMatches(playerMatches);
        setHands((handResult.data ?? []).filter(hand => matchIds.has(hand.match_id)));
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [pid]);

  const stats = useMemo(() => {
    let wins = 0;
    let totalScore = 0;
    let handsPlayed = 0;
    for (const match of matches) {
      const playerTeam: 1 | 2 = match.team1_player1_id === pid || match.team1_player2_id === pid ? 1 : 2;
      const matchHands = hands.filter(hand => hand.match_id === match.id);
      let teamScore = 0;
      let opposingScore = 0;
      matchHands.forEach(hand => {
        const score = scoreBeloteHand(hand);
        teamScore += playerTeam === 1 ? score.team1 : score.team2;
        opposingScore += playerTeam === 1 ? score.team2 : score.team1;
        handsPlayed += 1;
      });
      totalScore += teamScore;
      if ((teamScore >= match.target_score || opposingScore >= match.target_score) && teamScore > opposingScore) wins += 1;
    }
    return { wins, totalScore, handsPlayed };
  }, [hands, matches, pid]);

  if (loading) return <main className="p-6">Loading player…</main>;
  if (error || !player) return <main className="p-6"><p role="alert">{error ?? "Player not found."}</p></main>;
  const playerMatches = new Set(matches.map(match => match.id));

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <div>
        <Link href="/belote/players" className="text-sm text-gray-400 hover:text-white">← Belote players</Link>
        <h1 className="mt-1 text-xl font-bold" style={{ color: player.preferred_color ?? undefined }}>{player.Name}</h1>
        <p className="text-sm text-gray-400">Belote profile · Tarot profile remains separate</p>
      </div>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          ["Matches", matches.length],
          ["Match wins", stats.wins],
          ["Hands played", stats.handsPlayed],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-gray-700 bg-gray-900 p-3">
            <p className="text-xs text-gray-400">{label}</p><p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold">Recent matches</h2>
        {matches.length === 0 ? <p className="text-sm text-gray-400">This player has not played Belote yet.</p> : (
          <ul className="space-y-2">
            {matches.map(match => {
              const matchHands = hands.filter(hand => hand.match_id === match.id);
              const team = match.team1_player1_id === pid || match.team1_player2_id === pid ? 1 : 2;
              const teamScore = matchHands.reduce((total, hand) => {
                const handScore = scoreBeloteHand(hand);
                return total + (team === 1 ? handScore.team1 : handScore.team2);
              }, 0);
              return (
                <li key={match.id}>
                  <Link href={`/belote/${match.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-700 bg-gray-900 p-3 hover:border-gray-500">
                    <span>{formatBeloteDate(match.created_at)} · Team {team} · {playerMatches.has(match.id) ? `${matchHands.length} hands` : ""}</span>
                    <span className="font-bold">{teamScore} points</span>
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
