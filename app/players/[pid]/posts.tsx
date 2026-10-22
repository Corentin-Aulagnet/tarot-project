"use client"
import { Games,Players } from "@/utils/supabase/types";
import { aggregateIterativeScores,buildGamePlayerTotals } from "@/lib/scoreUtils";
import { getPlayerStatistics } from "@/lib/playerStats";
import { getAvailablePlayerColors } from "@/lib/playerColors";
import PlayerColorPicker from "@/components/PlayerColorPicker";
import PlayerStatsBadges from "@/components/PlayerStatsBadges";
import { supabase } from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import { useState } from "react";
const LineChart = dynamic(() => import("@/components/LineChart"), {
  ssr: false, // Disable server-side rendering
});


export default function Posts({ player,games,players }:{ player: Players,games:Games[]|null,players:Players[]}) {
    const [currentPlayer, setCurrentPlayer] = useState(player);
    const [currentPlayers, setCurrentPlayers] = useState(players);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState(player.Name);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingColor, setIsSavingColor] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const allGames = games ?? [];
    const pointsPerGame = buildGamePlayerTotals(allGames);
    const stats = getPlayerStatistics(currentPlayer, allGames, currentPlayers, pointsPerGame);
    const availableColors = getAvailablePlayerColors(currentPlayers, currentPlayer.id);
    const handleSaveName = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedName = editingName.trim();
        if (!trimmedName) {
            setError("Player name cannot be empty.");
            return;
        }

        setError(null);
        setIsSavingName(true);
        const { error: updateError } = await supabase
            .from("Players")
            .update({ Name: trimmedName })
            .eq("id", currentPlayer.id);
        setIsSavingName(false);

        if (updateError) {
            console.error("Error updating player name:", updateError);
            setError("Could not update player name. Please try again.");
            return;
        }

        setCurrentPlayer({ ...currentPlayer, Name: trimmedName });
        setIsEditingName(false);
    };

    const handleColorChange = async (color: string) => {
        if (!color || (
            color === currentPlayer.preferred_color
            && currentPlayer.preferred_color_selected
        )) return;
        setError(null);
        setIsSavingColor(true);
        const { error: updateError } = await supabase.rpc("set_player_preferred_color", {
            p_player_id: currentPlayer.id,
            p_color: color,
        });

        if (updateError) {
            setIsSavingColor(false);
            console.error("Error updating preferred player color:", updateError);
            setError(updateError.code === "23505"
                ? "That color has already been selected by another player. Please choose another."
                : "Could not update player color. Please try again.");
            return;
        }

        const { data: refreshedPlayers, error: refreshError } = await supabase
            .from("Players")
            .select("*");
        setIsSavingColor(false);
        if (refreshError) {
            console.error("Error refreshing player colors:", refreshError);
            setCurrentPlayer({
                ...currentPlayer,
                preferred_color: color,
                preferred_color_selected: true,
            });
            setError("Color updated, but player colors could not be refreshed. Reload the page to update the chart.");
            return;
        }

        setCurrentPlayers(refreshedPlayers);
        const refreshedPlayer = refreshedPlayers.find(candidate => candidate.id === currentPlayer.id);
        if (refreshedPlayer) setCurrentPlayer(refreshedPlayer);
    };

    return (<div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
            {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor="player-name">Player name</label>
                    <input
                        id="player-name"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        required
                        autoFocus
                        className="rounded border border-gray-300 px-3 py-2"
                    />
                    <button
                        type="submit"
                        disabled={isSavingName}
                        className="rounded bg-blue-500 px-3 py-2 text-white disabled:opacity-50"
                    >
                        {isSavingName ? "Saving..." : "Save"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingName(currentPlayer.Name);
                            setIsEditingName(false);
                            setError(null);
                        }}
                        className="rounded border px-3 py-2"
                    >
                        Cancel
                    </button>
                </form>
            ) : (
                <>
                    <h1 className="text-xl font-bold">{currentPlayer.Name}</h1>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingName(currentPlayer.Name);
                            setIsEditingName(true);
                        }}
                        className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        Edit name
                    </button>
                </>
            )}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                    Preferred color
                </span>
                <PlayerColorPicker
                    color={currentPlayer.preferred_color ?? "#6b7280"}
                    availableColors={availableColors}
                    onSelect={color => void handleColorChange(color)}
                    disabled={isSavingColor}
                />
            </div>
        </div>
        {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
        <section className="mb-6 space-y-2">
            <h2 className="font-semibold">Player statistics</h2>
            <PlayerStatsBadges stats={stats} />
        </section>
        <h2>Games</h2>
        <div className= "not-landscape:h-100 landscape:h-70">
            <LineChart  data={aggregateIterativeScores(allGames, [currentPlayer])} players={[currentPlayer]} lastPlayers={[currentPlayer]} zoomIndex={null}/>
            </div>
    </div>
    )
}