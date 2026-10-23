"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";

const playerFields = [
  ["team1_player1_id", "Team 1 · Player 1"],
  ["team1_player2_id", "Team 1 · Player 2"],
  ["team2_player1_id", "Team 2 · Player 1"],
  ["team2_player2_id", "Team 2 · Player 2"],
] as const;

type PlayerField = typeof playerFields[number][0];

export default function NewBeloteMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Players[]>([]);
  const [teams, setTeams] = useState<Record<PlayerField, string>>({
    team1_player1_id: "",
    team1_player2_id: "",
    team2_player1_id: "",
    team2_player2_id: "",
  });
  const [targetScore, setTargetScore] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.from("Players").select("*").order("Name", { ascending: true }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) {
        console.error("Could not load linked players for Belote:", queryError);
        setError("Could not load Tarot players.");
      } else {
        setPlayers(data);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const selectedPlayerIds = Object.values(teams);
  const validTeams = selectedPlayerIds.every(Boolean)
    && new Set(selectedPlayerIds).size === 4;
  const handlePlayerChange = (field: PlayerField, playerId: string) => {
    setTeams(previous => ({ ...previous, [field]: playerId }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericTarget = Number(targetScore);
    if (!validTeams) {
      setError("Choose four different players for the two teams.");
      return;
    }
    if (!Number.isInteger(numericTarget) || numericTarget < 100) {
      setError("The match target must be a whole number of at least 100.");
      return;
    }

    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("BeloteMatches")
      .insert({ ...teams, target_score: numericTarget })
      .select("id")
      .single();
    setSaving(false);
    if (insertError) {
      console.error("Could not create Belote match:", insertError);
      setError("Could not create the match. Please try again.");
      return;
    }
    router.push(`/belote/${data.id}`);
  };

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold">New Belote Match</h1>
        <p className="mt-1 text-sm text-gray-400">Select four Tarot players and assign fixed partners for this match.</p>
      </div>
      {error && <p role="alert" className="text-red-500">{error}</p>}
      {loading ? <p>Loading players…</p> : players.length < 4 ? (
        <p>Add at least four players on the Tarot Players page before starting a Belote match.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-700 bg-gray-900 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {playerFields.map(([field, label]) => (
              <label key={field} className="flex flex-col gap-1 text-sm font-medium">
                {label}
                <select
                  value={teams[field]}
                  onChange={event => handlePlayerChange(field, event.target.value)}
                  className="rounded border border-gray-600 bg-gray-950 px-3 py-2 text-white"
                  required
                >
                  <option value="">Select player</option>
                  {players.map(player => (
                    <option
                      key={player.id}
                      value={player.id}
                      disabled={selectedPlayerIds.includes(player.id) && teams[field] !== player.id}
                      style={{ color: player.preferred_color ?? undefined }}
                    >
                      {player.Name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="flex max-w-xs flex-col gap-1 text-sm font-medium">
            Match target
            <input
              type="number"
              min={100}
              step={10}
              value={targetScore}
              onChange={event => setTargetScore(event.target.value)}
              className="rounded border border-gray-600 bg-gray-950 px-3 py-2 text-white"
              required
            />
          </label>
          <div className="rounded border border-gray-700 p-3 text-sm text-gray-300">
            Classic scoring: hands are played to 162 card points, contracts need at least 82 points, Belote/Rebelote adds 20, and a capot adds 90.
          </div>
          <button
            type="submit"
            disabled={saving || !validTeams}
            className="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Match"}
          </button>
        </form>
      )}
    </main>
  );
}
