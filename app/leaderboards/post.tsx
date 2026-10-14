"use client";

import {
  aggregateTotalScores,
  buildGamePlayerTotals,
  getPlayersByMostPlayed,
} from "@/lib/scoreUtils";
import { Games, Players } from "@/utils/supabase/types";

type RankingItem = {
  key: string;
  title: string;
  value: string;
  detail?: string;
};

const rankStyles = [
  "border-yellow-400 bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/40",
  "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800",
  "border-orange-400 bg-orange-100 dark:border-orange-700 dark:bg-orange-900/40",
  "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800",
];

function RankingCards({
  items,
  emptyMessage,
  stacked = false,
}: {
  items: RankingItem[];
  emptyMessage: string;
  stacked?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">{emptyMessage}</p>;
  }

  return (
    <ol className={`grid justify-items-start gap-2 ${stacked ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
      {items.map((item, index) => (
        <li
          key={item.key}
          className={`flex ${stacked ? "min-h-20" : "h-20"} w-full items-center gap-3 rounded-lg border p-3 shadow-sm ${rankStyles[Math.min(index, rankStyles.length - 1)]}`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-gray-800 dark:bg-black/20 dark:text-white">
            #{index + 1}
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className={stacked ? "break-words font-semibold" : "truncate font-semibold"}>{item.title}</p>
            <p className={stacked ? "break-words text-sm" : "truncate text-sm"}>{item.value}</p>
            {item.detail && (
              <p className={stacked ? "break-words text-xs text-gray-600 dark:text-gray-300" : "truncate text-xs text-gray-600 dark:text-gray-300"}>
                {item.detail}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Post({
  games,
  players,
  monthIndex,
  monthName,
}: {
  games: Games[];
  players: Players[];
  monthIndex: number;
  monthName: string;
}) {
  const [playerGameCount, mostPlayedPlayers] = getPlayersByMostPlayed(games, players);
  const topPlayedPlayers = mostPlayedPlayers.slice(0, 10);

  const sortedGames = [...games].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const gamesInMonth = sortedGames.filter(
    game => new Date(game.created_at).getUTCMonth() === monthIndex
  );
  const monthlyScores = aggregateTotalScores(gamesInMonth, topPlayedPlayers);
  const allTimeScores = aggregateTotalScores(games, players);
  const gamePlayerTotals = buildGamePlayerTotals(games, players);
  const playerNames = new Map(players.map(player => [player.id, player.Name]));
  const formatGameDate = (createdAt: string) => new Date(createdAt).toLocaleDateString();

  const bestOfMonth = Object.entries(monthlyScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([playerId, score]) => ({
      key: playerId,
      title: playerNames.get(playerId) ?? "Unknown player",
      value: `${score > 0 ? "+" : ""}${score} points`,
      detail: `All-time total: ${allTimeScores[playerId] ?? 0} points`,
    }));
  const worstOfMonth = Object.entries(monthlyScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([playerId, score]) => ({
      key: playerId,
      title: playerNames.get(playerId) ?? "Unknown player",
      value: `${score} points`,
      detail: `All-time total: ${allTimeScores[playerId] ?? 0} points`,
    }));

  const mostCalledColors = ["♥", "♦", "♣", "♠"].map(color => ({
    color,
    count: games.filter(game => game.call_color === color).length,
  })).sort((a, b) => b.count - a.count || ["♥", "♦", "♣", "♠"].indexOf(a.color) - ["♥", "♦", "♣", "♠"].indexOf(b.color));

  const playerGameScores = games.flatMap(game =>
    Object.entries(gamePlayerTotals[game.id] ?? {}).map(([playerId, score]) => ({
      gameId: game.id,
      createdAt: game.created_at,
      playerName: playerNames.get(playerId) ?? "Unknown player",
      score,
    }))
  );
  const biggestWins = playerGameScores
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 3)
    .map((result, index) => ({
      key: `${result.gameId}-${result.playerName}-${index}`,
      title: result.playerName,
      value: `+${result.score} points`,
      detail: formatGameDate(result.createdAt),
    }));
  const biggestLosses = playerGameScores
    .filter(result => result.score < 0)
    .sort((a, b) => a.score - b.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 3)
    .map((result, index) => ({
      key: `${result.gameId}-${result.playerName}-${index}`,
      title: result.playerName,
      value: `${result.score} points`,
      detail: formatGameDate(result.createdAt),
    }));

  const mostPointsByBouts = [0, 1, 2].map(nBouts => ({
    nBouts,
    games: [...games]
      .filter(game => game.n_bouts === nBouts)
      .sort((a, b) => b.points_att - a.points_att || a.created_at.localeCompare(b.created_at))
      .slice(0, 3)
      .map(game => {
        const takerName = playerNames.get(game.taker_id) ?? "Unknown player";
        const callerName = playerNames.get(game.call_id) ?? "Unknown player";
        return {
          key: game.id,
          title: game.taker_id === game.call_id
            ? takerName
            : `${takerName} and ${callerName}`,
          value: `${game.points_att} attack points`,
          detail: formatGameDate(game.created_at),
        };
      }),
  }));

  const mostPlayedItems = topPlayedPlayers.map((player, index) => ({
    key: player.id,
    title: player.Name,
    value: `${playerGameCount[player.id] ?? 0} games`,
    detail: `${games.length} games recorded`,
    rank: index + 1,
  }));

  return (
    <div className="space-y-8 p-6">
      <h1 className="font-bold" style={{ fontFamily: "Arial, sans-serif" }}>
        Statistics
      </h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Best of {monthName} <span className="text-sm font-normal">(points won)</span>
        </h2>
        <RankingCards items={bestOfMonth} emptyMessage="No games recorded this month." />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Worst of {monthName} <span className="text-sm font-normal">(points lost)</span>
        </h2>
        <RankingCards items={worstOfMonth} emptyMessage="No games recorded this month." />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Most Played Players <span className="text-sm font-normal">(of {games.length} games)</span>
        </h2>
        <ol className="grid grid-cols-1 justify-items-start gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {mostPlayedItems.map(item => (
            <li
              key={item.key}
              className={`flex h-20 w-full items-center gap-3 rounded-lg border p-3 shadow-sm ${rankStyles[Math.min(item.rank - 1, rankStyles.length - 1)]}`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-gray-800 dark:bg-black/20 dark:text-white">
                #{item.rank}
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="truncate text-sm">{item.value}</p>
                <p className="truncate text-xs text-gray-600 dark:text-gray-300">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Most called suit</h2>
        <RankingCards
          items={mostCalledColors.map(({ color, count }) => ({
            key: color,
            title: color,
            value: `${count} ${count === 1 ? "game" : "games"}`,
          }))}
          emptyMessage="No called suits have been recorded yet."
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Biggest win in a game</h2>
          <RankingCards items={biggestWins} emptyMessage="No positive game scores recorded." />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Biggest loss in a game</h2>
          <RankingCards items={biggestLosses} emptyMessage="No negative game scores recorded." />
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Most points by number of bouts</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {mostPointsByBouts.map(({ nBouts, games: rankedGames }) => (
            <section key={nBouts} className="space-y-3">
              <h3 className="font-medium">With {nBouts} bouts</h3>
              <RankingCards
                items={rankedGames}
                emptyMessage={`No games with ${nBouts} bouts recorded.`}
                stacked
              />
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
