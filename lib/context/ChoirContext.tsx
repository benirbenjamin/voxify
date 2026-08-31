'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { choirService } from '../services/choirService';
import { Choir, ChoirMember } from '../types/database.types';
import { useAuth } from './AuthContext';

interface ChoirContextType {
  choirs: Choir[];
  activeChoir: Choir | null;
  activeMember: ChoirMember | null;
  loading: boolean;
  selectChoir: (choirId: string) => void;
  refreshChoirs: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  isSectionLeader: boolean;
}

const ChoirContext = createContext<ChoirContextType>({
  choirs: [],
  activeChoir: null,
  activeMember: null,
  loading: true,
  selectChoir: () => {},
  refreshChoirs: async () => {},
  isOwner: false,
  isAdmin: false,
  isSectionLeader: false,
});

export const ChoirProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [choirs, setChoirs] = useState<Choir[]>([]);
  const [activeChoir, setActiveChoir] = useState<Choir | null>(null);
  const [activeMember, setActiveMember] = useState<ChoirMember | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChoirs = async () => {
    if (!user) {
      setChoirs([]);
      setActiveChoir(null);
      setActiveMember(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userChoirs = await choirService.getMyChoirs();
      setChoirs(userChoirs);

      // Restore stored active choir ID or default to first
      const storedChoirId = typeof window !== 'undefined' ? localStorage.getItem('voxify_active_choir') : null;
      const initialChoir = userChoirs.find(c => c.id === storedChoirId) || userChoirs[0] || null;

      setActiveChoir(initialChoir);

      if (initialChoir) {
        const members = await choirService.getChoirMembers(initialChoir.id);
        const currentMember = members.find(m => m.user_id === user.id) || null;
        setActiveMember(currentMember);
      }
    } catch {
      setChoirs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChoirs();
  }, [user]);

  const selectChoir = async (choirId: string) => {
    const target = choirs.find(c => c.id === choirId);
    if (target) {
      setActiveChoir(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('voxify_active_choir', choirId);
      }
      if (user) {
        const members = await choirService.getChoirMembers(target.id);
        const currentMember = members.find(m => m.user_id === user.id) || null;
        setActiveMember(currentMember);
      }
    }
  };

  const isOwner = activeMember?.role === 'owner' || user?.is_super_admin === true;
  const isAdmin = isOwner || activeMember?.role === 'admin';
  const isSectionLeader = isAdmin || activeMember?.role === 'section_leader';

  return (
    <ChoirContext.Provider
      value={{
        choirs,
        activeChoir,
        activeMember,
        loading,
        selectChoir,
        refreshChoirs: fetchChoirs,
        isOwner,
        isAdmin,
        isSectionLeader,
      }}
    >
      {children}
    </ChoirContext.Provider>
  );
};

export const useChoir = () => useContext(ChoirContext);
