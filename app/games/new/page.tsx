/**
 * New Game Form Page (app/games/new/page.tsx)
 * Form for creating a new Tarot game record.
 */

"use client";
import "../../globals.css";
import { useRouter } from "next/navigation";
import { Players,Enums} from "@/utils/supabase/types";
import {supabase} from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { PlusCircleIcon,MinusCircleIcon } from '@heroicons/react/24/outline'
import { getLastPlayers } from "@/lib/gameUtils";
import SuitSymbol from "@/components/SuitSymbol";
import { getDefaultPlayerColor } from "@/lib/playerColors";


export default function NewGamePage() {
    const router = useRouter();
    
    const [players, setPlayers] = useState<Players[]>([]);
    const [recentPlayers, setRecentPlayers] = useState<Players[]>([]);
    const [showAllPlayers, setShowAllPlayers] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [players_uid,setSelectedPlayers] = useState<Players[]>([]);
    const [pointsAtt, setPointsAtt] = useState(0);
    const pointsDef = 91 - pointsAtt;
    const [nBouts, setNBouts] = useState(0);
    const [nBoutsHandStart, setNBoutsHandStart] = useState("");
    const isValid = nBouts >= 0 && nBouts <= 3;
    const pointsToMake = nBouts === 0 ? 56 : nBouts === 1 ? 51 : nBouts === 2 ? 41 : 36;
    const isHandStartValid = nBoutsHandStart === ""
        || (Number.isInteger(Number(nBoutsHandStart)) && Number(nBoutsHandStart) >= 0 && Number(nBoutsHandStart) <= 3);

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
        contract: "Petite",
        taker_id: "",
        chelem: null as string | null,
        chelem_player_id: null as string | null,
        petit_au_bout_player_id: null as string | null,
        petit_au_bout: null as string | null,
    });
   
        useEffect(() => {
            const loadPlayers = async () => {
                const [playersResult, gamesResult] = await Promise.all([
                    supabase.from("Players").select("*"),
                    supabase
                        .from("Games")
                        .select("players_uid, created_at")
                        .order("created_at", { ascending: false })
                        .limit(20),
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

                const allPlayers = playersResult.data;
                setPlayers(allPlayers);
                setRecentPlayers(getLastPlayers(gamesResult.data, allPlayers, 20) ?? []);
                const latestGame = gamesResult.data[0];
                if (latestGame) {
                    const latestGamePlayerIds = new Set(latestGame.players_uid);
                    setSelectedPlayers(allPlayers.filter(player => latestGamePlayerIds.has(player.id)));
                }
                setLoaded(true);
            };

            void loadPlayers();
        }, []);
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
            const { value } = e.target;
            const numericValue = parseInt(value, 10);
            setPointsAtt((isNaN(numericValue) ? 0 : numericValue));

        };
        
        const handleChangePointsDef = (e:React.ChangeEvent<HTMLInputElement>) => {
            const {value } = e.target;
            const numericValue = parseInt(value, 10);
            setPointsAtt(91 - (isNaN(numericValue) ? 0 : numericValue)); // Auto set attack points to 91 - defence points
            
        };
        const handleChangeNBouts = (e:React.ChangeEvent<HTMLInputElement>) => {
            const {value } = e.target;
            let numericValue = parseInt(value, 10);
            if (isNaN(numericValue)) return;
            
            numericValue = Math.max(0, Math.min(3, numericValue)); // Ensure value is between 0 and 3
            setNBouts(numericValue);
        }
        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!isHandStartValid) {
                setSubmitError("Number of bouts in hand at start must be between 0 and 3.");
                return;
            }

            setSubmitError(null);
            try {
                const res = await fetch("/api/insert", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        call_id: form.call_id,
                        call_color: call_color,
                        contract: form.contract,
                        taker_id: form.taker_id,
                        chelem: form.chelem,
                        chelem_player_id: form.chelem_player_id,
                        poignee_type_arr: poigneeTypes || null,
                        poignee_player_id_arr: poigneeIds || null,
                        misere_type_arr: misereTypes || null,
                        misere_player_id_arr: misereIds || null,
                        petit_au_bout_player_id: form.petit_au_bout_player_id,
                        petit_au_bout: form.petit_au_bout,
                        points_att: pointsAtt,
                        n_bouts: nBouts,
                        n_bouts_hand_start: nBoutsHandStart === "" ? null : Number(nBoutsHandStart),
                        players_uid: players_uid.map(p => p.id),
                    }),
                });

                if (!res.ok) {
                    const result = await res.json();
                    setSubmitError(result.error ?? "Could not create game.");
                    return;
                }

                alert("Game created");
                router.push("/");
            } catch (error) {
                console.error("Error creating game:", error);
                setSubmitError("Could not create game. Check your connection and try again.");
            }
            
        };
        
        return (<main className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6  rounded shadow w-auto">
            <h1 className="text-xl font-bold">New Game</h1>
            
            <div className = "flex flex-col gap-4 border p-2 rounded border-gray-300 border-width:15px">
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
                <label key={p.id} className="flex items-center gap-1">
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
            
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Taker</h1>
            <select name="taker_id" onChange={handleChange}>
            <option value="">Taker</option>
            {players_uid.toSorted((a, b) => a.Name.localeCompare(b.Name)).map((p) => (
                <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>{p.Name}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Called Color</h1>
            {(["♥", "♦", "♣", "♠"] as const).map(suit => (
              <button
                key={suit}
                type="button"
                aria-label={`Select ${suit} suit`}
                aria-pressed={call_color === suit}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${call_color === suit ? "bg-gray-300" : ""}`}
                onClick={() => handleChangeCallColor(suit)}
              >
                <SuitSymbol suit={suit} />
              </button>
            ))}
            
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Call Player</h1>
            <select name="call_id" onChange={handleChange}>
            <option value="">Select Call Player</option>
            {players_uid.map((p) => (
                <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>{p.Name}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Contract</h1>
            <select name="contract" onChange={handleChange}>
            {Enums.Contract.map((c) => (
                <option key={c}>{c}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-col gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Number of bouts</h1>
            <input name="n_bouts" className={`border p-2 rounded ${
                isValid ? "border-gray-300" : "border-red-500"
                }`} type="number" min={0} max={3} placeholder="Bouts"  onBlur={handleChangeNBouts}  />
            <label htmlFor="n_bouts_hand_start" className="font-medium">
                Number of bouts (at start)
            </label>
            <input
                id="n_bouts_hand_start"
                name="n_bouts_hand_start"
                type="number"
                min={0}
                max={3}
                step={1}
                value={nBoutsHandStart}
                onChange={(e) => setNBoutsHandStart(e.target.value)}
                className={`rounded border p-2 ${isHandStartValid ? "border-gray-300" : "border-red-500"}`}
            />
                </div>
                {submitError && <p role="alert" className="text-red-600">{submitError}</p>}
                
                <div className="flex flex-col gap-4 border p-2 rounded border-gray-300 border-width:15px">  
                <h1 className="font-medium">Enter Points</h1>
                <div className ="flex-row gap-2">
                
                <div className="flex-col gap-1">  
                <h1 className="font-medium">Attack</h1>
                <div className= "flex flex-row flex-wrap gap-3"> 
                <input  className="w-auto" name="points_att" type="int"  value={pointsAtt} placeholder="Points" onChange ={handleChangePointsAtt} onBlur ={handleChangePointsAtt} />
                <h1 style={{color : pointsAtt-pointsToMake >=0 ? "green" : "red"}}>{pointsAtt-pointsToMake >=0 ? "+" : ""}{pointsAtt-pointsToMake}</h1>
                </div>
                </div>
                
                <span className="flex-4 self-center size-max"></span>
                
                <div className="flex-col gap-1">  
                <h1 className="font-medium">Defence</h1>
                <div className= "flex flex-row flex-wrap gap-3"> 
                <input name="points_def" type="int"  value={pointsDef} placeholder="Points" onChange ={handleChangePointsDef} onBlur ={handleChangePointsDef}  />
                <h1 style={{color : pointsDef-(91-pointsToMake) >=0 ? "green" : "red"}}>{pointsDef-(91-pointsToMake) >=0 ? "+" : ""}{pointsDef-(91-pointsToMake)}</h1>
                </div></div>
                </div></div>
                
                <div className="flex flex-row flex-wrap gap-4 border p-2 rounded border-gray-300 border-width:15px">
                <h1 className="font-medium">Select Misere</h1>
{Array.from({ length: numberOfMisere }, (_, i) => (
                    <div key={i} className="flex flex-row gap-2 border p-1 rounded border-gray-300 border-width:15px">
                    <select name="misere_type" onChange={(e) => handleChangeMisereType(i, e.target.value)}>
                    <option defaultValue="">None</option>
                    {Enums.Misere.map((p) => (
                        <option key={p}>{p}</option>
                ))}
                </select>
                <select name="misere_player_id" onChange={(e) => handleChangeMiserePlayerId(i, e.target.value)}>
                <option defaultValue="">Player</option>
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

                
                <div className="flex flex-row flex-wrap gap-4 border p-2 rounded border-gray-300 border-width:15px">
                <h1 className="font-medium">Select Poignee</h1>
{Array.from({ length: numberOfPoignee }, (_, i) => (
                    <div key={i} className="flex flex-row gap-2 border p-1 rounded border-gray-300 border-width:15px">
                    <select name="poignee_type" onChange={(e) => handleChangePoigneeType(i, e.target.value)}>
                    <option defaultValue="">None</option>
                    {Enums.Poignee.map((p) => (
                        <option key={p}>{p}</option>
                ))}
                </select>
                <select name="poignee_player_id" onChange={(e) => handleChangePoigneePlayerId(i, e.target.value)}>
                <option defaultValue="">Player</option>
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

                <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
                <h1 className="font-medium">Petit au bout</h1>
                <select name="petit_au_bout_player_id" onChange={handleChange}>
                <option defaultValue="">Player</option>
                {players_uid.map((p) => (
                    <option key={p.id} value={p.id} style={{ color: getDefaultPlayerColor(p, players) }}>
                    {p.Name}
                    </option>
                ))}
                </select>
                <select name="petit_au_bout" onChange={handleChange}>
                <option defaultValue="">Outcome</option>
                <option value="Lost">Lost</option>
                <option value="Won">Won</option>
                </select>
                </div>
<div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
                <h1 className="font-medium">Select Chelem</h1>
                <select name="chelem" onChange={handleChange}>
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
                <button type="submit" className="bg-gray-800 text-white p-2 font-bold">Create</button>
                </form></main>
            );
        }