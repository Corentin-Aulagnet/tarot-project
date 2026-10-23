"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { BeloteHand, BeloteMatch, formatBeloteDate, getMatchScore, scoreBeloteHand } from "@/lib/belote";

const contractTypes = ["♥", "♦", "♣", "♠", "No Trump", "All Trumps"];

export default function BeloteMatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<BeloteMatch | null>(null);
  const [hands, setHands] = useState<BeloteHand[]>([]);
  const [players, setPlayers] = useState<Players[]>([]);
  const [contractTeam, setContractTeam] = useState("1");
  const [contractType, setContractType] = useState("");
  const [team1Points, setTeam1Points] = useState("");
  const [beloteTeam, setBeloteTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadMatch = async () => {
      const [matchResult, handResult, playerResult] = await Promise.all([
        supabase.from("BeloteMatches").select("*").eq("id", matchId).single(),
        supabase.from("BeloteHands").select("*").eq("match_id", matchId).order("created_at", { ascending: true }),
        supabase.from("Players").select("*"),
      ]);
      if (!active) return;
      const failure = matchResult.error ?? handResult.error ?? playerResult.error;
      if (failure) {
        console.error("Could not load Belote match:", failure);
        setError("Could not load this Belote match.");
      } else {
        setMatch(matchResult.data);
        setHands(handResult.data ?? []);
        setPlayers(playerResult.data ?? []);
      }
      setLoading(false);
    };
    void loadMatch();
    return () => { active = false; };
  }, [matchId]);

  const playerNames = useMemo(() => new Map(players.map(player => [player.id, player.Name])), [players]);
  const score = getMatchScore(hands);
  const finished = match !== null && (score.team1 >= match.target_score || score.team2 >= match.target_score);
  const contractPreview = contractType && team1Points !== ""
    ? scoreBeloteHand({
        contract_team: Number(contractTeam),
        team1_points: Number(team1Points),
        belote_team: beloteTeam === "" ? null : Number(beloteTeam),
      })
    : null;

  const teamName = (team: 1 | 2) => {
    if (!match) return "";
    const player1 = team === 1 ? match.team1_player1_id : match.team2_player1_id;
    const player2 = team === 1 ? match.team1_player2_id : match.team2_player2_id;
    return `${playerNames.get(player1) ?? "Player"} & ${playerNames.get(player2) ?? "Player"}`;
  };

  const addHand = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!match || !contractType || team1Points === "") {
      setError("Enter the contract and Team 1’s card points.");
      return;
    }
    const points = Number(team1Points);
    if (!Number.isInteger(points) || points < 0 || points > 162) {
      setError("Card points must be a whole number from 0 to 162.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data: insertedHand, error: insertError } = await supabase.from("BeloteHands").insert({
      match_id: match.id,
      contract_team: Number(contractTeam),
      contract_type: contractType,
      team1_points: points,
      belote_team: beloteTeam === "" ? null : Number(beloteTeam),
    }).select("*").single();
    setSaving(false);
    if (insertError || !insertedHand) {
      if (insertError) console.error("Could not save Belote hand:", insertError);
      setError("Could not save this hand. Please try again.");
      return;
    }
    setHands(previous => [...previous, insertedHand]);
    setContractType("");
    setTeam1Points("");
    setBeloteTeam("");
  };

  if (loading) return <main className="p-6">Loading match…</main>;
  if (!match) return <main className="p-6"><p role="alert">{error ?? "Match not found."}</p></main>;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/belote" className="text-sm text-gray-400 hover:text-white">← Belote matches</Link>
          <h1 className="mt-1 text-xl font-bold">Match · {formatBeloteDate(match.created_at)}</h1>
        </div>
        {finished && <span className="rounded-full bg-green-900 px-3 py-1 text-sm text-green-200">Match complete</span>}
      </div>

      <section className="grid grid-cols-2 gap-3">
        {([1, 2] as const).map(team => (
          <div key={team} className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-center">
            <p className="truncate text-sm text-gray-300">{teamName(team)}</p>
            <p className="text-4xl font-bold">{team === 1 ? score.team1 : score.team2}</p>
            <p className="text-xs text-gray-500">Target {match.target_score}</p>
          </div>
        ))}
      </section>

      {error && <p role="alert" className="text-red-500">{error}</p>}
      {!finished && (
        <form onSubmit={addHand} className="space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Record a hand</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Contract team
              <select value={contractTeam} onChange={event => setContractTeam(event.target.value)} className="rounded border border-gray-600 bg-gray-950 px-3 py-2">
                <option value="1">Team 1 · {teamName(1)}</option>
                <option value="2">Team 2 · {teamName(2)}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Contract / trump
              <select value={contractType} onChange={event => setContractType(event.target.value)} required className="rounded border border-gray-600 bg-gray-950 px-3 py-2">
                <option value="">Select contract</option>
                {contractTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Team 1 card points
              <input type="number" min={0} max={162} step={1} required value={team1Points}
                onChange={event => setTeam1Points(event.target.value)}
                className="rounded border border-gray-600 bg-gray-950 px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Belote / Rebelote
              <select value={beloteTeam} onChange={event => setBeloteTeam(event.target.value)} className="rounded border border-gray-600 bg-gray-950 px-3 py-2">
                <option value="">No bonus</option>
                <option value="1">Team 1 (+20)</option>
                <option value="2">Team 2 (+20)</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-gray-400">
            Team 2 receives {team1Points !== "" && Number.isInteger(Number(team1Points)) && Number(team1Points) >= 0 && Number(team1Points) <= 162 ? 162 - Number(team1Points) : "—"} card points. The contract needs 82 points; a failed contract awards 162 to the defenders.
          </p>
          {contractPreview && (
            <p className="text-sm font-medium text-gray-200">
              Preview: {contractPreview.contractMade ? "Contract made" : "Contract failed"} · hand score {contractPreview.team1}–{contractPreview.team2}
              {contractPreview.capotTeam ? " · capot (+90)" : ""}
            </p>
          )}
          <button type="submit" disabled={saving} className="rounded bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600 disabled:opacity-50">
            {saving ? "Saving…" : "Save hand"}
          </button>
        </form>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Hands</h2>
        {hands.length === 0 ? <p className="text-sm text-gray-400">No hands recorded in this match yet.</p> : (
          <ol className="space-y-2">
            {hands.map((hand, index) => {
              const handScore = scoreBeloteHand(hand);
              return (
                <li key={hand.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded border border-gray-700 bg-gray-900 p-3">
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                  <div className="min-w-0">
                    <p className="font-medium">
                      Team {hand.contract_team} · {hand.contract_type} · {handScore.contractMade ? "made" : "failed"}
                      {hand.belote_team ? ` · Team ${hand.belote_team} Belote/Rebelote` : ""}
                    </p>
                    <p className="text-xs text-gray-400">
                      Cards {hand.team1_points}–{162 - hand.team1_points} · {formatBeloteDate(hand.created_at)}
                    </p>
                  </div>
                  <p className="text-right font-bold">{handScore.team1}–{handScore.team2}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
