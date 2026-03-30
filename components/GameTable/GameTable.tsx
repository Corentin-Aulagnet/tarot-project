'use client'
import { Games,Players } from "../../utils/supabase/supabase";
export type GameTableProps={
  games:Games[],
  players:Players[],
  table: Record<Games['id'], Record<Players['id'],number>>
}
export  function StickyTable() {
  const data = Array.from({ length: 50 }, (_, i) => ({
    name: `Row ${i + 1}`,
    col1: `Data ${i + 1}-1`,
    col2: `Data ${i + 1}-2`,
    col3: `Data ${i + 1}-3`,
  }));

  return (
    <div className="max-h-96 overflow-auto border border-gray-300">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 bg-gray-100 border px-4 py-2">Name</th>
            <th className="sticky top-0 left-0 z-10 bg-gray-100 border px-4 py-2">Column 1</th>
            <th className="sticky top-0 left-0 z-10 bg-gray-100 border px-4 py-2">Column 2</th>
            <th className="sticky top-0 left-0 z-10 bg-gray-100 border px-4 py-2">Column 3</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}  className="even:bg-gray-50">
              <td className={`border px-4 py-2 bg-white ${
                  index === 0 ? "sticky top-10 z-20" : ""
                }`}>{row.name}</td>
              <td className={`border px-4 py-2 bg-white ${
                  index === 0 ? "sticky top-10 z-20" : ""
                }`}>{row.col1}</td>
              <td className={`border px-4 py-2 bg-white ${
                  index === 0 ? "sticky top-10 z-20" : ""
                }`}>{row.col2}</td>
              <td className={`border px-4 py-2 bg-white ${
                  index === 0 ? "sticky top-10 z-20" : ""
                }`}>{row.col3}</td>
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
  );
}
export function GamesTable({ games, players, table }:GameTableProps) {
  return (
    <div className="max-h-96 overflow-auto border border-gray-300" >
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 bg-gray-100 border px-4 py-2">Game</th>
            {players.map(p => (
              <th key={p.id} className="sticky top-0 left-0 z-10 bg-gray-100 border px-4 py-2">
                {p.Name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {games.map((game, index) => (
            <tr key={game.id} className="even:bg-gray-50">
              <td className={`border px-4 py-2 bg-white ${
                  index === 0 ? "sticky top-10 z-20" : ""
                }`}>
                {new Date(game.created_at).toLocaleDateString()} {new Date(game.created_at).toLocaleTimeString()}
              </td>

              {players.map(player => (
                <td className={`border px-4 py-2 bg-white text-center ${
                  index === 0 ? "sticky top-10 z-20" : ""
                }`} key={player.id} >
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