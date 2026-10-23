import { Players } from "@/utils/supabase/types";

export function normalizePlayerName(name: string) {
  return name.trim().toLowerCase();
}

export function findDuplicatePlayer(players: Players[], name: string) {
  const normalizedName = normalizePlayerName(name);
  return players.find(player => normalizePlayerName(player.Name) === normalizedName) ?? null;
}
