//import "@/globals.css";
import { aggregateIterativeScores } from "@/lib/scoreUtils";
import { createClient } from "@/utils/supabase/client";
import { cookies } from "next/headers";
//import Post from "./post";
import { getLastPlayers } from "@/lib/gameUtils";
//export const dynamic = "force-dynamic";
export default async function Page() {
    return <div className="p-6">
        <h1 className="font-bold mb-4" style={{ fontFamily: "Arial, sans-serif" }}>Leaderboards</h1>
        <p>Coming soon...</p>
    </div>
}