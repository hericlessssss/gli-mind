import React, { useEffect, useState } from 'react';
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
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Activity,
  AlertTriangle,
  Plus,
  ChevronRight,
  UtensilsCrossed,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Welcome } from '../components/Welcome';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GlucoseRecord {
  id: string;
  valor_glicemia: number;
  horario_medicao: string;
  tipo_refeicao: string;
  alerta_insulina: string;
}

interface MealRecord {
  id: string;
  timestamp: string;
  meal_items: {
    name: string;
    high_glycemic: boolean;
  }[];
}

interface GlucoseStats {
  average: number;
  min: number;
  max: number;
  inRange: number;
  total: number;
  byMealType: {
    [key: string]: {
      count: number;
      avg: number;
    };
  };
  distribution: {
    veryLow: number;
    low: number;
    normal: number;
    high: number;
    veryHigh: number;
  };
}

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lastGlucose, setLastGlucose] = useState<GlucoseRecord | null>(null);
  const [lastMeal, setLastMeal] = useState<MealRecord | null>(null);
  const [glucoseHistory, setGlucoseHistory] = useState<GlucoseRecord[]>([]);
  const [glucoseStats, setGlucoseStats] = useState<GlucoseStats | null>(null);
  const [needsCheck, setNeedsCheck] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, selectedPeriod]);

  const calculateGlucoseStats = (records: GlucoseRecord[]): GlucoseStats => {
    if (!records.length) {
      return {
        average: 0,
        min: 0,
        max: 0,
        inRange: 0,
        total: 0,
        byMealType: {},
        distribution: {
          veryLow: 0,
          low: 0,
          normal: 0,
          high: 0,
          veryHigh: 0,
        },
      };
    }

    const values = records.map(r => r.valor_glicemia);
    const inRange = records.filter(r => r.valor_glicemia >= 70 && r.valor_glicemia <= 180).length;

    // Calculate distribution
    const distribution = records.reduce(
      (acc, record) => {
        const value = record.valor_glicemia;
        if (value < 54) acc.veryLow++;
        else if (value < 70) acc.low++;
        else if (value <= 180) acc.normal++;
        else if (value <= 250) acc.high++;
        else acc.veryHigh++;
        return acc;
      },
      { veryLow: 0, low: 0, normal: 0, high: 0, veryHigh: 0 }
    );

    const byMealType = records.reduce((acc, record) => {
      if (!acc[record.tipo_refeicao]) {
        acc[record.tipo_refeicao] = { count: 0, sum: 0 };
      }
      acc[record.tipo_refeicao].count++;
      acc[record.tipo_refeicao].sum += record.valor_glicemia;
      return acc;
    }, {} as { [key: string]: { count: number; sum: number } });

    // Convert sums to averages
    const mealTypeStats = Object.entries(byMealType).reduce((acc, [type, stats]) => {
      acc[type] = {
        count: stats.count,
        avg: Math.round(stats.sum / stats.count),
      };
      return acc;
    }, {} as { [key: string]: { count: number; avg: number } });

    return {
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      inRange,
      total: records.length,
      byMealType: mealTypeStats,
      distribution,
    };
  };

  const fetchDashboardData = async () => {
    try {
      const periodDays = selectedPeriod === '24h' ? 1 : selectedPeriod === '7d' ? 7 : 30;
      const startDate = subDays(new Date(), periodDays);

      // Fetch glucose history
      const { data: glucoseHistoryData } = await supabase
        .from('glicemia_registros')
        .select('*')
        .eq('user_id', user?.id)
        .gte('horario_medicao', startDate.toISOString())
        .order('horario_medicao', { ascending: true });

      // Fetch last glucose reading
      const { data: lastGlucoseData } = await supabase
        .from('glicemia_registros')
        .select('*')
        .eq('user_id', user?.id)
        .order('horario_medicao', { ascending: false })
        .limit(1)
        .single();

      // Fetch last meal
      const { data: lastMealData } = await supabase
        .from('meals')
        .select(`
          id,
          timestamp,
          meal_items (
            name,
            high_glycemic
          )
        `)
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      setGlucoseHistory(glucoseHistoryData || []);
      setLastGlucose(lastGlucoseData);
      setLastMeal(lastMealData);
      setGlucoseStats(calculateGlucoseStats(glucoseHistoryData || []));

      // Check if needs new measurement
      if (lastGlucoseData) {
        const lastMeasurement = parseISO(lastGlucoseData.horario_medicao);
        const hoursSinceLastMeasurement = Math.abs(new Date().getTime() - lastMeasurement.getTime()) / 36e5;
        setNeedsCheck(hoursSinceLastMeasurement > 6);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGlucoseStatus = (value: number) => {
    if (value < 70) return { color: 'text-red-500', icon: TrendingDown, text: 'Hipoglicemia' };
    if (value > 180) return { color: 'text-yellow-500', icon: TrendingUp, text: 'Hiperglicemia' };
    return { color: 'text-green-500', icon: Activity, text: 'Normal' };
  };

  const glucoseChartData = {
    labels: glucoseHistory.map(record => format(parseISO(record.horario_medicao), 'dd/MM HH:mm')),
    datasets: [
      {
        label: 'Glicemia (mg/dL)',
        data: glucoseHistory.map(record => record.valor_glicemia),
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Limite Superior',
        data: glucoseHistory.map(() => 180),
        borderColor: 'rgba(234, 179, 8, 0.5)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Limite Inferior',
        data: glucoseHistory.map(() => 70),
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const mealTypeData = {
    labels: Object.keys(glucoseStats?.byMealType || {}),
    datasets: [
      {
        label: 'Média de Glicemia',
        data: Object.values(glucoseStats?.byMealType || {}).map(stat => stat.avg),
        backgroundColor: [
          'rgba(14, 165, 233, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
      },
    ],
  };

  const distributionData = {
    labels: ['Muito Baixa (<54)', 'Baixa (54-69)', 'Normal (70-180)', 'Alta (181-250)', 'Muito Alta (>250)'],
    datasets: [
      {
        label: 'Quantidade de Medições',
        data: glucoseStats ? [
          glucoseStats.distribution.veryLow,
          glucoseStats.distribution.low,
          glucoseStats.distribution.normal,
          glucoseStats.distribution.high,
          glucoseStats.distribution.veryHigh,
        ] : [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',   // Vermelho - Muito Baixa
          'rgba(234, 179, 8, 0.7)',   // Amarelo - Baixa
          'rgba(34, 197, 94, 0.7)',   // Verde - Normal
          'rgba(234, 179, 8, 0.7)',   // Amarelo - Alta
          'rgba(239, 68, 68, 0.7)',   // Vermelho - Muito Alta
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.max(0, (glucoseStats?.min || 0) - 20),
        max: (glucoseStats?.max || 0) + 20,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  const distributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = glucoseStats?.total || 0;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${value} medições (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <Welcome />
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/glucose')}
          className="flex items-center justify-center gap-2 p-4 bg-primary-600 hover:bg-primary-700 rounded-lg text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Glicemia</span>
        </button>
        <button
          onClick={() => navigate('/meals')}
          className="flex items-center justify-center gap-2 p-4 bg-primary-600 hover:bg-primary-700 rounded-lg text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Refeição</span>
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 bg-gray-900 rounded-lg p-2">
        {[
          { value: '24h', label: '24h', icon: Clock },
          { value: '7d', label: '7 dias', icon: Calendar },
          { value: '30d', label: '30 dias', icon: Calendar },
        ].map(period => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              selectedPeriod === period.value
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-dark-400'
            }`}
          >
            <period.icon className="w-4 h-4" />
            <span>{period.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Target className="w-5 h-5 text-primary-400" />
            <span className="text-sm text-gray-400">Média</span>
          </div>
          <p className="text-2xl font-bold mt-2">{glucoseStats?.average || 0} mg/dL</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <ArrowUpRight className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Máxima</span>
          </div>
          <p className="text-2xl font-bold mt-2">{glucoseStats?.max || 0} mg/dL</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <ArrowDownRight className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">Mínima</span>
          </div>
          <p className="text-2xl font-bold mt-2">{glucoseStats?.min || 0} mg/dL</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">No Alvo</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {glucoseStats ? Math.round((glucoseStats.inRange / glucoseStats.total) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Latest Measurements */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Latest Glucose */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Última Medição</h2>
          {lastGlucose ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold ${getGlucoseStatus(lastGlucose.valor_glicemia).color}`}>
                    {lastGlucose.valor_glicemia} mg/dL
                  </p>
                  <p className="text-sm text-gray-400">
                    {format(parseISO(lastGlucose.horario_medicao), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getGlucoseStatus(lastGlucose.valor_glicemia).color} bg-opacity-20`}>
                  {React.createElement(getGlucoseStatus(lastGlucose.valor_glicemia).icon, { className: 'w-6 h-6' })}
                </div>
              </div>
              {lastGlucose.alerta_insulina && (
                <div className="flex items-start space-x-2 text-sm bg-dark-400 rounded p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{lastGlucose.alerta_insulina}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Nenhuma medição registrada</p>
          )}
        </div>

        {/* Latest Meal */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Última Refeição</h2>
          {lastMeal ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {format(parseISO(lastMeal.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                <UtensilsCrossed className="w-5 h-5 text-primary-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                {lastMeal.meal_items.map((item, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.high_glycemic
                        ? 'bg-yellow-900/50 text-yellow-200'
                        : 'bg-dark-400 text-gray-300'
                    }`}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Nenhuma refeição registrada</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {needsCheck && (
        <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0" />
          <p>Já se passaram mais de 6 horas desde sua última medição. Considere verificar sua glicemia.</p>
        </div>
      )}

      {lastGlucose && (lastGlucose.valor_glicemia < 70 || lastGlucose.valor_glicemia > 250) && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <p className="font-semibold">Atenção! Sua glicemia está {lastGlucose.valor_glicemia < 70 ? 'muito baixa' : 'muito alta'}.</p>
            <p className="text-sm mt-1">{lastGlucose.alerta_insulina}</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Glucose Chart */}
        <div className="bg-gray-900 rounded-lg p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Histórico de Glicemia</h2>
            <button
              onClick={() => navigate('/glucose')}
              className="flex items-center text-primary-400 hover:text-primary-300"
            >
              Ver mais
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="h-64">
            <Line data={glucoseChartData} options={chartOptions} />
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Distribuição da Glicemia</h2>
          <div className="h-64">
            <Bar data={distributionData} options={distributionOptions} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 rounded bg-red-900/30 text-red-200">
              Hipoglicemia
              <br />
              {glucoseStats ? Math.round(((glucoseStats.distribution.veryLow + glucoseStats.distribution.low) / glucoseStats.total) * 100) : 0}%
            </div>
            <div className="p-2 rounded bg-green-900/30 text-green-200">
              Normal
              <br />
              {glucoseStats ? Math.round((glucoseStats.distribution.normal / glucoseStats.total) * 100) : 0}%
            </div>
            <div className="p-2 rounded bg-yellow-900/30 text-yellow-200">
              Hiperglicemia
              <br />
              {glucoseStats ? Math.round(((glucoseStats.distribution.high + glucoseStats.distribution.veryHigh) / glucoseStats.total) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Meal Type Chart */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Média por Refeição</h2>
          <div className="h-64">
            <Bar
              data={mealTypeData}
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};