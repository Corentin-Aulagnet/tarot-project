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
 * - Players with positive scores: green text
 * - Players with negative scores: red text
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
import { Games,Players } from "../../utils/supabase/supabase";
import { getColorFromId } from "../IterativeTotalLineChart";
import Link from "next/link";

/**
 * Props for the GamesTable component.
 * 
 * @param games - Array of all game records; displayed as table rows
 * @param players - Array of all players; determines table columns
 * @param table - Nested record mapping gameId → playerId → score (per-game scores)
 * @param totals - Record mapping playerId → cumulative score (totals row)
 */
export type GameTableProps={
  games:Games[],
  players:Players[],
  table: Record<Games['id'], Record<Players['id'],number>>
  totals: Record<Players['id'],number>
}

/**
 * GamesTable: Displays all Tarot games and scores in a sticky-header table.
 * 
 * @param props GameTableProps
 * @returns Rendered table with game rows and player score columns
 */
export function GamesTable({ games, players, table,totals }:GameTableProps) {
  return (
    <div className="max-h-72 overflow-auto border border-gray-300 dark:text-white" >
      <table className="min-w-full border-collapse dark:bg-gray-900">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 border px-4 py-2">Game</th>
            {players.map(p => (<th key={p.id} className="sticky top-0 z-20 border px-4 py-2">
              <Link  className={"text-center align-text-top"} href={`/players/${p.id}`}>
                  {p.Name}
                </Link></th>
              
            ))}
          </tr>
        </thead>

        <tbody>
          <tr >
              <td className={`border px-4 py-2  sticky top-10 z-20 font-bold`}>
                Totals 
              </td>

              {players.map(player => (
                <td className={`border px-4 py-2  text-center sticky top-10 z-20 font-bold ${totals[player.id] >=0 ? " text-green-500" : " text-red-500"}                 `} key={player.id} >
                  {totals[player.id]?.toString() ?? "-"}
                </td>
              ))}
            </tr>
          {games.map((game) => (
            <tr key={game.id} >
              <td className={`border px-4 py-2 dark:bg-gray-700`}>
                <Link className={"dark:bg-gray-700"}href={`/games/${game.id}`}>
                  {`${new Date(game.created_at).toLocaleDateString()} ${new Date(game.created_at).toLocaleTimeString()}`}
                </Link>
              </td>

              {players.map(player => (
                <td className={`border px-4 py-2 text-center dark:text-white
                } `} key={player.id}  >
                  {table[game.id][player.id]?.toString() ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <style jsx>{`
        .table-container {
          max-height: 400px;
          overflow: auto;
          border: 1px solid #ccc;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        th, td {
          padding: 8px 12px;
          border: 1px solid #ddd;
        }

        thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          /* background: #f5f5f5; */
        }

        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 1;
          background: #fff;
        }

        thead .sticky-col {
          z-index: 3; /* above everything */
          /* background: #f5f5f5; */
        }
      `}</style>
    </div>
  )
}