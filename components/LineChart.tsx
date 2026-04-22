"use client"
import {Players} from '../utils/supabase/supabase';
import { useEffect } from "react";
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
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
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

export default function LineChart({ data, players,zoomIndex=10}:{ data: Record<string, number | null>[], players: Players[],zoomIndex:number|null  }) {
    const chartData = aggregateScoresToChartData(data, players);
    const visiblePoints:number | null = zoomIndex;
    if ( chartData["labels"]){
    return <Line  data={chartData} options={{responsive: true, maintainAspectRatio:false,
    scales: {
      x: {
        min: chartData["labels"].length - (visiblePoints ?? chartData["labels"].length),
        max: chartData["labels"].length - 1
      }
    }, plugins: { zoom: { pan: { enabled: true ,mode:'x'}, zoom: { mode:'x' ,wheel:{enabled:true}} } } 
  }}/>}
}