import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/');
      } else {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        if (user) {
          // Update the profile with first and last name
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              first_name: firstName,
              last_name: lastName,
            })
            .eq('id', user.id);
          
          if (updateError) throw updateError;
        }
        
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </h2>
          <p className="mt-2 text-gray-400">
            {isLogin
              ? 'Faça login para acessar sua conta'
              : 'Registre-se para começar a monitorar sua saúde'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-100 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                  Nome
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-lg bg-dark-300 border border-dark-400 text-white px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="João"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-lg bg-dark-300 border border-dark-400 text-white px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Silva"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-dark-300 border border-dark-400 text-white px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-dark-300 border border-dark-400 text-white px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg text-white font-medium text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Criar Conta</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            {isLogin
              ? 'Não tem uma conta? Registre-se'
              : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};