import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

export const Welcome = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, created_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-3/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2 mt-2"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h1 className="text-2xl font-bold text-white">
        {profile.first_name 
          ? `Olá, ${profile.first_name}!`
          : 'Bem-vindo(a)!'
        }
      </h1>
      <p className="text-gray-400 mt-1">
        Vamos monitorar sua saúde hoje?
      </p>
    </div>
  );
};