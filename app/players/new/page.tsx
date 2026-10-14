"use client";
import "../../globals.css";
import {supabase} from "@/utils/supabase/client";
import { Players } from "@/utils/supabase/types";
import { useCallback, useEffect, useState } from "react";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Players[]>([]);
  const [name, setName] = useState("");
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const loadPlayers = async () => {
      const { data, error: fetchError } = await supabase
        .from("Players")
        .select("*")
        .order("Name", { ascending: true });

      if (!isCurrent) return;
      if (fetchError) {
        console.error("Error fetching players:", fetchError);
        setError("Could not load players. Please try again.");
        setIsLoading(false);
        return;
      }

      setPlayers(data);
      setIsLoading(false);
    };

    void loadPlayers();
    return () => {
      isCurrent = false;
    };
  }, []);

  const refreshPlayers = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("Players")
      .select("*")
      .order("Name", { ascending: true });

    if (fetchError) {
      console.error("Error fetching players:", fetchError);
      setError("Could not load players. Please try again.");
      return;
    }

    setPlayers(data);
  }, []);

  const handleCreatePlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a player name.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsSaving(true);
    const { error: insertError } = await supabase
      .from("Players")
      .insert({ Name: trimmedName });
    setIsSaving(false);

    if (insertError) {
      console.error("Error creating player:", insertError);
      setError("Could not create player. Please try again.");
      return;
    }

    setName("");
    setMessage("Player added.");
    await refreshPlayers();
  };

  const handleSaveName = async (
    e: React.FormEvent<HTMLFormElement>,
    playerId: string
  ) => {
    e.preventDefault();
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setError("Player name cannot be empty.");
      return;
    }

    setError(null);
    setMessage(null);
    setSavingPlayerId(playerId);
    const { error: updateError } = await supabase
      .from("Players")
      .update({ Name: trimmedName })
      .eq("id", playerId);
    setSavingPlayerId(null);

    if (updateError) {
      console.error("Error updating player name:", updateError);
      setError("Could not update player name. Please try again.");
      return;
    }

    setEditingPlayerId(null);
    setMessage("Player name updated.");
    await refreshPlayers();
  };

  const sortedPlayers = [...players].sort((a, b) => a.Name.localeCompare(b.Name));

  return (
    <main className="p-6">
      <h1 className="mb-4 font-bold" style={{ fontFamily: "Arial, sans-serif" }}>Players</h1>
      <form className="space-y-4" onSubmit={handleCreatePlayer}>
      <div className="flex flex-col">
      <label htmlFor="name" className="mb-1 font-medium">Player Name</label>
      <input
        type="text"
        id="name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded bg-blue-500 px-6 py-3 text-lg text-white transition hover:bg-blue-600 disabled:opacity-50"
      >
        {isSaving ? "Creating..." : "Create Player"}
      </button>
      </form>

      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      {message && <p role="status" className="mt-4 text-green-700">{message}</p>}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">All Players</h2>
        {isLoading ? (
          <p>Loading players...</p>
        ) : sortedPlayers.length === 0 ? (
          <p>No players have been added yet.</p>
        ) : (
          <ul className="space-y-2">
            {sortedPlayers.map((player) => (
              <li key={player.id} className="flex flex-wrap items-center gap-2 rounded border border-gray-300 p-3">
                {editingPlayerId === player.id ? (
                  <form
                    className="flex flex-1 flex-wrap items-center gap-2"
                    onSubmit={(e) => handleSaveName(e, player.id)}
                  >
                    <label className="sr-only" htmlFor={`player-name-${player.id}`}>
                      Edit name for {player.Name}
                    </label>
                    <input
                      id={`player-name-${player.id}`}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      required
                      autoFocus
                      className="min-w-48 flex-1 rounded border border-gray-300 px-3 py-2"
                    />
                    <button
                      type="submit"
                      disabled={savingPlayerId === player.id}
                      className="rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      {savingPlayerId === player.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlayerId(null);
                        setEditingName("");
                        setError(null);
                      }}
                      className="rounded border px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1">{player.Name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlayerId(player.id);
                        setEditingName(player.Name);
                        setError(null);
                        setMessage(null);
                      }}
                      className="rounded border px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Edit name
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}