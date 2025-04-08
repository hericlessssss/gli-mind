import React, { useState, useEffect } from 'react';
import { MealForm } from '../components/MealForm';
import { History, ChevronRight, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MealRecord {
  id: string;
  timestamp: string;
  notes: string | null;
  meal_items: {
    id: string;
    name: string;
    is_custom: boolean;
    high_glycemic: boolean;
    category: string;
  }[];
}

export const MealLog = () => {
  const { user } = useAuth();
  const [mealHistory, setMealHistory] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMealHistory();
    }
  }, [user]);

  const fetchMealHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error: mealsError } = await supabase
        .from('meals')
        .select(`
          id,
          timestamp,
          notes,
          meal_items (
            id,
            name,
            is_custom,
            high_glycemic,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (mealsError) throw mealsError;

      // Handle the case where data is null
      setMealHistory(data || []);
    } catch (err) {
      console.error('Error fetching meal history:', err);
      setError('Failed to load meal history. Please try again later.');
      setMealHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMealAdded = () => {
    fetchMealHistory();
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Registro de Refeições</h1>
      
      <div className="p-4 bg-gray-900 rounded-lg">
        <MealForm onSuccess={handleMealAdded} />
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <History className="w-5 h-5 text-primary-400" />
          <h2 className="text-xl font-semibold">Histórico de Refeições</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>{error}</p>
          </div>
        ) : mealHistory.length > 0 ? (
          <div className="space-y-4">
            {mealHistory.map((meal) => (
              <div
                key={meal.id}
                className="bg-dark-300 rounded-lg p-4 hover:bg-dark-400 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      {format(parseISO(meal.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {meal.meal_items?.map((item) => (
                      <span
                        key={item.id}
                        className={`px-2 py-1 rounded-full text-xs ${
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

                  {meal.notes && (
                    <p className="text-sm text-gray-400 mt-2">{meal.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhuma refeição registrada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};