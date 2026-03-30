"use client";
import { Players } from '@/utils/supabase/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


export function getColorFromId(id: string) {
  // 1. Hash the string → stable number
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 2. Map hash → hue (0–360)
  const hue = Math.abs(hash) % 360;

  // 3. Return nice HSL color
  return `hsl(${hue}, 65%, 55%)`;
}


export default function IterativeTotalLineChart({ chartData ,players}: { chartData: Record<string, any>[] , players: Players[] }) {
  return (
<LineChart
      style={{ width: '100%', maxWidth: '700px', height: '100%', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={chartData}
      margin={{
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-3)" />
      {/*<XAxis dataKey="gameNumber" stroke="var(--color-text-3)" />*/}
      <YAxis width="auto" stroke="var(--color-text-3)" />
      <Tooltip
        cursor={{
          stroke: 'var(--color-border-2)',
        }}
        contentStyle={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor: 'var(--color-border-2)',
        }}
      />
      <Legend />
      {/* For each player, we create a line with a different color. The dataKey is the player id, and the name is the player name. The colors are defined in the CSS variables --color-chart-1, --color-chart-2, etc. */
      players.map((player, index) => (
        <Line
        key = {player.id}
        type="monotone"
        dataKey={players[index].Name}
        stroke={getColorFromId(player.id)}
        dot={{
          fill: 'var(--color-surface-base)',
        }}
        activeDot={{ r: 8, stroke: 'var(--color-surface-base)' }}
      />
      ))}
      
    </LineChart>);      }