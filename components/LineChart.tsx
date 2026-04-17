import {Players} from '../utils/supabase/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
/**
 * aggregateScoresToChartData(aggregatedScores, players, colors)
 * 
 * Converts aggregateIterativeScores output to Chart.js ChartData format.
 * 
 * @param aggregatedScores - Output from aggregateIterativeScores()
 * @param players - All players from database
 * @param colors - Optional color map: Record<playerId, colorString>
 * @returns ChartData ready for react-chartjs-2 Line component
 */
export function aggregateScoresToChartData(
  aggregatedScores: Record<string, number | null>[],
  players: Players[],
  colors?: Record<string, string>
): ChartData<'line'> {
  return {
    labels: aggregatedScores.map((row) => String(row.gameNumber || '')),
    datasets: players.map((player) => ({
      label: player.Name,
      data: aggregatedScores.map((row) => row[player.Name] ?? null),
      borderColor: colors?.[player.id] || `hsl(${Math.random() * 360}, 65%, 55%)`,
      tension: 0.4,
      fill: false,
    })),
  };
}

export function LineChart({ data, players }: { data: Record<string, number | null>[], players: Players[] }) {
    const chartData = aggregateScoresToChartData(data, players);
    return <Line data={chartData} />
}