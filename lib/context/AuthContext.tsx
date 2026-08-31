'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../supabase/client';
import { Profile } from '../types/database.types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUser(profile as Profile);
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Member',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          is_super_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
