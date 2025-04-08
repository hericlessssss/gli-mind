import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, Save, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/Toast';
import { getGlucoseAlert } from '../utils/glucoseAlerts';

interface GlucoseRecord {
  id: string;
  glucose_level: number;
  timestamp: string;
  meal_type: string;
  insulin_applied: boolean;
  insulin_units: number | null;
  meal_items: Array<{
    name: string;
    is_custom: boolean;
    high_glycemic: boolean;
    category: string;
  }>;
  notes: string | null;
}

const MEAL_TYPES = [
  'fasting',
  'pre_breakfast',
  'post_breakfast',
  'pre_lunch',
  'post_lunch',
  'pre_dinner',
  'post_dinner',
  'bedtime'
] as const;

const MEAL_TYPE_LABELS: Record<typeof MEAL_TYPES[number], string> = {
  fasting: 'Ao acordar',
  pre_breakfast: 'Pré café da manhã',
  post_breakfast: 'Pós café da manhã',
  pre_lunch: 'Pré almoço',
  post_lunch: 'Pós almoço',
  pre_dinner: 'Pré jantar',
  post_dinner: 'Pós jantar',
  bedtime: 'Antes de dormir'
};

const foodItems = [
  // Café da manhã
  { name: 'Pão integral', category: 'Café da manhã', highGlycemic: false },
  { name: 'Aveia', category: 'Café da manhã', highGlycemic: false },
  { name: 'Ovos mexidos', category: 'Café da manhã', highGlycemic: false },
  { name: 'Iogurte sem açúcar', category: 'Café da manhã', highGlycemic: false },
  { name: 'Café preto sem açúcar', category: 'Bebidas', highGlycemic: false },
  { name: 'Leite desnatado', category: 'Bebidas', highGlycemic: false },

  // Frutas
  { name: 'Mamão', category: 'Frutas', highGlycemic: false },
  { name: 'Banana', category: 'Frutas', highGlycemic: true },
  { name: 'Maçã', category: 'Frutas', highGlycemic: false },
  { name: 'Pera', category: 'Frutas', highGlycemic: false },
  { name: 'Abacate', category: 'Frutas', highGlycemic: false },

  // Almoço/Jantar
  { name: 'Arroz integral', category: 'Grãos', highGlycemic: false },
  { name: 'Feijão', category: 'Proteínas', highGlycemic: false },
  { name: 'Frango grelhado', category: 'Proteínas', highGlycemic: false },
  { name: 'Peixe assado', category: 'Proteínas', highGlycemic: false },
  
  // Vegetais
  { name: 'Salada verde', category: 'Vegetais', highGlycemic: false },
  { name: 'Brócolis cozido', category: 'Vegetais', highGlycemic: false },
  { name: 'Abobrinha', category: 'Vegetais', highGlycemic: false },
  { name: 'Cenoura crua', category: 'Vegetais', highGlycemic: false },

  // Oleaginosas
  { name: 'Castanhas', category: 'Oleaginosas', highGlycemic: false },
  { name: 'Amêndoas', category: 'Oleaginosas', highGlycemic: false },

  // Bebidas
  { name: 'Suco natural sem açúcar', category: 'Bebidas', highGlycemic: false },
  { name: 'Chá sem açúcar', category: 'Bebidas', highGlycemic: false },
  { name: 'Água', category: 'Bebidas', highGlycemic: false },
];

export const GlucoseLog = () => {
  const { user } = useAuth();
  const [glucoseLevel, setGlucoseLevel] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>('fasting');
  const [insulinApplied, setInsulinApplied] = useState<boolean>(false);
  const [insulinUnits, setInsulinUnits] = useState<string>('');
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [customFoods, setCustomFoods] = useState<string[]>([]);
  const [newCustomFood, setNewCustomFood] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<GlucoseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
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
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    }
  };

  const handleGlucoseLevelChange = (value: string) => {
    setGlucoseLevel(value);
    if (value) {
      const level = parseInt(value, 10);
      const alert = getGlucoseAlert(level, timestamp);
      if (alert.insulinUnits) {
        setInsulinApplied(true);
        setInsulinUnits(alert.insulinUnits.toString());
      }
    }
  };

  const ensureUserProfile = async () => {
    if (!user?.id || !user?.email) {
      throw new Error('Usuário não autenticado');
    }

    // Check if profile exists
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
      throw fetchError;
    }

    // If profile doesn't exist, create it
    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
        });

      if (insertError) {
        throw insertError;
      }
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
      // Ensure user profile exists before inserting glucose reading
      await ensureUserProfile();

      const mealItems = [
        ...selectedFoods.map(name => ({
          name,
          is_custom: false,
          high_glycemic: foodItems.find(f => f.name === name)?.highGlycemic || false,
          category: foodItems.find(f => f.name === name)?.category || 'Outros'
        })),
        ...customFoods.map(name => ({
          name,
          is_custom: true,
          high_glycemic: false,
          category: 'Personalizado'
        }))
      ];

      const { error } = await supabase.from('glucose_readings').insert({
        user_id: user.id,
        glucose_level: parseInt(glucoseLevel, 10),
        timestamp: parseISO(timestamp).toISOString(),
        meal_type: mealType,
        insulin_applied: insulinApplied,
        insulin_units: insulinApplied ? parseFloat(insulinUnits) : null,
        meal_items: mealItems,
        notes: notes || null,
      });

      if (error) throw error;

      setToast({
        show: true,
        message: 'Registro salvo com sucesso!',
        type: 'success',
      });

      // Reset form
      setGlucoseLevel('');
      setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setMealType('fasting');
      setInsulinApplied(false);
      setInsulinUnits('');
      setSelectedFoods([]);
      setCustomFoods([]);
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

  const filteredFoodItems = foodItems.filter(
    food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomFood = () => {
    if (newCustomFood.trim()) {
      setCustomFoods(prev => [...prev, newCustomFood.trim()]);
      setNewCustomFood('');
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
        <h1 className="text-2xl font-bold">Registro Unificado</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 space-y-6">
            {/* Glucose Level */}
            <div>
              <label htmlFor="glucose" className="block text-lg font-medium mb-2">
                Valor da Glicemia (mg/dL)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="glucose"
                  value={glucoseLevel}
                  onChange={(e) => handleGlucoseLevelChange(e.target.value)}
                  className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Digite o valor da glicemia"
                  required
                />
                <Activity className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
              {glucoseLevel && (
                <div className="mt-2">
                  {(() => {
                    const alert = getGlucoseAlert(parseInt(glucoseLevel, 10), timestamp);
                    return (
                      <div
                        className={`p-3 rounded-lg flex items-start space-x-2 ${
                          alert.type === 'danger'
                            ? 'bg-red-900/50 text-red-100'
                            : alert.type === 'warning'
                            ? 'bg-yellow-900/50 text-yellow-100'
                            : 'bg-green-900/50 text-green-100'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          {alert.recommendation && (
                            <p className="text-sm mt-1 opacity-90">{alert.recommendation}</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Meal Type */}
            <div>
              <label htmlFor="meal-type" className="block text-lg font-medium mb-2">
                Momento do Dia
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
                    {MEAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Timestamp */}
            <div>
              <label htmlFor="timestamp" className="block text-lg font-medium mb-2">
                Horário da Medição
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="timestamp"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
                <Clock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Insulin Application */}
            <div className="space-y-3">
              <label className="block text-lg font-medium">Aplicação de Insulina</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="insulin-applied"
                  checked={insulinApplied}
                  onChange={(e) => {
                    setInsulinApplied(e.target.checked);
                    if (!e.target.checked) {
                      setInsulinUnits('');
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="insulin-applied" className="text-sm">
                  Insulina aplicada
                </label>
              </div>
              {insulinApplied && (
                <div>
                  <label htmlFor="insulin-units" className="block text-sm font-medium mb-1">
                    Unidades de Insulina
                  </label>
                  <input
                    type="number"
                    id="insulin-units"
                    value={insulinUnits}
                    onChange={(e) => setInsulinUnits(e.target.value)}
                    step="0.5"
                    min="0"
                    max="10"
                    className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required={insulinApplied}
                  />
                </div>
              )}
            </div>

            {/* Food Selection */}
            <div className="space-y-3">
              <label className="block text-lg font-medium">Alimentos Consumidos</label>
              <input
                type="text"
                placeholder="Pesquisar alimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredFoodItems.map((food) => (
                  <div
                    key={food.name}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedFoods.includes(food.name)
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-300 hover:bg-dark-400'
                    }`}
                    onClick={() => {
                      setSelectedFoods((prev) =>
                        prev.includes(food.name)
                          ? prev.filter((f) => f !== food.name)
                          : [...prev, food.name]
                      );
                    }}
                  >
                    <div className="text-sm font-medium">{food.name}</div>
                    <div className="text-xs opacity-75">{food.category}</div>
                  </div>
                ))}
              </div>

              {/* Custom Food Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomFood}
                  onChange={(e) => setNewCustomFood(e.target.value)}
                  placeholder="Adicionar alimento personalizado"
                  className="flex-1 p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFood}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white"
                >
                  Adicionar
                </button>
              </div>

              {/* Custom Foods List */}
              {customFoods.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Alimentos Personalizados</label>
                  <div className="flex flex-wrap gap-2">
                    {customFoods.map((food, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-dark-300 rounded-full"
                      >
                        <span className="text-sm">{food}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFoods((prev) => prev.filter((_, i) => i !== index));
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-lg font-medium mb-2">
                Observações
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                rows={3}
                placeholder="Adicione observações relevantes"
              />
            </div>

            {/* Submit Button */}
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
                  <span>Salvar Registro</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Recent Records */}
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
                  <span className={`text-xl font-bold ${getAlertColor(record.glucose_level)}`}>
                    {record.glucose_level} mg/dL
                  </span>
                  <span className="text-sm text-gray-400">
                    {format(parseISO(record.timestamp), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>{MEAL_TYPE_LABELS[record.meal_type as typeof MEAL_TYPES[number]]}</span>
                  {record.insulin_applied && (
                    <span>• {record.insulin_units} unidades de insulina</span>
                  )}
                </div>
                {record.meal_items && record.meal_items.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {record.meal_items.map((item, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.high_glycemic
                            ? 'bg-yellow-900/50 text-yellow-200'
                            : item.is_custom
                            ? 'bg-primary-900/50 text-primary-200'
                            : 'bg-dark-400 text-gray-300'
                        }`}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
                {record.notes && (
                  <p className="text-sm text-gray-400">{record.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};