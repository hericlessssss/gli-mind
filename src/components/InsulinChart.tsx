import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GlucoseReading {
  insulin_units: number | null;
  timestamp: string;
  meal_type: string;
}

interface InsulinChartProps {
  readings: GlucoseReading[];
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  fasting: 'Ao acordar',
  pre_breakfast: 'Pré café',
  post_breakfast: 'Pós café',
  pre_lunch: 'Pré almoço',
  post_lunch: 'Pós almoço',
  afternoon_snack: 'Lanche',
  pre_dinner: 'Pré jantar',
  post_dinner: 'Pós jantar',
  supper: 'Ceia',
  post_supper: 'Pós ceia',
  bedtime: 'Antes de dormir'
};

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      titleColor: '#fff',
      bodyColor: '#9ca3af',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        title: (items) => {
          const item = items[0];
          return format(parseISO(item.label), 'dd/MM HH:mm');
        },
        label: (item) => {
          return `${item.formattedValue} unidades`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#9ca3af',
        maxRotation: 45,
        minRotation: 45
      }
    },
    y: {
      grid: {
        color: 'rgba(75, 85, 99, 0.2)'
      },
      ticks: {
        color: '#9ca3af'
      },
      beginAtZero: true
    }
  }
};

export const InsulinChart: React.FC<InsulinChartProps> = ({ readings }) => {
  const chartData = useMemo(() => {
    const filteredReadings = readings.filter(reading => reading.insulin_units !== null);
    
    return {
      labels: filteredReadings.map(reading => reading.timestamp),
      datasets: [
        {
          data: filteredReadings.map(reading => reading.insulin_units),
          backgroundColor: 'rgba(249, 57, 99, 0.7)',
          borderColor: 'rgb(249, 57, 99)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  }, [readings]);

  if (readings.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <p className="text-gray-400">
          Nenhum registro de insulina disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Uso de Insulina</h3>
      <div className="h-[300px]">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};