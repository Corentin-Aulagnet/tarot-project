"use client";
import "../../globals.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Players,Constants} from "@/utils/supabase/supabase";
import {supabase} from "@/utils/supabase/client";
import Example from "@/components/NavBar";
import { useState } from "react";

export default function NewPlayerPage() {
  const router = useRouter();
  const [name,setName] = useState("");


const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const name = formData.get("name") as string;
  supabase.from("Players").insert({Name: name}).then(({data,error}) => {
    if (error) {
      console.error("Error creating player:", error);
      return;
    }
  });
  router.push("/");
};

    return(<main className="p-6">
        <Example />
      <h1 className="font-bold mb-4"style={{ fontFamily: "Arial, sans-serif" }}>Create New Player</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col">
      <label htmlFor="name" className="mb-1 font-medium">Player Name</label>
      <input type="text" id="name" name="name" required className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"  />
      </div>
      <button type="submit" className="bg-blue-500 text-white px-6 py-3 rounded text-lg hover:bg-blue-600 transition">Create Player</button>
      </form>
      </main>);

}