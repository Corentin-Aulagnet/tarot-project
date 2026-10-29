/**
 * New Game Form Page (app/games/new/page.tsx)
 * Form for creating a new Tarot game record.
 */

"use client";
import "../../globals.css";
import { useRouter } from "next/navigation";
import { Games, Players,Enums} from "@/utils/supabase/types";
import {supabase} from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { PlusCircleIcon,MinusCircleIcon } from '@heroicons/react/24/outline'
import { getLastPlayers } from "@/lib/gameUtils";
import { getDefaultPlayerColor } from "@/lib/playerColors";


export default function NewGamePage({ gameId }: { gameId?: string }) {
    const router = useRouter();
    
    const [players, setPlayers] = useState<Players[]>([]);
    const [recentPlayers, setRecentPlayers] = useState<Players[]>([]);
    const [showAllPlayers, setShowAllPlayers] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [editingGame, setEditingGame] = useState<Games | null>(null);
    const [players_uid,setSelectedPlayers] = useState<Players[]>([]);
    const [pointsAtt, setPointsAtt] = useState("");
    const pointsDef = pointsAtt === "" ? "" : String(91 - Number(pointsAtt));
    const [nBouts, setNBouts] = useState("");
    const [nBoutsHandStart, setNBoutsHandStart] = useState("");
    const [nBoutsDog, setNBoutsDog] = useState("0");
    const [nBoutsCalled, setNBoutsCalled] = useState("0");
    const isValidBout = (value: string) => value === ""
        || (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 3);
    const isWonBoutsValid = nBouts !== "" && isValidBout(nBouts);
    const isHandStartValid = isValidBout(nBoutsHandStart);
    const isDogBoutsValid = isValidBout(nBoutsDog);
    const isCalledBoutsValid = isValidBout(nBoutsCalled);
    const isPointsValid = pointsAtt !== ""
        && Number.isInteger(Number(pointsAtt))
        && Number(pointsAtt) >= 0
        && Number(pointsAtt) <= 91;
    const pointsToMake = nBouts === "0" ? 56 : nBouts === "1" ? 51 : nBouts === "2" ? 41 : 36;

    const [numberOfPoignee, setNumberOfPoignee] = useState(0);
    const [poigneeIds,setPoigneeIds] = useState<string[]>([]);
    const [poigneeTypes,setPoigneeTypes] = useState<string[]>([]);

    const [numberOfMisere, setNumberOfMisere] = useState(0);
    const [misereIds,setMisereIds] = useState<string[]>([]);
    const [misereTypes,setMisereTypes] = useState<string[]>([]);
    const [call_color, setCallColor] = useState<string>("");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [form, setForm] = useState({
        call_id: "",
        contract: "",
        taker_id: "",
        chelem: null as string | null,
        chelem_player_id: null as string | null,
        petit_au_bout_player_id: null as string | null,
        petit_au_bout: null as string | null,
    });
   
        useEffect(() => {
            const loadFormData = async () => {
                const [playersResult, gamesResult, gameResult] = await Promise.all([
                    supabase.from("Players").select("*"),
                    supabase
                        .from("Games")
                        .select("players_uid, created_at")
                        .order("created_at", { ascending: false })
                        .limit(20),
                    gameId
                        ? supabase.from("Games").select("*").eq("id", gameId).single()
                        : Promise.resolve({ data: null, error: null }),
                ]);

                if (playersResult.error) {
                    console.error("Error fetching players:", playersResult.error);
                    setLoadError("Could not load players.");
                    return;
                }
                if (gamesResult.error) {
                    console.error("Error fetching recent games:", gamesResult.error);
                    setLoadError("Could not load recent game history.");
                    return;
                }
                if (gameResult.error) {
                    console.error("Error fetching game for editing:", gameResult.error);
                    setLoadError("Could not load the selected game.");
                    return;
                }

                const allPlayers = playersResult.data;
                setPlayers(allPlayers);
                setRecentPlayers(getLastPlayers(gamesResult.data, allPlayers, 20) ?? []);
                const selectedGame = gameResult.data;
                if (selectedGame) {
                    setEditingGame(selectedGame);
                    const selectedGamePlayerIds = new Set(selectedGame.players_uid);
                    setSelectedPlayers(allPlayers.filter(player => selectedGamePlayerIds.has(player.id)));
                    setCallColor(selectedGame.call_color ?? "");
                    setPointsAtt(String(selectedGame.points_att));
                    setNBouts(String(selectedGame.n_bouts));
                    setNBoutsHandStart(selectedGame.n_bouts_hand_start == null ? "" : String(selectedGame.n_bouts_hand_start));
                    setNBoutsDog(selectedGame.n_bouts_dog == null ? "" : String(selectedGame.n_bouts_dog));
                    setNBoutsCalled(selectedGame.n_bouts_called == null ? "" : String(selectedGame.n_bouts_called));
                    const misereTypes = selectedGame.misere_type_arr ?? (selectedGame.misere_type ? [selectedGame.misere_type] : []);
                    const misereIds = selectedGame.misere_player_id_arr ?? (selectedGame.misere_player_id ? [selectedGame.misere_player_id] : []);
                    const poigneeTypes = selectedGame.poignee_type_arr ?? (selectedGame.poignee_type ? [selectedGame.poignee_type] : []);
                    const poigneeIds = selectedGame.poignee_player_id_arr ?? (selectedGame.poignee_player_id ? [selectedGame.poignee_player_id] : []);
                    setMisereTypes(misereTypes);
                    setMisereIds(misereIds);
                    setNumberOfMisere(Math.max(misereTypes.length, misereIds.length));
                    setPoigneeTypes(poigneeTypes);
                    setPoigneeIds(poigneeIds);
                    setNumberOfPoignee(Math.max(poigneeTypes.length, poigneeIds.length));
                    setForm({
                        call_id: selectedGame.call_id,
                        contract: selectedGame.contract,
                        taker_id: selectedGame.taker_id,
                        chelem: selectedGame.chelem,
                        chelem_player_id: selectedGame.chelem_player_id,
                        petit_au_bout_player_id: selectedGame.petit_au_bout_player_id,
                        petit_au_bout: selectedGame.petit_au_bout,
                    });
                } else if (gamesResult.data[0]) {
                    const latestGame = gamesResult.data[0];
                    const latestGamePlayerIds = new Set(latestGame.players_uid);
                    setSelectedPlayers(allPlayers.filter(player => latestGamePlayerIds.has(player.id)));
                }
                setLoaded(true);
            };

            void loadFormData();
        }, [gameId]);
const handleChangeCallColor = (value: string) => {
    setCallColor(value);
    //setForm((prev) => ({ ...prev, called_color: value }));
    console.log("Selected Call Color:", value);
}
const handleChangePoigneeType = (index: number, value: string) => {
                const newPoigneeTypes = [...(poigneeTypes || [])];
                newPoigneeTypes[index] = value;
                setPoigneeTypes(newPoigneeTypes);
                console.log(newPoigneeTypes);
            }
            const handleChangePoigneePlayerId = (index: number, value: string) => {
                const newPoigneeIds = [...(poigneeIds || [])];
                newPoigneeIds[index] = value;
                setPoigneeIds(newPoigneeIds);
                console.log(newPoigneeIds);
            }
            const handleChangeMisereType = (index: number, value: string) => {
                const newMisereTypes = [...(misereTypes || [])];
                newMisereTypes[index] = value;
                setMisereTypes(newMisereTypes);
                console.log(newMisereTypes);
            }
            const handleChangeMiserePlayerId = (index: number, value: string) => {
                const newMisereIds = [...(misereIds || [])];
                newMisereIds[index] = value;
                setMisereIds(newMisereIds);
                console.log(newMisereIds);
            }
        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const { name, value } = e.target;
            setForm((prev) => ({ ...prev, [name]: value }));
        };
        const handlePlayersListChange = (e:React.ChangeEvent<HTMLInputElement>) => {
            //Track list of selected players
            
            if(e.target.checked){
                const player = players.find((p) => p.id === e.target.value);
                if(player)setSelectedPlayers([...players_uid, player]);
            } else if(!e.target.checked){
                setSelectedPlayers(players_uid.filter((player) => player.id !== e.target.value));
            }
        };
        const recentPlayerIds = new Set(recentPlayers.map((player) => player.id));
        const selectedInactivePlayers = players.filter(
            (player) => players_uid.some((selected) => selected.id === player.id)
                && !recentPlayerIds.has(player.id)
        );
        const selectablePlayers = showAllPlayers
            ? players
            : [...recentPlayers, ...selectedInactivePlayers];
        
        const handleChangePointsAtt = (e:React.ChangeEvent<HTMLInputElement>) => {
            setPointsAtt(e.target.value);
        };
        
        const handleChangePointsDef = (e:React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setPointsAtt(value === "" ? "" : String(91 - Number(value)));
        };
        const handleChangeNBouts = (e:React.ChangeEvent<HTMLSelectElement>) => {
            setNBouts(e.target.value);
        }
        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!isWonBoutsValid || !isHandStartValid || !isDogBoutsValid || !isCalledBoutsValid) {
                setSubmitError("Won Bouts is required. Each bout field must be a whole number from 0 to 3.");
                return;
            }
            if (!isPointsValid) {
                setSubmitError("Points Won must be a whole number from 0 to 91.");
                return;
            }

            if (!form.taker_id || !form.call_id || !form.contract) {
                setSubmitError("Select a taker, called player, and contract.");
                return;
            }

            setSubmitError(null);
            try {
                const payload = {
                    ...(editingGame ? { id: editingGame.id } : {}),
                    call_id: form.call_id,
                    call_color: call_color || null,
                    contract: form.contract,
                    taker_id: form.taker_id,
                    chelem: form.chelem,
                    chelem_player_id: form.chelem_player_id,
                    poignee_type: poigneeTypes[0] || null,
                    poignee_player_id: poigneeIds[0] || null,
                    poignee_type_arr: poigneeTypes.length ? poigneeTypes : null,
                    poignee_player_id_arr: poigneeIds.length ? poigneeIds : null,
                    misere_type: misereTypes[0] || null,
                    misere_player_id: misereIds[0] || null,
                    misere_type_arr: misereTypes.length ? misereTypes : null,
                    misere_player_id_arr: misereIds.length ? misereIds : null,
                    petit_au_bout_player_id: form.petit_au_bout_player_id,
                    petit_au_bout: form.petit_au_bout,
                    points_att: Number(pointsAtt),
                    n_bouts: Number(nBouts),
                    n_bouts_hand_start: nBoutsHandStart === "" ? null : Number(nBoutsHandStart),
                    n_bouts_dog: nBoutsDog === "" ? null : Number(nBoutsDog),
                    n_bouts_called: nBoutsCalled === "" ? null : Number(nBoutsCalled),
                    players_uid: players_uid.map(p => p.id),
                };
                const res = await fetch(editingGame ? "/api/update" : "/api/insert", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const result = await res.json();
                    setSubmitError(result.error ?? (editingGame ? "Could not save game changes." : "Could not create game."));
                    return;
                }

                alert(editingGame ? "Game changes saved" : "Game created");
                router.push("/");
            } catch (error) {
                console.error(editingGame ? "Error updating game:" : "Error creating game:", error);
                setSubmitError(editingGame
                    ? "Could not save game changes. Check your connection and try again."
                    : "Could not create game. Check your connection and try again.");
            }
            
        };

        if (gameId && !editingGame) {
            return (
                <main className="p-3">
                    {loadError
                        ? <p role="alert" className="text-red-600">{loadError}</p>
                        : <p>Loading game...</p>}
                </main>
            );
        }

        const saveDateLabel = editingGame
            ? new Date(editingGame.created_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
            })
            : "";
        
        return (<main className="p-3">
            <form onSubmit={handleSubmit} className="new-game-form flex flex-col gap-3 rounded p-3 shadow w-auto">
            <h1 className="text-lg font-bold">{editingGame ? "Edit Game" : "New Game"}</h1>
            
            <div className = "flex flex-col gap-2 border p-2 rounded border-gray-300 border-width:15px">
            <div className="flex items-center justify-between gap-2">
                <h1 className="font-medium">Select Players</h1>
                <button
                    type="button"
                    onClick={() => setShowAllPlayers(!showAllPlayers)}
                    className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    {showAllPlayers ? "Show recent players" : "Show all players"}
                </button>
            </div>
            {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
            {!loaded && !loadError && <p>Loading players...</p>}
            {loaded && recentPlayers.length === 0 && !showAllPlayers && (
                <p>No players appeared in the last 20 games. Show all players to select from the full list.</p>
            )}
            <div className="flex flex-wrap gap-2">
            {selectablePlayers.toSorted((a, b) => a.Name.localeCompare(b.Name)).map((p) => (
                <label key={p.id} className="flex items-center gap-1 text-sm">
                <input
                    type="checkbox"
                    value={p.id}
                    checked={players_uid.some((selected) => selected.id === p.id)}
                    onChange={handlePlayersListChange}
                />
                <span style={{ color: getDefaultPlayerColor(p, players) }}>{p.Name}</span>
                </label>
            ))}
            </div>
            </div>
            
            <section className="flex flex-col gap-3 rounded border border-gray-300 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select
                  aria-label="Taker"
                  name="taker_id"
                  value={form.taker_id}
                  onChange={handleChange}
                  className="w-full rounded border px-2 py-1.5"
                >
                  <option value="">Taker</option>
                  {players_uid.toSorted((a, b) => a.Name.localeCompare(b.Name)).map((p) => (
                    <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>{p.Name}</option>
                  ))}
                </select>
                <select
                  aria-label="Called Player"
                  name="call_id"
                  value={form.call_id}
                  onChange={handleChange}
                  className="w-full rounded border px-2 py-1.5"
                >
                  <option value="">Called Player</option>
                  {players_uid.map((p) => (
                    <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>{p.Name}</option>
                  ))}
                </select>
                <select
                  aria-label="Called Suit"
                  value={call_color}
                  onChange={(e) => handleChangeCallColor(e.target.value)}
                  className="w-full rounded border px-2 py-1.5"
                  style={{
                    color: call_color === ""
                      ? "#9ca3af"
                      : call_color === "♥" || call_color === "♦"
                        ? "#ef4444"
                        : undefined,
                  }}
                >
                  <option value="" className="text-gray-400">Called Suit</option>
                  {(["♥", "♦", "♣", "♠"] as const).map((suit) => (
                    <option
                      key={suit}
                      value={suit}
                      style={{ color: suit === "♥" || suit === "♦" ? "#ef4444" : "#f9fafb" }}
                    >
                      {suit}
                    </option>
                  ))}
                </select>
                <select id="contract" aria-label="Contract" name="contract" value={form.contract} onChange={handleChange} required className="w-full rounded border px-2 py-1.5">
                  <option value="">Select contract</option>
                  {Enums.Contract.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="min-w-0">
                    <select
                      aria-label="Starting Bouts"
                      name="n_bouts_hand_start"
                      value={nBoutsHandStart}
                      onChange={(e) => setNBoutsHandStart(e.target.value)}
                      className={`w-full rounded border px-2 py-1.5 ${isHandStartValid ? "border-gray-300" : "border-red-500"}`}
                      style={{ color: nBoutsHandStart === "" ? "#9ca3af" : undefined }}
                    >
                      <option value="" className="text-gray-400">Starting Bouts</option>
                      {[0, 1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <select
                      aria-label="Dog Bouts"
                      name="n_bouts_dog"
                      value={nBoutsDog}
                      onChange={(e) => setNBoutsDog(e.target.value)}
                      className={`w-full rounded border px-2 py-1.5 ${isDogBoutsValid ? "border-gray-300" : "border-red-500"}`}
                      style={{ color: nBoutsDog === "" ? "#9ca3af" : undefined }}
                    >
                      <option value="" className="text-gray-400">Dog Bouts</option>
                      {[0, 1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <select
                      aria-label="Called Bouts"
                      name="n_bouts_called"
                      value={nBoutsCalled}
                      onChange={(e) => setNBoutsCalled(e.target.value)}
                      className={`w-full rounded border px-2 py-1.5 ${isCalledBoutsValid ? "border-gray-300" : "border-red-500"}`}
                      style={{ color: nBoutsCalled === "" ? "#9ca3af" : undefined }}
                    >
                      <option value="" className="text-gray-400">Called Bouts</option>
                      {[0, 1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <select
                      aria-label="Won Bouts"
                      name="n_bouts"
                      required
                      value={nBouts}
                      onChange={handleChangeNBouts}
                      className={`w-full rounded border px-2 py-1.5 ${isWonBoutsValid ? "border-gray-300" : "border-red-500"}`}
                    >
                      <option value="" className="text-gray-400">Won Bouts</option>
                      {[0, 1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap justify-center gap-4">
                  <label className="flex flex-col gap-1 font-medium">
                    <span className="flex items-baseline gap-3">
                      Attack
                      {isPointsValid && isWonBoutsValid && (
                        <span className={`font-semibold ${Number(pointsAtt) - pointsToMake >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {Number(pointsAtt) - pointsToMake >= 0 ? "+" : ""}{Number(pointsAtt) - pointsToMake}
                        </span>
                      )}
                    </span>
                    <input
                      className="w-[5.5rem] rounded border px-2 py-1.5 text-base"
                      name="points_att"
                      type="number"
                      min={0}
                      max={91}
                      step={1}
                      required
                      value={pointsAtt}
                      placeholder="Points"
                      onChange={handleChangePointsAtt}
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-medium">
                    <span className="flex items-baseline gap-3">
                      Defense
                      {isPointsValid && isWonBoutsValid && (
                        <span className={`font-semibold ${Number(pointsAtt) - pointsToMake <= 0 ? "text-green-500" : "text-red-500"}`}>
                          {pointsToMake - Number(pointsAtt) >= 0 ? "+" : ""}{pointsToMake - Number(pointsAtt)}
                        </span>
                      )}
                    </span>
                    <input
                      className="w-[5.5rem] rounded border px-2 py-1.5 text-base"
                      name="points_def"
                      type="number"
                      min={0}
                      max={91}
                      step={1}
                      value={pointsDef}
                      placeholder="Points"
                      onChange={handleChangePointsDef}
                    />
                  </label>
                </div>
              </div>
            </section>
            {submitError && <p role="alert" className="text-red-600">{submitError}</p>}
                
            <section className="flex flex-col gap-3 rounded border border-gray-300 p-3">
                <div className="flex flex-row flex-wrap gap-3">
                <h2 className="font-medium">Misere</h2>
{Array.from({ length: numberOfMisere }, (_, i) => (
                    <div key={i} className="flex flex-row gap-2">
                    <select name="misere_type" value={misereTypes[i] ?? ""} onChange={(e) => handleChangeMisereType(i, e.target.value)}>
                    <option value="">None</option>
                    {Enums.Misere.map((p) => (
                        <option key={p}>{p}</option>
                ))}
                </select>
                <select name="misere_player_id" value={misereIds[i] ?? ""} onChange={(e) => handleChangeMiserePlayerId(i, e.target.value)}>
                <option value="">Player</option>
                {players_uid.map((p) => (
                    <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>
                    {p.Name}
                    </option>
                ))}
                </select>
                </div>
))}
<PlusCircleIcon className="blue size-6" onClick={() => {setMisereIds([...misereIds, ""]);setMisereTypes([...misereTypes, ""]); setNumberOfMisere(numberOfMisere + 1);}} />
                {numberOfMisere > 0 && (
                    <MinusCircleIcon className="size-6" onClick={() => {setMisereIds(misereIds.slice(0, -1));setMisereTypes(misereTypes.slice(0, -1));setNumberOfMisere(numberOfMisere - 1)}} />
                )}
                </div>

                
                <div className="flex flex-row flex-wrap gap-3">
                <h2 className="font-medium">Poignee</h2>
{Array.from({ length: numberOfPoignee }, (_, i) => (
                    <div key={i} className="flex flex-row gap-2">
                    <select name="poignee_type" value={poigneeTypes[i] ?? ""} onChange={(e) => handleChangePoigneeType(i, e.target.value)}>
                    <option value="">None</option>
                    {Enums.Poignee.map((p) => (
                        <option key={p}>{p}</option>
                ))}
                </select>
                <select name="poignee_player_id" value={poigneeIds[i] ?? ""} onChange={(e) => handleChangePoigneePlayerId(i, e.target.value)}>
                <option value="">Player</option>
                {players_uid.map((p) => (
                    <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>
                    {p.Name}
                    </option>
                ))}
                </select>
                </div>
))}
<PlusCircleIcon className="blue size-6" onClick={() => {setPoigneeIds([...poigneeIds, ""]);setPoigneeTypes([...poigneeTypes, ""]); setNumberOfPoignee(numberOfPoignee + 1);}} />
                {numberOfPoignee > 0 && (
                    <MinusCircleIcon className="size-6" onClick={() => {setPoigneeIds(poigneeIds.slice(0, -1));setPoigneeTypes(poigneeTypes.slice(0, -1));setNumberOfPoignee(numberOfPoignee - 1)}} />
                )}
                </div>

                <div className="flex flex-row flex-wrap gap-3">
                <h1 className="font-medium">Petit au bout</h1>
                <select name="petit_au_bout_player_id" value={form.petit_au_bout_player_id ?? ""} onChange={handleChange}>
                <option value="">Player</option>
                {players_uid.map((p) => (
                    <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>
                    {p.Name}
                    </option>
                ))}
                </select>
                <select name="petit_au_bout" value={form.petit_au_bout ?? ""} onChange={handleChange}>
                <option value="">Outcome</option>
                <option value="Lost">Lost</option>
                <option value="Won">Won</option>
                </select>
                </div>
<div className="flex flex-row flex-wrap gap-3">
                <h2 className="font-medium">Chelem</h2>
                <select name="chelem" value={form.chelem ?? ""} onChange={handleChange}>
                <option value="">Chelem</option>
                {Enums.Chelem.map((c) => {let s=""
                    switch(c){
                        case "AnnoucedFailed":
                        s = "Announced - Failed";
                        break;
                        case "AnnoucedSucceeded":
                        s = "Announced - Succeeded";
                        break;
                        case "UnannoucedSucceeded":
                        s = "Unannounced - Succeeded";
                        break;
                    }
                    return (<option key={c} value={c}>{s}</option>)
                })}
                </select>
                </div>
                </section>
                <button type="submit" className="bg-gray-800 px-3 py-1.5 text-sm font-bold text-white">
                  {editingGame ? `Save Changes to ${saveDateLabel}` : "Create"}
                </button>
                </form></main>
            );
        }