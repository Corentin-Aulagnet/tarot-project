/**
 * GameTable Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Renders a sortable, sticky-header table showing all Tarot games and per-player scores.
 * Located on home page (app/page.tsx).
 * 
 * FEATURES:
 * ─────────
 * - Sticky header row (stays visible when scrolling)
 * - Sticky game column (game timestamps/links stay visible when scrolling right)
 * - Color-coded player columns (each player has consistent hue across component)
 * - Totals row at top showing cumulative scores for each player
 * - Clickable game links navigate to /games/[id] for detail view
 * - Responsive: truncates on mobile, full table on desktop
 * 
 * PROPS:
 * ──────
 * {GameTableProps}
 *   - games: Games[] → All game records from database (sorted by created_at)
 *   - players: Players[] → All registered players
 *   - table: Record<GameID, Record<PlayerID, Score>> → Per-game per-player scores
 *     Output from scoreUtils.buildGamePlayerTotals()
 *   - totals: Record<PlayerID, TotalScore> → Cumulative scores across all games
 *     Output from scoreUtils.aggregateTotalScores()
 * 
 * STYLING:
 * ────────
 * - Uses Tailwind CSS with custom z-index stacking for sticky elements
 * - Player names use their assigned chart color
 * - Totals use soft red/green backgrounds with white text
 * - Alternating row backgrounds (odd/even) for readability
 * - Colors from getColorFromId() generator function
 * 
 * INTERACTION:
 * ─────────────
 * - Click game timestamp → navigate to /games/[gid] for detail/edit
 * - No sorting in this version (games shown in database order; typically by date desc)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use client'
import { Games,Players } from "../../utils/supabase/types";
import Link from "next/link";
import { formatGameDateTime } from "@/lib/dateUtils";
import { getDefaultPlayerColor } from "@/lib/playerColors";

/**
 * Props for the GamesTable component.
 * 
 * @param games - Array of all game records; displayed as table rows
 * @param players - Array of all players; determines table columns
 * @param table - Nested record mapping gameId → playerId → score (per-game scores)
 * @param totals - Record mapping playerId → cumulative score (totals row)
 */
export type GameTableProps<G extends TableGame = Games>={
  games:G[],
  players:Players[],
  table: Record<string, Record<Players['id'],number>>
  totals: Record<Players['id'],number>,
  recentPlayers?: boolean,
  getGameHref?: (game: G) => string,
  getGameLabel?: (game: G) => string | null,
  isTaker?: (game: G, playerId: Players['id']) => boolean,
  getPlayerHref?: (playerId: Players['id']) => string,
}

type TableGame = { id: string, created_at: string };

// Defaults keep the Tarot behaviour; Belote and Coinche pass their own.
const tarotGameHref = (game: TableGame) => `/games/${game.id}`;
const tarotGameLabel = (game: TableGame) => (game as Games).contract;
const tarotIsTaker = (game: TableGame, playerId: Players['id']) => (game as Games).taker_id === playerId;
const tarotPlayerHref = (playerId: Players['id']) => `/players/${playerId}`;

/**
 * GamesTable: Displays all Tarot games and scores in a sticky-header table.
 * 
 * @param props GameTableProps
 * @returns Rendered table with game rows and player score columns
 */
export function GamesTable<G extends TableGame = Games>({
  games,
  players,
  table,
  totals,
  recentPlayers = false,
  getGameHref = tarotGameHref,
  getGameLabel = tarotGameLabel,
  isTaker = tarotIsTaker,
  getPlayerHref = tarotPlayerHref,
}:GameTableProps<G>) {
  const totalCellStyle = (score: number) => ({
    backgroundColor: score >= 0 ? "#6f9c7e" : "#b9737c",
  });

  return (
    <div
      className="game-results-scroll overflow-auto border border-gray-300 dark:text-white"
      data-player-scope={recentPlayers ? "recent" : "all"}
    >
      <table className="game-results-landscape min-w-full border-collapse bg-white shadow-lg dark:bg-gray-900">
        <thead>
          <tr className="sticky top-0 z-30 bg-white dark:bg-gray-900">
            <th className="whitespace-nowrap border px-2 py-2">Game</th>
            {players.map(player => (
              <th key={player.id} className="whitespace-nowrap border px-2 py-2">
                <Link
                  className="text-center"
                  href={getPlayerHref(player.id)}
                  style={{ color: getDefaultPlayerColor(player, players) }}
                >
                  {player.Name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="sticky top-10 z-20 bg-white font-bold dark:bg-gray-900">
            <td className="border px-2 py-2">Totals</td>
            {players.map(player => (
              <td
                key={player.id}
                className="sticky top-10 border border-white px-2 py-2 text-center font-bold text-white"
                style={totalCellStyle(totals[player.id])}
              >
                {totals[player.id]?.toString() ?? "-"}
              </td>
            ))}
          </tr>
          {games.map(game => (
            <tr key={game.id}>
              <td className="whitespace-nowrap border px-2 py-2 dark:bg-gray-700">
                <Link href={getGameHref(game)}>
                  {formatGameDateTime(game.created_at)}<br/><p className="font-style: italic">{getGameLabel(game)}</p>
                </Link> 
              </td>
              {players.map(player => (
                <td
                  key={player.id}
                  className="border px-2 py-2 text-center dark:text-white"
                >
                  <span className={isTaker(game, player.id) ? "text-blue-600 dark:text-blue-400" : undefined}>
                    {table[game.id]?.[player.id]?.toString() ?? "-"}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="game-results-portrait hidden border-collapse bg-white shadow-lg dark:bg-gray-900">
        <thead>
          <tr className="sticky top-0 z-30 bg-white dark:bg-gray-900">
            <th className="sticky left-0 z-40 border px-2 py-2">Player</th>
            <th className="border px-2 py-2">Total</th>
            {games.map(game => (
              <th key={game.id} className="game-results-date-cell whitespace-nowrap border px-2 py-2">
                <Link href={getGameHref(game)} className="block whitespace-nowrap">
                  {formatGameDateTime(game.created_at)}<br/><p className="font-style: italic">{getGameLabel(game)}</p>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <th className="sticky left-0 z-20 whitespace-nowrap border bg-white px-2 py-2 text-left dark:bg-gray-900">
                <Link
                  href={getPlayerHref(player.id)}
                  style={{ color: getDefaultPlayerColor(player, players) }}
                >
                  {player.Name}
                </Link>
              </th>
              <td
                className="border border-white px-2 py-2 text-center font-bold text-white"
                style={totalCellStyle(totals[player.id])}
              >
                {totals[player.id]?.toString() ?? "-"}
              </td>
              {games.map(game => (
                <td key={game.id} className="game-results-date-cell border px-2 py-2 text-center" >
                  <span className={isTaker(game, player.id) ? "text-blue-600 dark:text-blue-400" : undefined}>
                    {table[game.id]?.[player.id]?.toString() ?? "-"}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}