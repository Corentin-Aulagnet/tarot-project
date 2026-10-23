import { PlayerStatistics } from "@/lib/playerStats";
import { useEffect, useId, useRef, useState } from "react";
import SuitSymbol from "@/components/SuitSymbol";

function formatAverage(value: number | null) {
  return value === null ? "—" : value.toFixed(2);
}

export default function PlayerStatsBadges({
  stats,
  sortField,
}: {
  stats: PlayerStatistics;
  sortField?: string;
}) {
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

  const percentage = (count: number, total: number) =>
    `${total ? Math.round(count / total * 100) : 0}%`;
  const generalBadges: { key: string; label: string; text: string; suit?: string | null }[] = [
    { key: "gamesPlayed", label: "Games played", text: `Played ${stats.gamesPlayed}` },
    { key: "gamesWon", label: "Games won", text: `Won ${stats.gamesWon} (${percentage(stats.gamesWon, stats.gamesPlayed)})` },
    { key: "averageScoredPointsPerGame", label: "Average scored points per game", text: `Avg scored ${formatAverage(stats.averageScoredPointsPerGame)}` },
    { key: "maxScored", label: "Max scored", text: `↑ ${stats.maxScored ?? "—"}` },
    { key: "maxLost", label: "Max lost", text: `↓ ${stats.maxLost ?? "—"}` },
  ];

  const boutBadges: { key: string; label: string; text: string; suit?: string | null }[] = [
    { key: "averageStartingBouts", label: "Average bouts at start", text: `Bouts Start ${formatAverage(stats.averageStartingBouts)}` },
    { key: "averageDogBouts", label: "Average bouts found in dog", text: `Bouts Dog ${formatAverage(stats.averageDogBouts)}` },
    { key: "averageCalledBouts", label: "Average bouts called", text: `Bouts Called ${formatAverage(stats.averageCalledBouts)}` },
    { key: "averageEndingBouts", label: "Average bouts won", text: `Bouts Won ${formatAverage(stats.averageEndingBouts)}` },
  ];
  const remainingBadges: { key: string; label: string; text: string; suit?: string | null }[] = [
    { key: "gamesTaken", label: "Games taken", text: `Taken ${stats.gamesTaken} (${percentage(stats.gamesTaken, stats.gamesPlayed)})` },
    {
      key: "favoriteCalledPlayer",
      label: "Player called most often and number of times called",
      text: `${stats.favoriteCalledPlayer ?? "—"} ${stats.favoriteCalledPlayerCount} (${percentage(stats.favoriteCalledPlayerCount, stats.gamesTaken)})`,
    },
    { key: "calledCount", label: "Times called as partner", text: `Called ${stats.calledCount} (${percentage(stats.calledCount, stats.gamesPlayed)})` },
    {
      key: "favoriteSuit",
      label: "Favourite called suit",
      text: `Suit ${percentage(stats.favoriteSuitCount, stats.gamesTaken)}`,
      suit: stats.favoriteSuit,
    },
  ];
  const defaultBadges = [...generalBadges, ...boutBadges, ...remainingBadges];
  const badges = sortField && sortField !== "name"
    ? [
        ...defaultBadges.filter(badge => badge.key === sortField),
        ...defaultBadges.filter(badge => badge.key !== sortField),
      ]
    : defaultBadges;
  const renderBadge = (badge: { key: string; label: string; text: string; suit?: string | null }) => (
    <li key={badge.label} className="relative min-w-0">
      <button
        type="button"
        title={badge.label}
        aria-label={`${badge.label}: ${badge.text}`}
        aria-describedby={activeTooltip === badge.label ? `${tooltipId}-${badge.label}` : undefined}
        onClick={() => showTooltip(badge.label)}
        className={`rounded-full border px-2 py-0.5 text-xs leading-tight ${
          sortField === badge.key
            ? "border-white bg-white text-black"
            : "border-gray-300 bg-white/70 dark:border-gray-600 dark:bg-black/20"
        }`}
      >
        <span className="sr-only">{badge.label}: </span>
        {badge.suit ? (
          <>
            <span>Suit</span> <SuitSymbol suit={badge.suit} className="ml-0.5 !text-xs" /> <span>{percentage(stats.favoriteSuitCount, stats.gamesTaken)}</span>
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
  );

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Player statistics">
      {badges.map(renderBadge)}
    </ul>
  );
}
