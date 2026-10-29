"use client";

import {
  aggregateTotalScores,
  buildGamePlayerTotals,
  getPlayersByMostPlayed,
} from "@/lib/scoreUtils";
import { Games, Players } from "@/utils/supabase/types";
import SuitSymbol from "@/components/SuitSymbol";
import { formatGameDate } from "@/lib/dateUtils";

type RankingItem = {
  key: string;
  title: string;
  value: string;
  detail?: string;
  suit?: string;
};

const rankStyles = [
  "border-orange-300 bg-orange-200 text-gray-900 dark:border-orange-300 dark:bg-orange-200 dark:text-gray-900",
  "border-slate-300 bg-slate-200 text-gray-900 dark:border-slate-300 dark:bg-slate-200 dark:text-gray-900",
  "border-stone-400 bg-stone-300 text-gray-900 dark:border-stone-400 dark:bg-stone-300 dark:text-gray-900",
  "border-[#9fbe98] bg-[#c6dec1] text-gray-900 dark:border-[#9fbe98] dark:bg-[#c6dec1] dark:text-gray-900",
];

const rankingDetailStyles = [
  "text-gray-700 dark:text-gray-700",
  "text-gray-700 dark:text-gray-700",
  "text-gray-700 dark:text-gray-700",
  "text-gray-700 dark:text-gray-700",
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
    <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] justify-items-start gap-1">
      {items.map((item, index) => (
        <li
          key={item.key}
          className={`flex ${stacked ? "min-h-14" : "h-14"} w-full items-center gap-1.5 rounded-md border p-1.5 shadow-sm ${rankStyles[Math.min(index, rankStyles.length - 1)]}`}
        >
          <div className="min-w-0 flex-1 text-left">
            <p className={stacked ? "whitespace-pre-line break-words text-sm font-semibold leading-tight" : "truncate text-sm font-semibold leading-tight"}>
              {item.suit ? (
                <SuitSymbol
                  suit={item.suit}
                  className={item.suit === "♣" || item.suit === "♠" ? "!text-black" : ""}
                />
              ) : item.title}
            </p>
            <p className={stacked ? "break-words text-xs leading-tight" : "truncate text-xs leading-tight"}>{item.value}</p>
            {item.detail && (
              <p className={`${stacked ? "whitespace-pre-line break-words" : "truncate"} text-[10px] leading-tight ${rankingDetailStyles[Math.min(index, rankingDetailStyles.length - 1)]}`}>
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
  const gamePlayerTotals = buildGamePlayerTotals(games);
  const playerNames = new Map(players.map(player => [player.id, player.Name]));
  const bestOfMonth = Object.entries(monthlyScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([playerId, score]) => ({
      key: playerId,
      title: playerNames.get(playerId) ?? "Unknown player",
      value: `${score > 0 ? "+" : ""}${score} points`,
    }));
  const worstOfMonth = Object.entries(monthlyScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([playerId, score]) => ({
      key: playerId,
      title: playerNames.get(playerId) ?? "Unknown player",
      value: `${score} points`,
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

  const mostPointsByBouts = [0, 1, 2, 3].map(nBouts => ({
    nBouts,
    games: [...games]
      .filter(game => game.n_bouts === nBouts)
      .sort((a, b) => {
        const takerScoreA = gamePlayerTotals[a.id]?.[a.taker_id] ?? 0;
        const takerScoreB = gamePlayerTotals[b.id]?.[b.taker_id] ?? 0;
        return takerScoreB - takerScoreA || a.created_at.localeCompare(b.created_at);
      })
      .slice(0, 3)
      .map(game => {
        const takerName = playerNames.get(game.taker_id) ?? "Unknown player";
        const callerName = playerNames.get(game.call_id) ?? "Unknown player";
        const takerScore = gamePlayerTotals[game.id]?.[game.taker_id] ?? 0;
        return {
          key: game.id,
          title: game.taker_id === game.call_id
            ? takerName
            : `${takerName}\n${callerName}`,
          value: `${takerScore > 0 ? "+" : ""}${takerScore} scored`,
          detail: `${game.points_att} attack points\n${formatGameDate(game.created_at)}`,
        };
      }),
  }));

  const pointsToMakeByBouts = new Map([
    [0, 56],
    [1, 51],
    [2, 41],
    [3, 36],
  ]);
  const noInitialBoutsGames = games.filter(game => game.n_bouts_hand_start === 0);
  const initialBoutsByTaker = new Map<string, { totalBouts: number; games: number }>();
  games.forEach(game => {
    if (game.n_bouts_hand_start === null) return;
    const stats = initialBoutsByTaker.get(game.taker_id) ?? { totalBouts: 0, games: 0 };
    stats.totalBouts += game.n_bouts_hand_start;
    stats.games += 1;
    initialBoutsByTaker.set(game.taker_id, stats);
  });
  const mostAdventurous = [...initialBoutsByTaker.entries()]
    .sort(([playerA, statsA], [playerB, statsB]) =>
      statsA.totalBouts / statsA.games - statsB.totalBouts / statsB.games
      || (playerNames.get(playerA) ?? "").localeCompare(playerNames.get(playerB) ?? "")
    )
    .slice(0, 10)
    .map(([playerId, stats]) => ({
      key: playerId,
      title: playerNames.get(playerId) ?? "Unknown player",
      value: `${(stats.totalBouts / stats.games).toFixed(2)} bouts`,
      detail: `${stats.games} ${stats.games === 1 ? "take" : "takes"}`,
    }));

  const noBoutsTakerStats = new Map<string, { attempts: number; successes: number }>();
  noInitialBoutsGames.forEach(game => {
    const stats = noBoutsTakerStats.get(game.taker_id) ?? { attempts: 0, successes: 0 };
    stats.attempts += 1;
    const pointsToMake = pointsToMakeByBouts.get(game.n_bouts);
    if (pointsToMake !== undefined && game.points_att >= pointsToMake) {
      stats.successes += 1;
    }
    noBoutsTakerStats.set(game.taker_id, stats);
  });

  const noBoutsTakers = [...noBoutsTakerStats.entries()]
    .sort(([playerA, statsA], [playerB, statsB]) =>
      statsB.attempts - statsA.attempts
      || statsB.successes / statsB.attempts - statsA.successes / statsA.attempts
      || (playerNames.get(playerA) ?? "").localeCompare(playerNames.get(playerB) ?? "")
    )
    .slice(0, 10)
    .map(([playerId, stats]) => ({
      key: playerId,
      title: playerNames.get(playerId) ?? "Unknown player",
      value: `${stats.attempts} ${stats.attempts === 1 ? "take" : "takes"}`,
      detail: `${Math.round(stats.successes / stats.attempts * 100)}% success (${stats.successes}/${stats.attempts})`,
    }));

  const dogBoutsKeptByPlayer = new Map<string, { bouts: number; takes: number }>();
  const calledBoutsByPlayer = new Map<string, { bouts: number; takes: number }>();
  games.forEach(game => {
    if (game.created_at.slice(0, 10) < "2026-10-23") return;
    if (game.contract !== "Garde-Contre") {
      const stats = dogBoutsKeptByPlayer.get(game.taker_id) ?? { bouts: 0, takes: 0 };
      stats.bouts += game.n_bouts_dog ?? 0;
      stats.takes += 1;
      dogBoutsKeptByPlayer.set(game.taker_id, stats);
    }
    const calledStats = calledBoutsByPlayer.get(game.taker_id) ?? { bouts: 0, takes: 0 };
    calledStats.bouts += game.n_bouts_called ?? 0;
    calledStats.takes += 1;
    calledBoutsByPlayer.set(game.taker_id, calledStats);
  });
  const mostDogBoutsKept = [...dogBoutsKeptByPlayer.entries()]
      .filter(([, stats]) => stats.takes > 0)
      .sort(([playerA, statsA], [playerB, statsB]) =>
        statsB.bouts / statsB.takes - statsA.bouts / statsA.takes
        || (playerNames.get(playerA) ?? "").localeCompare(playerNames.get(playerB) ?? "")
      )
      .slice(0, 3)
      .map(([playerId, stats]) => ({
        key: playerId,
        title: playerNames.get(playerId) ?? "Unknown player",
        value: `${(stats.bouts / stats.takes).toFixed(2)} bouts`,
        detail: `${stats.takes} ${stats.takes === 1 ? "take" : "takes"}`,
      }));
  const mostCalledBouts = [...calledBoutsByPlayer.entries()]
      .filter(([, stats]) => stats.takes > 0)
      .sort(([playerA, statsA], [playerB, statsB]) =>
        statsB.bouts / statsB.takes - statsA.bouts / statsA.takes
        || (playerNames.get(playerA) ?? "").localeCompare(playerNames.get(playerB) ?? "")
      )
      .slice(0, 3)
      .map(([playerId, stats]) => ({
        key: playerId,
        title: playerNames.get(playerId) ?? "Unknown player",
        value: `${(stats.bouts / stats.takes).toFixed(2)} bouts`,
        detail: `${stats.takes} ${stats.takes === 1 ? "take" : "takes"}`,
      }));

  const biggestNoBoutsWins = noInitialBoutsGames
    .map(game => ({
      game,
      takerScore: gamePlayerTotals[game.id]?.[game.taker_id] ?? 0,
    }))
    .filter(result => result.takerScore > 0)
    .sort((a, b) =>
      b.takerScore - a.takerScore
      || a.game.created_at.localeCompare(b.game.created_at)
    )
    .slice(0, 3)
    .map(({ game, takerScore }) => ({
      key: game.id,
      title: playerNames.get(game.taker_id) ?? "Unknown player",
      value: `+${takerScore} scored`,
      detail: `${game.contract} · called ${playerNames.get(game.call_id) ?? "Unknown player"}`,
    }));

  const mostPlayedItems = topPlayedPlayers.map(player => ({
    key: player.id,
    title: player.Name,
    value: `${playerGameCount[player.id] ?? 0} games`,
  }));

  return (
    <div className="space-y-4 p-2 sm:p-3">
      <h1 className="font-bold" style={{ fontFamily: "Arial, sans-serif" }}>
        Statistics
      </h1>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3">
        <section className="space-y-1.5">
          <h2 className="text-base font-semibold">
            Best of {monthName} <span className="text-sm font-normal">(points won)</span>
          </h2>
          <RankingCards items={bestOfMonth} emptyMessage="No games recorded this month." />
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-semibold">
            Worst of {monthName} <span className="text-sm font-normal">(points lost)</span>
          </h2>
          <RankingCards items={worstOfMonth} emptyMessage="No games recorded this month." />
        </section>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3">
        <section className="space-y-1.5">
          <h2 className="text-base font-semibold">Biggest win in a game</h2>
          <RankingCards items={biggestWins} emptyMessage="No positive game scores recorded." />
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-semibold">Biggest loss in a game</h2>
          <RankingCards items={biggestLosses} emptyMessage="No negative game scores recorded." />
        </section>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Most points by number of bouts</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3">
          {mostPointsByBouts.map(({ nBouts, games: rankedGames }) => (
            <section key={nBouts} className="space-y-1.5">
              <h3 className="text-sm font-medium">With {nBouts} bouts</h3>
              <RankingCards
                items={rankedGames}
                emptyMessage={`No games with ${nBouts} bouts recorded.`}
                stacked
              />
            </section>
          ))}
        </div>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-base font-semibold">
          Most games played <span className="text-sm font-normal">(of {games.length} games)</span>
        </h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] justify-items-start gap-1">
          {mostPlayedItems.map((item, index) => (
            <li
              key={item.key}
              className={`flex h-14 w-full items-center gap-1.5 rounded-md border p-1.5 shadow-sm ${rankStyles[Math.min(index, rankStyles.length - 1)]}`}
            >
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold leading-tight">{item.title}</p>
                <p className={`truncate text-xs leading-tight ${rankingDetailStyles[Math.min(index, rankingDetailStyles.length - 1)]}`}>{item.value}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-base font-semibold">Most called suit</h2>
        <RankingCards
          items={mostCalledColors.map(({ color, count }) => ({
            key: color,
            title: color,
            suit: color,
            value: `${count} ${count === 1 ? "game" : "games"}`,
          }))}
          emptyMessage="No called suits have been recorded yet."
        />
      </section>

      <section className="space-y-1.5">
        <h2 className="text-base font-semibold">Least starting bouts</h2>
        <RankingCards
          items={mostAdventurous}
          emptyMessage="No recorded starting-bouts data for takers yet."
        />
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3">
        <section className="space-y-1.5">
          <h2 className="text-base font-semibold">Takes with no initial bouts</h2>
          <RankingCards
            items={noBoutsTakers}
            emptyMessage="No games with zero bouts at the start have been recorded."
          />
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-semibold">Big games with no initial bouts</h2>
          <RankingCards
            items={biggestNoBoutsWins}
            emptyMessage="No positive taker scores from games with zero bouts at the start."
            stacked
          />
        </section>
      </div>

      <section className="space-y-1.5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3">
          <section className="space-y-1">
            <h2 className="text-base font-semibold">Bouts found in dog (kept)</h2>
            <RankingCards
              items={mostDogBoutsKept}
              emptyMessage="No dog-bout data recorded outside Garde-Contre games."
            />
          </section>
          <section className="space-y-1">
            <h2 className="text-base font-semibold">Bouts called</h2>
            <RankingCards
              items={mostCalledBouts}
              emptyMessage="No called-bout data recorded yet."
            />
          </section>
        </div>
      </section>
    </div>
  );
}
