/**
 * IterativeTotalLineChart Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Renders an interactive line chart showing each player's cumulative score
 * progression across all Tarot games (in chronological order).
 * 
 * Used on:
 * - Home page (app/page.tsx): Shows chart preview
 * - Full-page view (/charts/iterative/page.tsx): Shows expanded chart
 * 
 * WHAT IT DISPLAYS:
 * ──────────────────
 * X-axis: Game number (1, 2, 3, ...) - chronological sequence
 * Y-axis: Cumulative score for each player (sums all games up to that point)
 * Lines: One line per player, color-coded consistently across visit
 * 
 * FEATURES:
 * ─────────
 * - Interactive tooltips: hover over points to see exact scores
 * - Legend: Shows player names with color indicators
 * - Handles missing players: If player didn't participate in a game,
 *   line shows null (gap) at that point
 * - Responsive sizing: Maintains aspect ratio, adapts to container
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

\"use client\";\nimport { Players } from '@/utils/supabase/supabase';
import { on } from 'events';
import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, MouseHandlerDataParam } from 'recharts';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Games } from '../utils/supabase/supabase';
import { aggregateIterativeScores } from '@/lib/scoreUtils';

/**
 * getColorFromId: Maps player ID to consistent HSL color for the chart.
 * 
 * Each player gets a unique hue; saturation and lightness fixed for consistency.
 * Color is stable throughout the session and across all chart instances.
 * 
 * @param id - Player UUID
 * @param players - Array of all players (determines color pool size)
 * @returns HSL color string, e.g., \"hsl(90, 65%, 55%)\"
 */
export function getColorFromId(id: string,players: Players[]) {
  const colors = generateColors(players.length);

    const colorMap = Object.fromEntries(
  players.map((player, index) => [player.id, colors[index]])
);
    return colorMap[id] || 'hsl(0, 0%, 50%)'; // default to gray if id not found
}

/**
 * generateColors: Creates an array of N visually distinct HSL colors.
 * 
 * Distributes hues evenly across the color wheel (0-360 degrees).
 * Saturation=65%, Lightness=55% for balanced, readable colors.
 * 
 * @param count - Number of colors to generate
 * @returns Array of HSL color strings
 */
export function generateColors(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / count;
    return `hsl(${hue}, 65%, 55%)`;
  });
}
export  function IterativeTotalLineChart({ chartData ,players}: { chartData: Record<string, number | null>[] , players: Players[]}) {  
  /**
   * active state tracks which player lines are visible (for interactive toggles if added).
   * Currently all players shown by default.
   */
  const [active, setActive] = useState<boolean[]>(players.map(() => true));

  return (<div className="flex justify-center"  >
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
      {(
        <Tooltip
          cursor={{
            stroke: 'var(--color-border-2)',
          }}
          contentStyle={{
            backgroundColor: 'var(--color-surface-raised)',
          borderColor: 'var(--color-border-2)',
        }}

        />
      )}
      <Legend />
      {/* For each player, we create a line with a different color. The dataKey is the player id, and the name is the player name. The colors are defined in the CSS variables --color-chart-1, --color-chart-2, etc. */
      players.map((player, index) => (
        <Line
        key = {player.id}
        type="monotone"
        dataKey={player.Name}
        stroke={getColorFromId(player.id,players)}
        dot={{
          fill: 'var(--color-surface-base)'
        }}
        activeDot={{ r: 8, stroke: 'var(--color-surface-base)' }}
        
      />
      ))}
      
    </LineChart></div>);      }

export function IterativeTotalLineChartCanOpen({ chartData ,players}: { chartData: Record<string, number | null>[] , players: Players[]}) {  
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const handleMouseLeave = useMemo(() => () => setActiveIndex(-1), []);
  const handleMouseMove = useMemo(
    () =>
      ({ activeIndex }: MouseHandlerDataParam) =>
        setActiveIndex(Number(activeIndex ?? -1)),
    [],
  );
  return (<div className="flex justify-center" >
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
      <Legend
  
/>
      {/* For each player, we create a line with a different color. The dataKey is the player id, and the name is the player name. The colors are defined in the CSS variables --color-chart-1, --color-chart-2, etc. */
      players.map((player, index) => (
        <Line
        key = {player.id}
        type="monotone"
        dataKey={player.Name}
        stroke={getColorFromId(player.id,players)}
        dot={{
          fill: getColorFromId(player.id,players),
          //opacity : activeIndex === index ? 1 : 0.5,
        }}
         // onMouseEnter={() => setActiveIndex(index)}
        //onMouseLeave={handleMouseLeave}
        //strokeOpacity={activeIndex === index ? 1 : 0.5}
        //activeDot={{ r: 8, stroke: getColorFromId(player.id,players) }}
        
      />
      ))}
      
    </LineChart></div>);      }