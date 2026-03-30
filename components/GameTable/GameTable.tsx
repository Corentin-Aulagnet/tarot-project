'use client'
import { Games,Players } from "../../utils/supabase/supabase";
import { getColorFromId } from "../IterativeTotalLineChart";
export type GameTableProps={
  games:Games[],
  players:Players[],
  table: Record<Games['id'], Record<Players['id'],number>>
  totals: Record<Players['id'],number>
}
export function GamesTable({ games, players, table,totals }:GameTableProps) {
  return (
    <div className="max-h-96 overflow-auto border border-gray-300" >
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 bg-gray-100 border px-4 py-2">Game</th>
            {players.map(p => (
              <th key={p.id} className="sticky top-0 left-0 z-10 bg-gray-100 border px-4 py-2" style={{ color: getColorFromId(p.id) }}>
                {p.Name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr className="even:bg-gray-50">
              <td className={`border px-4 py-2 bg-white sticky top-10 z-20 font-bold`}>
                Totals 
              </td>

              {players.map(player => (
                <td className={`border px-4 py-2 bg-white text-center sticky top-10 z-20 font-bold ${totals[player.id] >=0 ? " text-green-500" : " text-red-500"}                 `} key={player.id} >
                  {totals[player.id]?.toString() ?? "-"}
                </td>
              ))}
            </tr>
          {games.map((game) => (
            <tr key={game.id} className="even:bg-gray-50">
              <td className={`border px-4 py-2 bg-white `}>
                {`${new Date(game.created_at).toLocaleDateString()} ${new Date(game.created_at).toLocaleTimeString()}`}
              </td>

              {players.map(player => (
                <td className={`border px-4 py-2 bg-white text-center 
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
          background: white;
        }

        thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #f5f5f5;
        }

        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 1;
          background: #fff;
        }

        thead .sticky-col {
          z-index: 3; /* above everything */
          background: #f5f5f5;
        }
      `}</style>
    </div>
  )
}