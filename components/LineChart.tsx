"use client"
import { Players} from '../utils/supabase/types';
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
import { getDefaultPlayerColor } from "@/lib/playerColors";

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
  lastPlayers: Players[],
  colors?: Record<string, string>
): ChartData<'line'> {
  return {
    labels: aggregatedScores.map((row) => String(row.gameNumber || '')),
    datasets: players.map((player) => ({
      label: player.Name,
      data: aggregatedScores.map((row) => row[player.Name] ?? null),
      borderColor: colors?.[player.id] || getDefaultPlayerColor(player, players),
      tension: 0.4,
      fill: false,
      hidden:lastPlayers.some((p) => p.id === player.id) ? false : true, // Hide lines for players not in lastPlayers
    })
  )
  };
}

export default function LineChart({ data, players,lastPlayers,zoomIndex=10}:{ data: Record<string, number | null>[], players: Players[],lastPlayers: Players[],zoomIndex:number|null  }) {
    const chartData = aggregateScoresToChartData(data, players,lastPlayers);
    const visiblePoints:number | null = zoomIndex;
    if ( chartData["labels"]){
    return <Line  data={chartData} options={{responsive: true, maintainAspectRatio:false,
    scales: {
      x: {
        min: chartData["labels"].length - (visiblePoints ?? chartData["labels"].length),
        max: chartData["labels"].length - 1,
        grid: { color: "#9ca3af" },
        ticks: { color: "#d1d5db" },
        border: { color: "#d1d5db" },
      },
      y: {
        grid: { color: "#9ca3af" },
        ticks: { color: "#d1d5db" },
        border: { color: "#d1d5db" },
      },
    }, plugins: {
      legend: {
        labels: {
          color: "#ededed",
          font: { size: 16 },
          boxWidth: 0,
          boxHeight: 0,
          generateLabels: chart => ChartJS.defaults.plugins.legend.labels.generateLabels(chart)
            .map(item => ({
              ...item,
              fontColor: typeof item.datasetIndex === "number"
                ? String(chart.data.datasets[item.datasetIndex].borderColor ?? "#ededed")
                : "#ededed",
              fillStyle: "rgba(0, 0, 0, 0)",
              strokeStyle: "rgba(0, 0, 0, 0)",
              lineWidth: 0,
            })),
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#ededed",
        bodyColor: "#ededed",
        borderColor: "#9ca3af",
        borderWidth: 1,
      },
      zoom: { pan: { enabled: true ,mode:'x'}, zoom: { mode:'x' ,wheel:{enabled:true},pinch:{enabled:true}} },
    }
  }}/> }
}