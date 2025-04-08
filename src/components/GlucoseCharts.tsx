import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GlucoseReading {
  glucose_level: number;
  timestamp: string;
  meal_type: string;
}

interface GlucoseChartsProps {
  readings: GlucoseReading[];
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  fasting: 'Ao acordar',
  pre_breakfast: 'Pré café',
  post_breakfast: 'Pós café',
  pre_lunch: 'Pré almoço',
  post_lunch: 'Pós almoço',
  pre_dinner: 'Pré jantar',
  post_dinner: 'Pós jantar',
  bedtime: 'Antes de dormir'
};

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#9ca3af',
        font: {
          family: "'Inter', sans-serif",
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      titleColor: '#fff',
      bodyColor: '#9ca3af',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      bodyFont: {
        family: "'Inter', sans-serif",
      },
      titleFont: {
        family: "'Inter', sans-serif",
        weight: 'bold',
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(75, 85, 99, 0.2)',
      },
      ticks: {
        color: '#9ca3af',
        font: {
          family: "'Inter', sans-serif",
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(75, 85, 99, 0.2)',
      },
      ticks: {
        color: '#9ca3af',
        font: {
          family: "'Inter', sans-serif",
        },
      },
      min: 40,
      max: 300,
      beginAtZero: false,
    },
  },
};

export const GlucoseCharts: React.FC<GlucoseChartsProps> = ({ readings }) => {
  const sortedReadings = useMemo(() => {
    return [...readings].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [readings]);

  const lineChartData = useMemo(() => {
    const labels = sortedReadings.map(reading => 
      format(parseISO(reading.timestamp), 'dd/MM HH:mm')
    );

    return {
      labels,
      datasets: [
        {
          label: 'Glicemia',
          data: sortedReadings.map(reading => reading.glucose_level),
          borderColor: 'rgb(0, 163, 255)',
          backgroundColor: 'rgba(0, 163, 255, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Limite Superior',
          data: Array(labels.length).fill(180),
          borderColor: 'rgba(249, 57, 99, 0.5)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Limite Inferior',
          data: Array(labels.length).fill(70),
          borderColor: 'rgba(249, 57, 99, 0.5)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [sortedReadings]);

  const mealTypeAverages = useMemo(() => {
    const mealTypeGroups: Record<string, number[]> = {};
    readings.forEach(reading => {
      if (!mealTypeGroups[reading.meal_type]) {
        mealTypeGroups[reading.meal_type] = [];
      }
      mealTypeGroups[reading.meal_type].push(reading.glucose_level);
    });

    const averages: Record<string, number> = {};
    Object.entries(mealTypeGroups).forEach(([mealType, levels]) => {
      averages[mealType] = Math.round(
        levels.reduce((sum, level) => sum + level, 0) / levels.length
      );
    });

    return averages;
  }, [readings]);

  const barChartData: ChartData<'bar'> = {
    labels: Object.keys(mealTypeAverages).map(type => MEAL_TYPE_LABELS[type]),
    datasets: [
      {
        label: 'Média por Período',
        data: Object.values(mealTypeAverages),
        backgroundColor: Object.values(mealTypeAverages).map(value => 
          value > 180 ? 'rgba(249, 57, 99, 0.7)' :
          value < 70 ? 'rgba(249, 57, 99, 0.7)' :
          'rgba(0, 163, 255, 0.7)'
        ),
        borderColor: Object.values(mealTypeAverages).map(value => 
          value > 180 ? 'rgb(249, 57, 99)' :
          value < 70 ? 'rgb(249, 57, 99)' :
          'rgb(0, 163, 255)'
        ),
        borderWidth: 1,
      },
    ],
  };

  if (readings.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <p className="text-gray-400">
          Nenhum dado disponível para exibir os gráficos.
          Registre suas medições de glicemia para visualizar as estatísticas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução da Glicemia</h3>
        <div className="h-[300px]">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Média por Período</h3>
        <div className="h-[300px]">
          <Bar 
            data={barChartData} 
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                x: {
                  ...chartOptions.scales?.x,
                  ticks: {
                    ...chartOptions.scales?.x?.ticks,
                    maxRotation: 45,
                    minRotation: 45,
                  },
                },
              },
            }} 
          />
        </div>
      </div>
    </div>
  );
};