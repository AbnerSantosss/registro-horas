import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from '../types';
import { useAuth } from './AuthContext';

interface PlatformContextType {
  platforms: Platform[];
  createPlatform: (name: string, color?: string, icon?: string) => Promise<void>;
  updatePlatform: (id: string, name: string, color?: string, icon?: string) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;
  fetchPlatforms: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const { token } = useAuth();

  const fetchPlatforms = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPlatforms(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch platforms', error);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, [token]);

  const createPlatform = async (name: string, color?: string, icon?: string) => {
    const res = await fetch('/api/platforms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, color, icon })
    });
    if (!res.ok) throw new Error('Failed to create platform');
    await fetchPlatforms();
  };

  const updatePlatform = async (id: string, name: string, color?: string, icon?: string) => {
    const res = await fetch(`/api/platforms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, color, icon })
    });
    if (!res.ok) throw new Error('Failed to update platform');
    await fetchPlatforms();
  };

  const deletePlatform = async (id: string) => {
    const res = await fetch(`/api/platforms/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete platform');
    await fetchPlatforms();
  };

  return (
    <PlatformContext.Provider value={{ platforms, createPlatform, updatePlatform, deletePlatform, fetchPlatforms }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatforms() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatforms must be used within a PlatformProvider');
  }
  return context;
}
