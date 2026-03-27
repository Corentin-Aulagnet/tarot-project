"use client";
import "../../globals.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Players,Constants} from "@/utils/supabase/supabase";
import {supabase} from "@/utils/supabase/client";
import { NavBar } from "@/components/NavBar";

export default function NewPlayerPage() {
  const router = useRouter()

    return(<main className="p-6">
        <NavBar />
      <h1 className="font-bold mb-4"style={{ fontFamily: "Arial, sans-serif" }}>Create New Player</h1>
      </main>);

}