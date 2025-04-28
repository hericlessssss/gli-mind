import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, Save, History, Filter, X, ChevronLeft, ChevronDown, ChevronUp, Eye, EyeOff, ChevronRight } from 'lucide-react';
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
  fasting: 'Ao acordar (Jejum)',
  pre_breakfast: 'Antes do café da manhã',
  post_breakfast: 'Depois do café da manhã',
  pre_lunch: 'Antes do almoço',
  post_lunch: 'Depois do almoço',
  pre_dinner: 'Antes do jantar',
  post_dinner: 'Depois do jantar',
  bedtime: 'Antes de dormir'
};

const foodItems = [
  // Café da manhã
  { name: 'Pão integral', category: 'Café da manhã', highGlycemic: false },
  
  // Refeições
  { name: 'Arroz integral', category: 'Refeições', highGlycemic: false },
  
  // Vegetais
  { name: 'Salada crua', category: 'Vegetais', highGlycemic: false },
  
  // Lanches
  { name: 'Castanhas', category: 'Lanches', highGlycemic: false }
];

type GlucoseLevel = 'all' | 'low' | 'normal' | 'high';

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
  const [selectedRecord, setSelectedRecord] = useState<GlucoseRecord | null>(null);
  const [levelFilter, setLevelFilter] = useState<GlucoseLevel>('all');
  const [showFoodList, setShowFoodList] = useState(false);
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

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

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

      setGlucoseLevel('');
      setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setMealType('fasting');
      setInsulinApplied(false);
      setInsulinUnits('');
      setSelectedFoods([]);
      setCustomFoods([]);
      setNotes('');

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

  const handleAddCustomFood = () => {
    if (newCustomFood.trim()) {
      setCustomFoods(prev => [...prev, newCustomFood.trim()]);
      setNewCustomFood('');
    }
  };

  const filteredFoodItems = foodItems.filter(
    food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecords = records.filter(record => {
    switch (levelFilter) {
      case 'low':
        return record.glucose_level < 70;
      case 'normal':
        return record.glucose_level >= 70 && record.glucose_level <= 180;
      case 'high':
        return record.glucose_level > 180;
      default:
        return true;
    }
  });

  const getGlucoseStatus = (level: number) => {
    if (level < 70) return { color: 'text-red-500', bgColor: 'bg-red-900/50' };
    if (level > 180) return { color: 'text-yellow-500', bgColor: 'bg-yellow-900/50' };
    return { color: 'text-green-500', bgColor: 'bg-green-900/50' };
  };

  if (selectedRecord) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedRecord(null)}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </button>
          <h2 className="text-2xl font-bold">Detalhes do Registro</h2>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Nível de Glicose</p>
              <p className={`text-3xl font-bold ${getGlucoseStatus(selectedRecord.glucose_level).color}`}>
                {selectedRecord.glucose_level} mg/dL
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Data e Hora</p>
              <p className="text-lg">
                {format(parseISO(selectedRecord.timestamp), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400">Momento</p>
            <p className="text-lg">{MEAL_TYPE_LABELS[selectedRecord.meal_type as typeof MEAL_TYPES[number]]}</p>
          </div>

          {selectedRecord.insulin_applied && (
            <div>
              <p className="text-sm text-gray-400">Insulina Aplicada</p>
              <p className="text-lg">{selectedRecord.insulin_units} unidades</p>
            </div>
          )}

          {selectedRecord.meal_items && selectedRecord.meal_items.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Alimentos Consumidos</p>
              <div className="flex flex-wrap gap-2">
                {selectedRecord.meal_items.map((item, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
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
            </div>
          )}

          {selectedRecord.notes && (
            <div>
              <p className="text-sm text-gray-400">Observações</p>
              <p className="text-lg">{selectedRecord.notes}</p>
            </div>
          )}

          <div className={`p-4 rounded-lg ${getGlucoseStatus(selectedRecord.glucose_level).bgColor}`}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                {(() => {
                  const alert = getGlucoseAlert(selectedRecord.glucose_level, selectedRecord.timestamp);
                  return (
                    <>
                      <p className="font-medium">{alert.message}</p>
                      {alert.recommendation && (
                        <p className="text-sm mt-1 opacity-90">{alert.recommendation}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white text-lg"
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
                      <div className={`p-3 rounded-lg flex items-start space-x-2 ${
                        alert.type === 'danger'
                          ? 'bg-red-900/50 text-red-100'
                          : alert.type === 'warning'
                          ? 'bg-yellow-900/50 text-yellow-100'
                          : 'bg-green-900/50 text-green-100'
                      }`}>
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

            <div>
              <label htmlFor="meal-type" className="block text-lg font-medium mb-2">
                Momento do Dia
              </label>
              <select
                id="meal-type"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as typeof MEAL_TYPES[number])}
                className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white"
                required
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MEAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Alimentos Consumidos</h2>
              <button
                type="button"
                onClick={() => setShowFoodList(!showFoodList)}
                className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
              >
                {showFoodList ? (
                  <>
                    <EyeOff className="w-5 h-5" />
                    <span>Ocultar alimentos</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    <span>Mostrar alimentos</span>
                  </>
                )}
              </button>
            </div>

            <div className={`space-y-4 transition-all duration-300 ${
              showFoodList ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'
            }`}>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar alimentos..."
                  className="w-full p-3 pl-10 rounded-lg bg-dark-300 border border-dark-400 text-white"
                />
                <Activity className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>

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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomFood}
                  onChange={(e) => setNewCustomFood(e.target.value)}
                  placeholder="Adicionar alimento personalizado"
                  className="flex-1 p-3 rounded-lg bg-dark-300 border border-dark-400 text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFood}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white"
                >
                  Adicionar
                </button>
              </div>

              {customFoods.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Alimentos Personalizados</label>
                  <div className="flex flex-wrap gap-2">
                    {customFoods.map((food, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900/50 text-primary-200"
                      >
                        <span>{food}</span>
                        <button
                          type="button"
                          onClick={() => setCustomFoods(prev => prev.filter((_, i) => i !== index))}
                          className="text-primary-300 hover:text-primary-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="insulin" className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="insulin"
                  checked={insulinApplied}
                  onChange={(e) => {
                    setInsulinApplied(e.target.checked);
                    if (!e.target.checked) {
                      setInsulinUnits('');
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Insulina aplicada?</span>
              </label>

              {insulinApplied && (
                <div>
                  <label htmlFor="insulin-units" className="block text-sm font-medium mb-2">
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
                    className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white"
                    required={insulinApplied}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-lg font-medium mb-2">
                Observações
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white"
                rows={3}
                placeholder="Adicione observações relevantes..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-5 h-5" />
              {loading ? 'Salvando...' : 'Salvar Registro'}
            </button>
          </div>
        </form>

        <div className="bg-gray-900 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico Recente
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as GlucoseLevel)}
                className="p-2 rounded-lg bg-dark-300 border border-dark-400 text-white"
              >
                <option value="all">Todos</option>
                <option value="low">Baixo</option>
                <option value="normal">Normal</option>
                <option value="high">Alto</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="flex items-center justify-between p-4 rounded-lg bg-dark-400 hover:bg-dark-500 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`text-2xl font-bold ${getGlucoseStatus(record.glucose_level).color}`}>
                    {record.glucose_level}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      {format(parseISO(record.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                    <p>{MEAL_TYPE_LABELS[record.meal_type as typeof MEAL_TYPES[number]]}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}

            {filteredRecords.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};