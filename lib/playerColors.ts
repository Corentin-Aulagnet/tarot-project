import { Players } from "@/utils/supabase/types";

export const PLAYER_COLORS = [
  { name: "Coral", value: "#f08070" },
  { name: "Orange", value: "#f4a261" },
  { name: "Gold", value: "#e9c46a" },
  { name: "Lime", value: "#b5c96b" },
  { name: "Green", value: "#82b879" },
  { name: "Teal", value: "#55b7a7" },
  { name: "Turquoise", value: "#55c7c2" },
  { name: "Sky blue", value: "#69bde8" },
  { name: "Blue", value: "#78a9e8" },
  { name: "Periwinkle", value: "#969be8" },
  { name: "Lavender", value: "#ad91dc" },
  { name: "Purple", value: "#c18bd6" },
  { name: "Orchid", value: "#d785c0" },
  { name: "Pink", value: "#e98bab" },
  { name: "Rose", value: "#ed8291" },
  { name: "Salmon", value: "#ec987f" },
  { name: "Peach", value: "#e9ae7b" },
  { name: "Mint", value: "#83c5a2" },
  { name: "Aqua", value: "#70c5d4" },
  { name: "Lilac", value: "#b39cdb" },
  { name: "Mauve", value: "#d39ab0" },
  { name: "Sand", value: "#c9ad80" },
  { name: "Seafoam", value: "#90c7b0" },
  { name: "Powder blue", value: "#8ab7d1" },
  { name: "Soft red", value: "hsl(0, 70%, 70%)" },
  { name: "Soft green", value: "hsl(137, 70%, 70%)" },
  { name: "Soft violet", value: "hsl(274, 70%, 70%)" },
  { name: "Soft lime", value: "hsl(51, 70%, 70%)" },
  { name: "Soft cyan", value: "hsl(188, 70%, 70%)" },
  { name: "Soft pink", value: "hsl(325, 70%, 70%)" },
  { name: "Soft chartreuse", value: "hsl(102, 70%, 70%)" },
  { name: "Apricot", value: "#f2b880" },
  { name: "Buttercup", value: "#e8d47a" },
  { name: "Pistachio", value: "#aaca82" },
  { name: "Jade", value: "#72b99a" },
  { name: "Lagoon", value: "#64c0bd" },
  { name: "Glacier", value: "#82c5df" },
  { name: "Cornflower", value: "#86a8dc" },
  { name: "Iris", value: "#aaa0e2" },
  { name: "Wisteria", value: "#bd9bdb" },
  { name: "Fuchsia", value: "#d58ccf" },
  { name: "Blush", value: "#e995b5" },
  { name: "Watermelon", value: "#ec8d83" },
  { name: "Amber", value: "#e9a45f" },
  { name: "Chartreuse", value: "#c3cf71" },
  { name: "Sea glass", value: "#76c9ae" },
  { name: "Ice blue", value: "#91cce0" },
  { name: "Denim", value: "#779ad1" },
  { name: "Heather", value: "#a99ac8" },
] as const;

export function getAvailablePlayerColors(players: Players[], playerId?: string) {
  const usedColors = new Set(
    players
      .filter(player => player.id !== playerId && player.preferred_color)
      .map(player => player.preferred_color?.toLowerCase())
  );
  return PLAYER_COLORS.filter(color => !usedColors.has(color.value));
}

export function getDefaultPlayerColor(player: Players, players: Players[]) {
  if (player.preferred_color) return player.preferred_color;

  const stablePlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));
  const playerIndex = stablePlayers.findIndex(candidate => candidate.id === player.id);
  const availableColor = getAvailablePlayerColors(players, player.id)[0];
  return availableColor?.value ?? PLAYER_COLORS[Math.max(playerIndex, 0) % PLAYER_COLORS.length].value;
}
