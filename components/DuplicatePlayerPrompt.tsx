import Link from "next/link";
import { Players } from "@/utils/supabase/types";

export default function DuplicatePlayerPrompt({
  player,
  profileHref,
  onChooseDifferentName,
}: {
  player: Players;
  profileHref: string;
  onChooseDifferentName: () => void;
}) {
  return (
    <div role="alertdialog" aria-labelledby="duplicate-player-title" className="mt-3 rounded-md border border-amber-500 bg-amber-950/40 p-4 text-sm text-amber-100">
      <p id="duplicate-player-title">
        A player named <strong>{player.Name}</strong> already exists. Is this the same person?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={profileHref} className="rounded bg-amber-200 px-3 py-2 font-medium text-gray-900 hover:bg-amber-100">
          Yes, use this player
        </Link>
        <button type="button" onClick={onChooseDifferentName} className="rounded border border-amber-300 px-3 py-2 font-medium hover:bg-amber-900/60">
          No, choose a different name
        </button>
      </div>
    </div>
  );
}
