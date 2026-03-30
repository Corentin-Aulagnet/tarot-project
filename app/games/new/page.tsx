"use client";
import "../../globals.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Players,Constants} from "@/utils/supabase/supabase";
import {supabase} from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import Example from "@/components/NavBar";
import { Metadata } from "next";

const CONTRACTS = ["Petite", "Garde", "Garde-Sans", "Garde-Contre"];

export default function NewGamePage() {
    const router = useRouter();
    const [players, setPlayers] = useState<Players[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [players_uid,setSelectedPlayers] = useState<Players[]>([]);
    const [pointsAtt, setPointsAtt] = useState(0);
    const pointsDef = 91 - pointsAtt;
    const [nBouts, setNBouts] = useState(0);
    const isValid = nBouts >= 0 && nBouts <= 3;
    const pointsToMake = nBouts === 0 ? 56 : nBouts === 1 ? 51 : nBouts === 2 ? 41 : 36;
    const [form, setForm] = useState({
        call_id: "",
        contract: "Petite",
        taker_id: "",
        chelem: null as string | null,
        chelem_player_id: null as string | null,
        poignee_type: null as string | null,
        poignee_player_id: null as string | null,
        petit_au_bout_player_id: null as string | null,
        petit_au_bout_lost: null as boolean | null,
    });
   
        useEffect( ()=>{
            supabase.from("Players").select("*").then(({ data, error }) => {
            if (error) {
                console.error("Error fetching players:", error);
                return;
            }
            if (data) {setPlayers(data as Players[]); setLoaded(true);}
        })},[]);


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
        
        const handleChangePointsAtt = (e:React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            const numericValue = parseInt(value, 10);
            if (isNaN(numericValue)) return; // Ignore non-numeric input
            setPointsAtt(numericValue);
            //setPointsDef(91 - numericValue) // Auto set defence points to 91 - attack points
        };
        
        const handleChangePointsDef = (e:React.ChangeEvent<HTMLInputElement>) => {
            const {value } = e.target;
            const numericValue = parseInt(value, 10);
            if (isNaN(numericValue)) return; // Ignore non-numeric input
            setPointsAtt(91 - numericValue) // Auto set attack points to 91 - defence points
            
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
            const res = await fetch("/api/submit", {
                method: "POST",
                body: JSON.stringify({call_id: form.call_id, contract: form.contract, taker_id: form.taker_id, chelem: form.chelem, chelem_player_id: form.chelem_player_id, poignee_type: form.poignee_type, poignee_player_id: form.poignee_player_id, points_att: pointsAtt, n_bouts: nBouts, players_uid: players_uid.map(p => p.id)}),
            });
            
            if (res.ok)
                {
                alert("Game created");
                router.push("/");
            }
            
        };
        
        return (<main className="p-6">
            <Example />
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 bg-white rounded shadow w-auto">
            <h1 className="text-xl font-bold">New Game</h1>
            
            <div className = "flex flex-col gap-4">
            <h1 className="font-medium">Select Players</h1>
            <div className="flex flex-wrap gap-2">
            {players.map((p) => (
                <label key={p.id} className="flex items-center gap-1">
                <input type="checkbox" value={p.id} onChange={handlePlayersListChange} />
                {p.Name}
                </label>
            ))}
            </div>
            </div>
            
            <div className="flex flex-row gap-4">
            <h1 className="font-medium">Select Taker</h1>
            <select name="taker_id" onChange={handleChange}>
            <option value="">Taker</option>
            {players_uid.map((p) => (
                <option key={p.id} value={p.id}>{p.Name}</option>
            ))}
            </select>
            </div>
            
            <div className="flex flex-row gap-4">
            <h1 className="font-medium">Call Player</h1>
            <select name="call_id" onChange={handleChange}>
            <option value="">Select Call Player</option>
            {players_uid.map((p) => (
                <option key={p.id} value={p.id}>{p.Name}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Contract</h1>
            <select name="contract" onChange={handleChange}>
            {CONTRACTS.map((c) => (
                <option key={c}>{c}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Number of Bouts</h1>
            <input name="n_bouts" className={`border p-2 rounded ${
                isValid ? "border-gray-300" : "border-red-500"
                }`} type="number" min={0} max={3} placeholder="Bouts" value={nBouts} onBlur={handleChangeNBouts} onChange={handleChangeNBouts} />
                </div>
                
                <div className="flex flex-col gap-4 border p-2 rounded border-gray-300 border-width:15px">  
                <h1 className="font-medium">Enter Points</h1>
                <div className ="flex-row gap-2">
                
                <div className="flex-col gap-1">  
                <h1 className="font-medium">Attack</h1>
                <div className= "flex flex-row gap-3"> 
                <input  className="w-auto" name="points_att" type="int" value={pointsAtt} placeholder="Points" onBlur ={handleChangePointsAtt}onChange={handleChangePointsAtt} />
                <h1 style={{color : pointsAtt-pointsToMake >=0 ? "green" : "red"}}>{pointsAtt-pointsToMake >=0 ? "+" : ""}{pointsAtt-pointsToMake}</h1>
                </div>
                </div>
                
                <span className="flex-4 self-center size-max"></span>
                
                <div className="flex-col gap-1">  
                <h1 className="font-medium">Defence</h1>
                <div className= "flex flex-row gap-3"> 
                <input name="points_def" type="int" value={pointsDef} placeholder="Points" onBlur ={handleChangePointsDef} onChange={handleChangePointsDef} />
                <h1 style={{color : pointsDef-(91-pointsToMake) >=0 ? "green" : "red"}}>{pointsDef-(91-pointsToMake) >=0 ? "+" : ""}{pointsDef-(91-pointsToMake)}</h1>
                </div></div>
                </div></div>
                
                <div className="flex flex-row gap-4">
                <h1 className="font-medium">Select Poignee</h1>
                <select name="poignee_type" onChange={handleChange}>
                <option defaultValue="">Poignee</option>
                {Constants.public.Enums.Poignee.map((p) => (
                    <option key={p}>{p}</option>
                ))}
                </select>
                <select name="poignee_player_id" onChange={handleChange}>
                <option defaultValue="">Player</option>
                {players_uid.map((p) => (
                    <option key={p.id} value={p.id}>
                    {p.Name}
                    </option>
                ))}
                </select>
                </div>
                
                <div className="flex flex-row gap-4">
                <h1 className="font-medium">Petit au bout</h1>
                <select name="petit_au_bout_player_id" onChange={handleChange}>
                <option defaultValue="">Player</option>
                {players_uid.map((p) => (
                    <option key={p.id} value={p.id}>
                    {p.Name}
                    </option>
                ))}
                </select>
                <select name="petit_au_bout_lost" onChange={handleChange}>
                <option defaultValue="">Outcome</option>
                <option value="true">Lost</option>
                <option value="false">Won</option>
                </select>
                </div>
                <select name="chelem" onChange={handleChange}>
                <option value="">Chelem</option>
                {Constants.public.Enums.Chelem.map((c) => {let s=""
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
                <button className="bg-black text-white p-2">Create</button>
                </form></main>
            );
        }