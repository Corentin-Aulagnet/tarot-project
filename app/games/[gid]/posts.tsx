"use client";

import { useState } from "react";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from "next/navigation";
import { Enums,Players,Games } from "@/utils/supabase/types";
import { supabase } from "@/utils/supabase/client";
import { useEffect } from "react";
import { PlusCircleIcon,MinusCircleIcon } from '@heroicons/react/24/outline'

export default function Posts({ initialGame }:{ initialGame: Games }) {
  const [game, setGame] = useState(initialGame);
      const router = useRouter();
      const [players, setPlayers] = useState<Players[]>([]);
      const [loaded, setLoaded] = useState(false);
      const [selectedPlayers,setSelectedPlayers] = useState<Players[]>([]);
      const [pointsAtt, setPointsAtt] = useState(initialGame.points_att || 0);
      const pointsDef = 91 - pointsAtt;
      const [nBouts, setNBouts] = useState(initialGame.n_bouts || 0);
      const isValid = nBouts >= 0 && nBouts <= 3;
      const pointsToMake = nBouts === 0 ? 56 : nBouts === 1 ? 51 : nBouts === 2 ? 41 : 36;

      const [numberOfPoignee, setNumberOfPoignee] = useState(initialGame.poignee_player_id_arr ? initialGame.poignee_player_id_arr.length : 0);
      const [poigneeIds,setPoigneeIds] = useState<string[]>(initialGame.poignee_player_id_arr  || []);
      const [poigneeTypes,setPoigneeTypes] = useState<string[]>(initialGame.poignee_type_arr  || []);

        const [numberOfMisere, setNumberOfMisere] = useState(initialGame.misere_player_id_arr ? initialGame.misere_player_id_arr.length : 0);
      const [misereIds,setMisereIds] = useState<string[]>(initialGame.misere_player_id_arr  || []);
      const [misereTypes,setMisereTypes] = useState<string[]>(initialGame.misere_type_arr  || []);
const [call_color, setCallColor] = useState<string>(initialGame.call_color || "");
      const [form, setForm] = useState({
          call_id: initialGame.call_id || "",
          contract: initialGame.contract || "Petite",
          taker_id: initialGame.taker_id || "",
          chelem: initialGame.chelem || null,
          chelem_player_id: initialGame.chelem_player_id || null,
          petit_au_bout_player_id: initialGame.petit_au_bout_player_id || null,
          petit_au_bout: initialGame.petit_au_bout || null,
      });
     
          useEffect( ()=>{
              supabase.from("Players").select("*").then(({ data, error }) => {
              if (error) {
                  console.error("Error fetching players:", error);
                  return;
              }
              if (data) {
                setPlayers(data as Players[]);
                 setLoaded(true);
                 const playerList = data as Players[];
                 if (initialGame.players_uid) {
                    const selected = playerList.filter(p => initialGame.players_uid?.includes(p.id));
                    setSelectedPlayers(selected);
                 }
              }

          })},[]);

  /*useEffect(() => {
  if (loaded && initialGame.players_uid) {
    const selected = players.filter(p => initialGame.players_uid.includes(p.id));
    setSelectedPlayers(selected);
  }
}, [loaded, players]);*/
  const handleChangeCallColor = (value: string) => {
    setCallColor(value);
    //setForm((prev) => ({ ...prev, called_color: value }));
    console.log("Selected Call Color:", value);
}
            const handleChangePoigneeType = (index: number, value: string) => {
                const newPoigneeTypes = [...(poigneeTypes || [])];
                newPoigneeTypes[index] = value;
                setPoigneeTypes(newPoigneeTypes);
            }
            const handleChangePoigneePlayerId = (index: number, value: string) => {
                const newPoigneeIds = [...(poigneeIds || [])];
                newPoigneeIds[index] = value;
                setPoigneeIds(newPoigneeIds);
            }
            const handleChangeMisereType = (index: number, value: string) => {
                const newMisereTypes = [...(misereTypes || [])];
                newMisereTypes[index] = value;
                setMisereTypes(newMisereTypes);
            }
            const handleChangeMiserePlayerId = (index: number, value: string) => {
                const newMisereIds = [...(misereIds || [])];
                newMisereIds[index] = value;
                setMisereIds(newMisereIds);
            }
          const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const { name, value } = e.target;
              setForm((prev) => ({ ...prev, [name]: value }));
          };
          const handlePlayersListChange = (e:React.ChangeEvent<HTMLInputElement>) => {
              //Track list of selected players
              if(e.target.checked){
                  const player = players.find((p) => p.id === e.target.value);
                  if(player)setSelectedPlayers([...selectedPlayers, player]);
              } else if(!e.target.checked){
                const selected = selectedPlayers.filter((player) => player.id !== e.target.value);
                  setSelectedPlayers(selected);
              }

          };
          
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
          const handleReset = async () => {
              console.log("delete game");
              const res = await fetch("/api/delete", {
                  method: "POST",
                  body: JSON.stringify({ id: initialGame.id })
              });
              if (res.ok) {
                  alert("Game deleted");
                  router.push("/");
              }
          };

          const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const res = await fetch("/api/update", {
                  method: "POST",
                  body: JSON.stringify({call_id: form.call_id,
                    call_color: call_color,
                    id: initialGame.id,
                    created_at: initialGame.created_at,
                       contract: form.contract,
                        taker_id: form.taker_id,
                         chelem: form.chelem || null,
                          chelem_player_id: form.chelem_player_id || null,
                           poignee_type_arr: poigneeTypes || null,
                            poignee_player_id_arr: poigneeIds || null,
                            misere_type_arr: misereTypes  || null,
                            misere_player_id_arr: misereIds  || null,
                            petit_au_bout_player_id: form.petit_au_bout_player_id  || null,
                            petit_au_bout:form.petit_au_bout || null,
                             points_att: pointsAtt,
                              n_bouts: nBouts,
                               players_uid: selectedPlayers.map(p => p.id)}),
              });
              
              if (res.ok)
                  {
                  alert("Game updated");
                  router.push("/");
              }
              
          };
  return (

<main className="p-6">
            <form onSubmit={handleSubmit} onReset={handleReset} className="flex flex-col gap-4 p-6 rounded shadow w-auto">
            <h1 className="text-xl font-bold">Update Game from {new Date(game.created_at).toLocaleString('en-GB',{year:'numeric',month:'long',day:'numeric',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,hour:'2-digit',minute:'2-digit'})}</h1>
            
            <div className = "flex flex-col gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Players</h1>
            <div className="flex flex-wrap gap-2">
            {players.map((p) => (
                <label key={p.id} className="flex items-center gap-1">
                <input type="checkbox" value={p.id} checked={selectedPlayers.includes(p)} onChange={handlePlayersListChange} />
                {p.Name}
                </label>
            ))}
            </div>
            </div>
            
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Taker</h1>
            <select name="taker_id" value={form.taker_id}onChange={handleChange}>
            <option value="">Taker</option>
            {selectedPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.Name}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Called Color</h1>
            <button type="button" className={`w-10 h-10
    flex items-center justify-center
    rounded-full text-red-500 ${call_color === "♥" ? "bg-gray-300" : ""}`} onClick={() => handleChangeCallColor('♥')}>♥</button>
            <button type="button" className={`w-10 h-10
    flex items-center justify-center
    rounded-full text-red-500 ${call_color === "♦" ? "bg-gray-300" : ""}`} onClick={() => handleChangeCallColor('♦')}>♦</button>
            <button type="button" className={`w-10 h-10
    flex items-center justify-center
    rounded-full text-black ${call_color === "♣" ? "bg-gray-300" : ""}`} onClick={() => handleChangeCallColor('♣')}>♣</button>
            <button type="button" className={`w-10 h-10
    flex items-center justify-center
    rounded-full text-black ${call_color === "♠" ? "bg-gray-300" : ""}`} onClick={() => handleChangeCallColor('♠')}>♠</button>
            
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Call Player</h1>
            <select name="call_id" value={form.call_id} onChange={handleChange}>
            <option value="">Select Call Player</option>
            {selectedPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.Name}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Contract</h1>
            <select name="contract" value={form.contract} onChange={handleChange}>
            {Enums.Contract.map((c) => (
                <option key={c}>{c}</option>
            ))}
            </select>
            </div>
            <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
            <h1 className="font-medium">Select Number of Bouts</h1>
            <input name="n_bouts" value={nBouts} className={`border p-2 rounded ${
                isValid ? "border-gray-300" : "border-red-500"
                }`} type="number" min={0} max={3} placeholder="Bouts"  onBlur={handleChangeNBouts} onChange={handleChangeNBouts}  />
                </div>
                
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
                    <select name="misere_type" value={misereTypes?.[i] || ""} onChange={(e) => handleChangeMisereType(i, e.target.value)}>
                    <option defaultValue="">None</option>
                    {Enums.Misere.map((p) => (
                        <option key={p}>{p}</option>
                ))}
                </select>
                <select name="misere_player_id" value={misereIds?.[i] || ""} onChange={(e) => handleChangeMiserePlayerId(i, e.target.value)}>
                <option defaultValue="">Player</option>
                {selectedPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
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
                    <select name="poignee_type" value={poigneeTypes?.[i] || ""} onChange={(e) => handleChangePoigneeType(i, e.target.value)}>
                    <option defaultValue="">None</option>
                    {Enums.Poignee.map((p) => (
                        <option key={p}>{p}</option>
                ))}
                </select>
                <select name="poignee_player_id" value={poigneeIds?.[i] || ""} onChange={(e) => handleChangePoigneePlayerId(i, e.target.value)}>
                <option defaultValue="">Player</option>
                {selectedPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
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
                <select name="petit_au_bout_player_id" value={form.petit_au_bout_player_id || ""} onChange={handleChange}>
                <option defaultValue="" value =''>Player</option>
                {selectedPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                    {p.Name}
                    </option>
                ))}
                </select>
                <select name="petit_au_bout"  value={String(form.petit_au_bout) ?? ""} onChange={handleChange}>
                <option defaultValue="" value ="">Outcome</option>
                <option value="Lost">Lost</option>
                <option value="Won">Won</option>
                </select>
                </div>
                <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
                <h1 className="font-medium">Select Chelem</h1>
                <select name="chelem" value={form.chelem || ""} onChange={handleChange}>
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
                <div className="flex flex-row gap-4 border p-2 rounded border-gray-300 border-width:15px">
                <button type="submit" className="bg-gray-300 text-blue-500 font-bold p-2 border rounded border-gray-300 border-width:15px" ><PencilIcon color='blue'></PencilIcon>Update</button> 
                <button type="reset" className=" text-red-500 font-bold p-2 border rounded border-gray-300 border-width:15px "><TrashIcon color='red'></TrashIcon>Delete</button></div>
                </form></main>





    
    
  );
}