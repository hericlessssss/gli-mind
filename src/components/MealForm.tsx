import React, { useState, useMemo } from 'react';
import { Clock, AlertTriangle, Save, Plus, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from './Toast';

interface FoodItem {
  id: string;
  name: string;
  highGlycemic: boolean;
  category: string;
}

const foodItems: FoodItem[] = [
  // Café da manhã
  { id: '1', name: 'Pão integral', category: 'Café da manhã', highGlycemic: false },
  { id: '2', name: 'Pão francês', category: 'Café da manhã', highGlycemic: true },
  { id: '3', name: 'Aveia', category: 'Café da manhã', highGlycemic: false },
  { id: '4', name: 'Granola sem açúcar', category: 'Café da manhã', highGlycemic: false },
  { id: '5', name: 'Iogurte natural', category: 'Café da manhã', highGlycemic: false },
  { id: '6', name: 'Queijo branco', category: 'Café da manhã', highGlycemic: false },
  { id: '7', name: 'Ovos mexidos', category: 'Café da manhã', highGlycemic: false },
  { id: '8', name: 'Tapioca', category: 'Café da manhã', highGlycemic: true },

  // Proteínas
  { id: '9', name: 'Frango grelhado', category: 'Proteínas', highGlycemic: false },
  { id: '10', name: 'Peixe assado', category: 'Proteínas', highGlycemic: false },
  { id: '11', name: 'Carne magra', category: 'Proteínas', highGlycemic: false },
  { id: '12', name: 'Ovo cozido', category: 'Proteínas', highGlycemic: false },
  { id: '13', name: 'Atum', category: 'Proteínas', highGlycemic: false },
  { id: '14', name: 'Sardinha', category: 'Proteínas', highGlycemic: false },

  // Vegetais
  { id: '15', name: 'Alface', category: 'Vegetais', highGlycemic: false },
  { id: '16', name: 'Tomate', category: 'Vegetais', highGlycemic: false },
  { id: '17', name: 'Cenoura', category: 'Vegetais', highGlycemic: false },
  { id: '18', name: 'Brócolis', category: 'Vegetais', highGlycemic: false },
  { id: '19', name: 'Couve-flor', category: 'Vegetais', highGlycemic: false },
  { id: '20', name: 'Pepino', category: 'Vegetais', highGlycemic: false },
  { id: '21', name: 'Abobrinha', category: 'Vegetais', highGlycemic: false },
  { id: '22', name: 'Berinjela', category: 'Vegetais', highGlycemic: false },
];

export const MealForm = () => {
  const { user } = useAuth();
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [customFoods, setCustomFoods] = useState<string[]>([]);
  const [newCustomFood, setNewCustomFood] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as const });

  const categories = useMemo(() => {
    return Array.from(new Set(foodItems.map(food => food.category)));
  }, []);

  const filteredFoods = useMemo(() => {
    if (!searchTerm) return foodItems;
    const term = searchTerm.toLowerCase();
    return foodItems.filter(food => 
      food.name.toLowerCase().includes(term) || 
      food.category.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleFoodSelect = (foodId: string) => {
    setSelectedFoods(prev => {
      const newSelection = prev.includes(foodId)
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId];
      
      const hasHighGlycemic = newSelection.some(id => 
        foodItems.find(f => f.id === id)?.highGlycemic
      );
      setShowWarning(hasHighGlycemic);
      
      return newSelection;
    });
  };

  const handleAddCustomFood = () => {
    if (newCustomFood.trim()) {
      setCustomFoods(prev => [...prev, newCustomFood.trim()]);
      setNewCustomFood('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToast({
        show: true,
        message: 'Você precisa estar logado para salvar refeições',
        type: 'error' as const
      });
      return;
    }

    if (selectedFoods.length === 0 && customFoods.length === 0) {
      setToast({
        show: true,
        message: 'Selecione pelo menos um alimento',
        type: 'error' as const
      });
      return;
    }

    setLoading(true);

    try {
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          timestamp,
          notes: notes || null,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      const mealItems = [
        ...selectedFoods.map(id => {
          const food = foodItems.find(f => f.id === id)!;
          return {
            meal_id: meal.id,
            name: food.name,
            is_custom: false,
            high_glycemic: food.highGlycemic,
            category: food.category,
          };
        }),
        ...customFoods.map(name => ({
          meal_id: meal.id,
          name,
          is_custom: true,
          high_glycemic: false,
          category: 'Personalizado',
        })),
      ];

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(mealItems);

      if (itemsError) throw itemsError;

      setToast({
        show: true,
        message: 'Refeição registrada com sucesso!',
        type: 'success' as const
      });

      // Reset form
      setSelectedFoods([]);
      setCustomFoods([]);
      setNotes('');
      setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setShowWarning(false);
      setSearchTerm('');
      setIsAccordionOpen(false);
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof Error ? err.message : 'Erro ao salvar a refeição',
        type: 'error' as const
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      <div className="space-y-4">
        {/* Accordion Header */}
        <div className="bg-dark-300 rounded-lg">
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="text-lg font-medium">Selecionar Alimentos</span>
            {isAccordionOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Accordion Content */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isAccordionOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-4 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar alimentos..."
                  className="w-full p-3 rounded-lg bg-dark-400 border border-dark-500 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>

              {/* Food Categories */}
              {categories.map(category => {
                const categoryFoods = filteredFoods.filter(f => f.category === category);
                if (categoryFoods.length === 0) return null;
                
                const isExpanded = expandedCategories.includes(category);
                const displayFoods = isExpanded ? categoryFoods : categoryFoods.slice(0, 6);

                return (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-medium text-primary-400">{category}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {displayFoods.map(food => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => handleFoodSelect(food.id)}
                          className={`p-3 text-left rounded-lg transition-all ${
                            selectedFoods.includes(food.id)
                              ? 'bg-primary-600/20 ring-2 ring-primary-500'
                              : 'bg-dark-400 hover:bg-dark-500'
                          }`}
                        >
                          <p className="text-sm">{food.name}</p>
                          {food.highGlycemic && (
                            <p className="text-xs text-yellow-400 mt-1">Alto IG</p>
                          )}
                        </button>
                      ))}
                    </div>
                    {categoryFoods.length > 6 && (
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="flex items-center text-primary-400 hover:text-primary-300"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            <span>Ver menos</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            <span>Ver mais {categoryFoods.length - 6} itens</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Custom Food Input */}
              <div className="pt-4 border-t border-dark-500">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="customFood" className="block text-sm font-medium mb-2">
                      Adicionar Outro Alimento
                    </label>
                    <input
                      type="text"
                      id="customFood"
                      value={newCustomFood}
                      onChange={(e) => setNewCustomFood(e.target.value)}
                      className="w-full p-3 rounded-lg bg-dark-400 border border-dark-500 text-white"
                      placeholder="Digite o nome do alimento"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomFood}
                    className="self-end p-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Custom Foods List */}
              {customFoods.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Alimentos Personalizados:</p>
                  <div className="flex flex-wrap gap-2">
                    {customFoods.map((food, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/20 text-primary-200 text-sm"
                      >
                        <span>{food}</span>
                        <button
                          type="button"
                          onClick={() => setCustomFoods(prev => prev.filter((_, i) => i !== index))}
                          className="text-primary-300 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Foods Preview */}
      {selectedFoods.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Alimentos Selecionados</h2>
          <div className="flex flex-wrap gap-2">
            {selectedFoods.map(id => {
              const food = foodItems.find(f => f.id === id);
              if (!food) return null;
              return (
                <div
                  key={food.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    food.highGlycemic 
                      ? 'bg-yellow-900/50 text-yellow-200'
                      : 'bg-dark-300 text-gray-200'
                  }`}
                >
                  <span>{food.name}</span>
                  <button
                    type="button"
                    onClick={() => handleFoodSelect(food.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showWarning && (
        <div className="p-4 rounded-lg bg-yellow-900/50 text-yellow-100 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Atenção: Alguns alimentos selecionados têm alto índice glicêmico. Monitore sua glicemia após a refeição.</p>
        </div>
      )}

      <div>
        <label htmlFor="timestamp" className="block text-lg font-medium mb-2">
          Horário da Refeição
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            id="timestamp"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white"
            required
          />
          <Clock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
        </div>
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
          placeholder="Adicione observações sobre a refeição"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg text-white font-medium text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Salvar Refeição</span>
          </>
        )}
      </button>
    </form>
  );
};