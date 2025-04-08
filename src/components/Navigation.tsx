import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, Utensils, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navigation = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  
  const navItems = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/glucose', icon: Activity, label: 'Glicemia' },
    { to: '/meals', icon: Utensils, label: 'Refeições' },
    { to: '/tips', icon: HelpCircle, label: 'Dicas' },
  ];

  // Hide navigation on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-200/80 backdrop-blur-lg border-t border-dark-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-accent-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="flex flex-col items-center p-2 rounded-lg transition-colors text-gray-400 hover:text-red-400"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs mt-1">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
};