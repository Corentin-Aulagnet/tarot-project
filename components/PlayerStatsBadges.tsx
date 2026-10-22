import { PlayerStatistics } from "@/lib/playerStats";
import { useEffect, useId, useRef, useState } from "react";
import SuitSymbol from "@/components/SuitSymbol";

function formatAverage(value: number | null) {
  return value === null ? "—" : value.toFixed(2);
}

export default function PlayerStatsBadges({ stats }: { stats: PlayerStatistics }) {
  const tooltipId = useId();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
  }, []);

  const showTooltip = (label: string) => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setActiveTooltip(label);
    tooltipTimeout.current = setTimeout(() => {
      setActiveTooltip(null);
      tooltipTimeout.current = null;
    }, 3000);
  };

  const badges: { label: string; text: string; suit?: string | null }[] = [
    { label: "Games played", text: `Played ${stats.gamesPlayed}` },
    { label: "Games won", text: `Won ${stats.gamesWon}` },
    { label: "Average scored points per game", text: `Avg scored ${formatAverage(stats.averageScoredPointsPerGame)}` },
    { label: "Max scored", text: `↑ ${stats.maxScored ?? "—"}` },
    { label: "Max lost", text: `↓ ${stats.maxLost ?? "—"}` },
    { label: "Average bouts at start", text: `Bouts Start ${formatAverage(stats.averageStartingBouts)}` },
    { label: "Average bouts won", text: `Bouts Won ${formatAverage(stats.averageEndingBouts)}` },
    { label: "Games taken", text: `Taken ${stats.gamesTaken}` },
    {
      label: "Player called most often and number of times called",
      text: `${stats.favoriteCalledPlayer ?? "—"} ${stats.favoriteCalledPlayerCount}`,
    },
    { label: "Times called as partner", text: `Called ${stats.calledCount}` },
    {
      label: "Favourite called suit",
      text: `Suit ${stats.favoriteSuit ?? "—"}`,
      suit: stats.favoriteSuit,
    },
  ];

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Player statistics">
      {badges.map(badge => (
        <li
          key={badge.label}
          className="relative"
        >
          <button
            type="button"
            title={badge.label}
            aria-label={`${badge.label}: ${badge.text}`}
            aria-describedby={activeTooltip === badge.label ? `${tooltipId}-${badge.label}` : undefined}
            onClick={() => showTooltip(badge.label)}
            className="rounded-full border border-gray-300 bg-white/70 px-2 py-0.5 text-xs leading-tight dark:border-gray-600 dark:bg-black/20"
          >
            <span className="sr-only">{badge.label}: </span>
            {badge.suit ? (
              <>
                Suit <SuitSymbol suit={badge.suit} className="ml-0.5 text-[16px]" />
              </>
            ) : badge.text}
          </button>
          {activeTooltip === badge.label && (
            <span
              id={`${tooltipId}-${badge.label}`}
              role="tooltip"
              className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-56 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs font-normal text-white shadow-lg"
            >
              {badge.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
