import { PlayerStatistics } from "@/lib/playerStats";

function formatAverage(value: number | null) {
  return value === null ? "—" : value.toFixed(2);
}

export default function PlayerStatsBadges({ stats }: { stats: PlayerStatistics }) {
  const badges = [
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
    { label: "Favourite called suit", text: `Suit ${stats.favoriteSuit ?? "—"}` },
  ];

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Player statistics">
      {badges.map(badge => (
        <li
          key={badge.label}
          title={badge.label}
          className="rounded-full border border-gray-300 bg-white/70 px-2 py-0.5 text-xs leading-tight dark:border-gray-600 dark:bg-black/20"
        >
          <span className="sr-only">{badge.label}: </span>
          {badge.text}
        </li>
      ))}
    </ul>
  );
}
