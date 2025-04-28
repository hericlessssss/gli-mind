import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, TrendingDown, Clock, Plus, FileDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Welcome } from '../components/Welcome';
import { GlucoseCharts } from '../components/GlucoseCharts';
import { InsulinChart } from '../components/InsulinChart';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Lazy load PDF components
const PDFComponents = React.lazy(() => import('../components/PDFComponents'));

interface GlucoseReading {
  id: string;
  glucose_level: number;
  timestamp: string;
  meal_type: string;
  insulin_applied: boolean;
  insulin_units: number | null;
  meal_items?: Array<{
    name: string;
    high_glycemic: boolean;
  }>;
  notes?: string | null;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  fasting: 'Ao acordar',
  pre_breakfast: 'Pré café da manhã',
  post_breakfast: 'Pós café da manhã',
  pre_lunch: 'Pré almoço',
  post_lunch: 'Pós almoço',
  pre_dinner: 'Pré jantar',
  post_dinner: 'Pós jantar',
  bedtime: 'Antes de dormir'
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentReadings, setRecentReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 999,
    total: 0,
    totalInsulin: 0
  });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) {
      fetchRecentReadings();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
        setUserName(fullName || user?.email?.split('@')[0] || 'Usuário');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchRecentReadings = async () => {
    try {
      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setRecentReadings(data || []);

      if (data && data.length > 0) {
        const glucoseLevels = data.map(reading => reading.glucose_level);
        const totalInsulin = data.reduce((sum, reading) => sum + (reading.insulin_units || 0), 0);
        
        setStats({
          average: Math.round(glucoseLevels.reduce((a, b) => a + b, 0) / glucoseLevels.length),
          highest: Math.max(...glucoseLevels),
          lowest: Math.min(...glucoseLevels),
          total: data.length,
          totalInsulin: totalInsulin
        });
      }
    } catch (err) {
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGlucoseStatus = (level: number) => {
    if (level < 70) return { color: 'text-red-500', icon: TrendingDown };
    if (level > 180) return { color: 'text-yellow-500', icon: TrendingUp };
    return { color: 'text-green-500', icon: Activity };
  };

  const handleReadingClick = (reading: GlucoseReading) => {
    navigate('/glucose', { state: { selectedReading: reading } });
  };

  return (
    <div className="space-y-6 pb-20">
      <Welcome />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/glucose')}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Registro de Glicemia</span>
            </button>

            {!loading && recentReadings.length > 0 && (
              <Suspense fallback={
                <button className="w-full flex items-center justify-center space-x-2 p-4 bg-accent-600 rounded-lg text-white font-medium">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Carregando PDF...</span>
                </button>
              }>
                <PDFComponents
                  readings={recentReadings}
                  stats={stats}
                  userName={userName}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Estatísticas Gerais</h2>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats.total > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-300 rounded-lg p-4">
                <p className="text-sm text-gray-400">Média</p>
                <p className="text-2xl font-bold">{stats.average} mg/dL</p>
              </div>
              <div className="bg-dark-300 rounded-lg p-4">
                <p className="text-sm text-gray-400">Total de Medições</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-dark-300 rounded-lg p-4">
                <p className="text-sm text-gray-400">Mais Alta</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.highest} mg/dL</p>
              </div>
              <div className="bg-dark-300 rounded-lg p-4">
                <p className="text-sm text-gray-400">Mais Baixa</p>
                <p className="text-2xl font-bold text-red-500">{stats.lowest} mg/dL</p>
              </div>
              <div className="col-span-2 bg-dark-300 rounded-lg p-4">
                <p className="text-sm text-gray-400">Total de Insulina</p>
                <p className="text-2xl font-bold text-accent-500">{stats.totalInsulin} unidades</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-4">
              Nenhum registro encontrado
            </p>
          )}
        </div>
      </div>

      {/* Charts */}
      <GlucoseCharts readings={recentReadings} />
      
      {/* Insulin Chart */}
      <InsulinChart readings={recentReadings} />

      {/* Recent Readings */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Registros Recentes</h2>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentReadings.length > 0 ? (
          <div className="space-y-4">
            {recentReadings.slice(0, 10).map(reading => {
              const status = getGlucoseStatus(reading.glucose_level);
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={reading.id}
                  onClick={() => handleReadingClick(reading)}
                  className="bg-dark-300 rounded-lg p-4 hover:bg-dark-400 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      <span className={`text-xl font-bold ${status.color}`}>
                        {reading.glucose_level} mg/dL
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {format(parseISO(reading.timestamp), 'dd/MM HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    <span>{MEAL_TYPE_LABELS[reading.meal_type]}</span>
                    {reading.insulin_applied && reading.insulin_units && (
                      <span className="ml-2">• {reading.insulin_units} un. insulina</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">Nenhum registro encontrado</p>
            <button
              onClick={() => navigate('/glucose')}
              className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
            >
              Registrar Primeira Medição
            </button>
          </div>
        )}
      </div>
    </div>
  );
};