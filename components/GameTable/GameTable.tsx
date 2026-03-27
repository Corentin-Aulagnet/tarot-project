import { Games,Players } from "../../utils/supabase/supabase";
export type GameTableProps={
  games:Games[],
  players:Players[],
  table: Record<Games['id'], Record<Players['id'],number>>
}

export function GamesTable({ games, players, table }:GameTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse border w-full">
        <thead>
          <tr>
            <th className="border p-2">Game</th>
            {players.map(p => (
              <th key={p.id} className="border p-2">
                {p.Name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {games.map(game => (
            <tr key={game.id}>
              <td className="border p-2 font-medium">
                {game.id}
              </td>

              {players.map(player => (
                <td key={player.id} className="border p-2 text-center">
                  {table[game.id][player.id]?.toString() ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}