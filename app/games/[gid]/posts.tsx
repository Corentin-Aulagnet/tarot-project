"use client";

import { Games } from "@/utils/supabase/supabase";
import { useState } from "react";
import { TrashIcon } from '@heroicons/react/24/outline'

export default function Posts({ initialGame }:{ initialGame: Games }) {
  const [game, setGame] = useState(initialGame);
  
  return (
    <div className="p-4 border rounded">
      <h1>{`${new Date(game.created_at).toLocaleDateString()} ${new Date(game.created_at).toLocaleTimeString()}`}</h1>

      <input type="datetime-local"
        
        onChange={(e) =>
          setGame({ ...game, created_at: new Date(e.target.value).toISOString() } as Games)
        }
      />
      <TrashIcon className="h-5 w-5" />
    </div>
    
  );
}