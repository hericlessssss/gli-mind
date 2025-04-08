import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface Tip {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
}

const diabetesTips: Tip[] = [
  {
    id: '1',
    category: 'Emergência',
    title: 'Como lidar com Hipoglicemia',
    description: 'Se sua glicemia estiver abaixo de 70 mg/dL:\n\n1. Consuma 15g de carboidrato de ação rápida (meio copo de suco de laranja ou 3 balas de glicose)\n2. Aguarde 15 minutos\n3. Meça novamente sua glicemia\n4. Se ainda estiver baixa, repita o processo\n\nApós normalizar, faça um lanche com proteína e carboidrato complexo para evitar nova queda.',
    image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&h=400&fit=crop'
  },
  {
    id: '2',
    category: 'Alimentação',
    title: 'Alimentos que Ajudam no Controle Glicêmico',
    description: 'Priorize alimentos com baixo índice glicêmico:\n\n• Vegetais folhosos\n• Proteínas magras\n• Grãos integrais\n• Oleaginosas\n• Abacate\n• Chia e linhaça\n\nEstes alimentos ajudam a manter níveis estáveis de glicose no sangue e proporcionam saciedade prolongada.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop'
  },
  {
    id: '3',
    category: 'Atividade Física',
    title: 'Exercícios Seguros para Diabéticos',
    description: 'A atividade física regular é essencial para o controle do diabetes:\n\n• Comece com caminhadas de 15-30 minutos\n• Pratique exercícios de resistência 2-3 vezes por semana\n• Monitore sua glicemia antes, durante e após o exercício\n• Mantenha um lanche rápido sempre à mão\n• Hidrate-se adequadamente\n\nConsulte seu médico antes de iniciar um novo programa de exercícios.',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&h=400&fit=crop'
  },
  {
    id: '4',
    category: 'Alertas',
    title: 'Alimentos para Evitar',
    description: 'Alguns alimentos podem causar picos perigosos de glicemia:\n\n• Refrigerantes e sucos industrializados\n• Doces e sobremesas concentradas\n• Massas refinadas\n• Cereais açucarados\n• Frituras\n\nSempre leia os rótulos e fique atento às porções.',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=400&fit=crop'
  },
  {
    id: '5',
    category: 'Hábitos Saudáveis',
    title: 'Rotina de Autocuidado',
    description: 'Desenvolva hábitos diários para melhor controle do diabetes:\n\n• Meça sua glicemia regularmente\n• Mantenha horários regulares para refeições\n• Durma 7-8 horas por noite\n• Gerencie o estresse\n• Examine seus pés diariamente\n• Mantenha consultas regulares com sua equipe de saúde',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  }
];

export const Tips = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedTips, setExpandedTips] = useState<string[]>([]);

  const toggleFavorite = (tipId: string) => {
    setFavorites(prev =>
      prev.includes(tipId)
        ? prev.filter(id => id !== tipId)
        : [...prev, tipId]
    );
  };

  const toggleExpand = (tipId: string) => {
    setExpandedTips(prev =>
      prev.includes(tipId)
        ? prev.filter(id => id !== tipId)
        : [...prev, tipId]
    );
  };

  const categories = Array.from(new Set(diabetesTips.map(tip => tip.category)));

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Dicas e Cuidados</h1>
      
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-primary-400">{category}</h2>
          
          <div className="grid gap-4">
            {diabetesTips
              .filter(tip => tip.category === category)
              .map(tip => (
                <div
                  key={tip.id}
                  className="bg-gray-900 rounded-lg overflow-hidden shadow-lg"
                >
                  <img
                    src={tip.image}
                    alt={tip.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  <div className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold">{tip.title}</h3>
                      <button
                        onClick={() => toggleFavorite(tip.id)}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {favorites.includes(tip.id) ? (
                          <BookmarkCheck className="w-6 h-6" />
                        ) : (
                          <Bookmark className="w-6 h-6" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div
                        className={`prose prose-invert max-w-none ${
                          !expandedTips.includes(tip.id) && 'line-clamp-3'
                        }`}
                      >
                        {tip.description.split('\n').map((line, index) => (
                          <p key={index} className="text-gray-300">
                            {line}
                          </p>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => toggleExpand(tip.id)}
                        className="flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {expandedTips.includes(tip.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Mostrar menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Ler mais
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};