import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, Save, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/Toast';

interface GlucoseRecord {
  id: string;
  valor_glicemia: number;
  horario_medicao: string;
  tipo_refeicao: string;
  observacoes: string | null;
  alerta_insulina: string;
}

const MEAL_TYPES = [
  'Jejum',
  'Pré-Almoço',
  'Pós-Almoço',
  'Lanche',
  'Jantar',
  'Ceia'
] as const;

const calculateInsulinAlert = (glucoseValue: number, mealType: string): string => {
  const isLunchTime = mealType === 'Pós-Almoço' || mealType === 'Pré-Almoço';

  if (glucoseValue < 70) {
    return 'Glicemia muito baixa. Ingerir açúcar imediatamente.';
  }

  if (isLunchTime) {
    if (glucoseValue > 251) {
      return 'Glicemia muito alta. Aplicar 3 unidades de insulina.';
    }
    if (glucoseValue >= 140) {
      return 'Glicemia alta. Aplicar 2 unidades de insulina.';
    }
    return 'Aplicar 1 unidade de insulina.';
  }

  if (glucoseValue > 251) {
    return 'Glicemia muito alta. Aplicar 2 unidades de insulina.';
  }
  if (glucoseValue >= 140) {
    return 'Glicemia alta. Aplicar 1 unidade de insulina.';
  }
  return 'Glicemia normal. Não aplicar insulina.';
};

export const GlucoseLog = () => {
  const { user } = useAuth();
  const [glucoseValue, setGlucoseValue] = useState<string>('');
  const [measurementTime, setMeasurementTime] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>('Jejum');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<GlucoseRecord[]>([]);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('glicemia_registros')
        .select('*')
        .eq('user_id', user.id)
        .order('horario_medicao', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToast({
        show: true,
        message: 'Você precisa estar logado para salvar registros',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const glucoseNumber = parseInt(glucoseValue, 10);
      const alertaInsulina = calculateInsulinAlert(glucoseNumber, mealType);

      const { error } = await supabase.from('glicemia_registros').insert({
        user_id: user.id,
        valor_glicemia: glucoseNumber,
        horario_medicao: parseISO(measurementTime).toISOString(),
        tipo_refeicao: mealType,
        observacoes: notes || null,
        alerta_insulina: alertaInsulina,
      });

      if (error) throw error;

      setToast({
        show: true,
        message: 'Registro salvo com sucesso!',
        type: 'success',
      });

      // Reset form
      setGlucoseValue('');
      setMeasurementTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setMealType('Jejum');
      setNotes('');

      // Refresh records
      fetchRecords();
    } catch (err) {
      console.error('Error saving record:', err);
      setToast({
        show: true,
        message: err instanceof Error ? err.message : 'Erro ao salvar o registro',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (value: number) => {
    if (value < 70) return 'text-red-500';
    if (value > 180) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6 pb-20">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Registro de Glicemia</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 space-y-6">
            <div>
              <label htmlFor="glucose" className="block text-lg font-medium mb-2">
                Valor da Glicemia (mg/dL)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="glucose"
                  value={glucoseValue}
                  onChange={(e) => setGlucoseValue(e.target.value)}
                  className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Digite o valor da glicemia"
                  required
                />
                <Activity className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="meal-type" className="block text-lg font-medium mb-2">
                Tipo de Refeição
              </label>
              <select
                id="meal-type"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as typeof MEAL_TYPES[number])}
                className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="measurement-time" className="block text-lg font-medium mb-2">
                Horário da Medição
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="measurement-time"
                  value={measurementTime}
                  onChange={(e) => setMeasurementTime(e.target.value)}
                  className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
                <Clock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-lg font-medium mb-2">
                Observações (opcional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Adicione observações relevantes"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg text-white font-medium text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Glicemia</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Últimos Registros</h2>
          </div>

          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-dark-300 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${getAlertColor(record.valor_glicemia)}`}>
                    {record.valor_glicemia} mg/dL
                  </span>
                  <span className="text-sm text-gray-400">
                    {format(parseISO(record.horario_medicao), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>{record.tipo_refeicao}</span>
                </div>
                {record.alerta_insulina && (
                  <div className="flex items-start space-x-2 text-sm bg-dark-400 rounded p-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{record.alerta_insulina}</span>
                  </div>
                )}
                {record.observacoes && (
                  <p className="text-sm text-gray-400">{record.observacoes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};