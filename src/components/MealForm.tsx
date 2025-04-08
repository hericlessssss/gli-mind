import React, { useState, useMemo } from 'react';
import { Clock, AlertTriangle, Save, Plus, X, Search, UtensilsCrossed } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from './Toast';

interface FoodItem {
  id: string;
  name: string;
  image: string;
  highGlycemic: boolean;
  category: string;
}

const foodItems: FoodItem[] = [
  // Proteínas Magras
  {
    id: 'chicken-breast',
    name: 'Peito de Frango',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Proteínas'
  },
  {
    id: 'fish',
    name: 'Peixe Grelhado',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Proteínas'
  },
  {
    id: 'eggs',
    name: 'Ovos',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Proteínas'
  },
  {
    id: 'tofu',
    name: 'Tofu',
    image: 'https://plus.unsplash.com/premium_photo-1664648005366-8737ef6043d5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Proteínas'
  },

  // Grãos Integrais
  {
    id: 'brown-rice',
    name: 'Arroz Integral',
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Grãos'
  },
  {
    id: 'quinoa',
    name: 'Quinoa',
    image: 'https://plus.unsplash.com/premium_photo-1671130295828-efd9019faee0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Grãos'
  },
  {
    id: 'oats',
    name: 'Aveia',
    image: 'https://plus.unsplash.com/premium_photo-1671130295244-b058fc8d86fe?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Grãos'
  },

  // Legumes
  {
    id: 'black-beans',
    name: 'Feijão Preto',
    image: 'https://images.unsplash.com/photo-1647545401750-6dd5539879ac?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Legumes'
  },
  {
    id: 'lentils',
    name: 'Lentilha',
    image: 'https://images.unsplash.com/photo-1601941187195-182cd1e7fc5c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Legumes'
  },
  {
    id: 'chickpeas',
    name: 'Grão de Bico',
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?q=80&w=1970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Legumes'
  },

  // Vegetais Baixo Carboidrato
  {
    id: 'spinach',
    name: 'Espinafre',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Vegetais'
  },
  {
    id: 'broccoli',
    name: 'Brócolis',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Vegetais'
  },
  {
    id: 'cauliflower',
    name: 'Couve-Flor',
    image: 'https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Vegetais'
  },
  {
    id: 'kale',
    name: 'Couve',
    image: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Vegetais'
  },

  // Gorduras Saudáveis
  {
    id: 'avocado',
    name: 'Abacate',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Gorduras Saudáveis'
  },
  {
    id: 'olive-oil',
    name: 'Azeite',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Gorduras Saudáveis'
  },
  {
    id: 'nuts',
    name: 'Castanhas',
    image: 'https://images.unsplash.com/photo-1563387105790-d7f555226001?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Gorduras Saudáveis'
  },

  // Frutas Baixo Índice Glicêmico
  {
    id: 'berries',
    name: 'Frutas Vermelhas',
    image: 'https://images.unsplash.com/photo-1467887633195-23e82423e499?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: false,
    category: 'Frutas'
  },
  {
    id: 'apple',
    name: 'Maçã',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Frutas'
  },
  {
    id: 'orange',
    name: 'Laranja',
    image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=200&h=200&fit=crop',
    highGlycemic: false,
    category: 'Frutas'
  },

  // Alimentos de Alto Índice Glicêmico (Alertas)
  {
    id: 'white-bread',
    name: 'Pão Branco',
    image: 'https://images.unsplash.com/photo-1592029780368-c1fff15bcfd5?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    highGlycemic: true,
    category: 'Alto IG'
  },
  {
    id: 'white-rice',
    name: 'Arroz Branco',
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&h=200&fit=crop',
    highGlycemic: true,
    category: 'Alto IG'
  },
  {
    id: 'potato',
    name: 'Batata',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=200&fit=crop',
    highGlycemic: true,
    category: 'Alto IG'
  }
];

export const MealForm = () => {
  const { user } = useAuth();
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState<string>('');
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [customFoods, setCustomFoods] = useState<string[]>([]);
  const [newCustomFood, setNewCustomFood] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(foodItems.map(food => food.category)));
    return uniqueCategories.sort((a, b) => {
      // Put "Alto IG" at the end
      if (a === 'Alto IG') return 1;
      if (b === 'Alto IG') return -1;
      return a.localeCompare(b);
    });
  }, []);

  const filteredFoods = useMemo(() => {
    return foodItems.filter(food => 
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleFoodToggle = (foodId: string) => {
    setSelectedFoods(prev => {
      const newSelection = prev.includes(foodId)
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId];
      
      const hasHighGlycemicFood = newSelection.some(id => 
        foodItems.find(food => food.id === id)?.highGlycemic
      );
      setShowWarning(hasHighGlycemicFood);
      
      return newSelection;
    });
  };

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomFood.trim()) {
      setCustomFoods(prev => [...prev, newCustomFood.trim()]);
      setNewCustomFood('');
    }
  };

  const handleRemoveCustomFood = (index: number) => {
    setCustomFoods(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedFoods([]);
    setCustomFoods([]);
    setNotes('');
    setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setShowWarning(false);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToast({
        show: true,
        message: 'Você precisa estar logado para salvar refeições',
        type: 'error'
      });
      return;
    }

    if (selectedFoods.length === 0 && customFoods.length === 0) {
      setToast({
        show: true,
        message: 'Selecione pelo menos um alimento',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // First, create the meal record
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          timestamp: parseISO(timestamp).toISOString(),
          notes: notes || null,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Then, create meal items for selected foods
      const selectedMealItems = selectedFoods.map(foodId => {
        const food = foodItems.find(f => f.id === foodId)!;
        return {
          meal_id: meal.id,
          name: food.name,
          is_custom: false,
          high_glycemic: food.highGlycemic,
          category: food.category,
        };
      });

      // Create meal items for custom foods
      const customMealItems = customFoods.map(foodName => ({
        meal_id: meal.id,
        name: foodName,
        is_custom: true,
        high_glycemic: false,
        category: 'Personalizado',
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert([...selectedMealItems, ...customMealItems]);

      if (itemsError) throw itemsError;

      setToast({
        show: true,
        message: 'Refeição registrada com sucesso!',
        type: 'success'
      });
      resetForm();
    } catch (err) {
      console.error('Error saving meal:', err);
      setToast({
        show: true,
        message: err instanceof Error ? err.message : 'Erro ao salvar a refeição',
        type: 'error'
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

      <div>
        <label className="block text-lg font-medium mb-4">
          Selecione os Alimentos
        </label>
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar alimentos..."
            className="w-full p-3 pl-10 rounded-lg bg-dark-300 border border-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>

        {categories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-primary-400">{category}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredFoods
                .filter(food => food.category === category)
                .map(food => (
                  <div
                    key={food.id}
                    onClick={() => handleFoodToggle(food.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-105 ${
                      selectedFoods.includes(food.id) ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                      <p className="text-xs text-white text-center">{food.name}</p>
                      {food.highGlycemic && (
                        <p className="text-xs text-yellow-400 text-center">Alto IG</p>
                      )}
                    </div>
                    {selectedFoods.includes(food.id) && (
                      <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                        <div className="bg-primary-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="customFood" className="block text-lg font-medium mb-2">
              Adicionar Outro Alimento
            </label>
            <input
              type="text"
              id="customFood"
              value={newCustomFood}
              onChange={(e) => setNewCustomFood(e.target.value)}
              className="w-full p-3 rounded-lg bg-dark-300 border border-dark-400 text-white"
              placeholder="Digite o nome do alimento"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCustomFood}
            className="p-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {customFoods.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400">Alimentos Personalizados:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {customFoods.map((food, index) => (
                <div
                  key={index}
                  className="relative bg-dark-300 rounded-lg overflow-hidden"
                >
                  <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary-600/20 to-primary-400/20">
                    <UtensilsCrossed className="w-12 h-12 text-primary-400" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomFood(index)}
                      className="p-1 bg-dark-400/80 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2 bg-black/70">
                    <p className="text-xs text-white text-center">{food}</p>
                    <p className="text-xs text-primary-400 text-center">Adicionado pelo usuário</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showWarning && (
        <div className="p-4 rounded-lg flex items-center space-x-2 bg-yellow-900/50 text-yellow-100">
          <AlertTriangle className="w-5 h-5 shrink-0" />
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
          Observações (opcional)
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
        className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg text-white font-medium text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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