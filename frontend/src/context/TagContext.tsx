import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Tag } from '../types';

interface TagContextValue {
  tags: Tag[];
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<void>;
  updateTag: (id: string, name: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

const TagContext = createContext<TagContextValue | null>(null);

export function TagProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<Tag[]>([]);

  const fetchTags = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tags', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTags(await res.json());
    } catch (err) {
      console.error('fetchTags error:', err);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = async (name: string, color: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error('Erro ao criar tag');
    const tag = await res.json();
    setTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const updateTag = async (id: string, name: string, color: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar tag');
    setTags(prev =>
      prev.map(t => (t.id === id ? { ...t, name, color } : t)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const deleteTag = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/tags/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erro ao excluir tag');
    setTags(prev => prev.filter(t => t.id !== id));
  };

  return (
    <TagContext.Provider value={{ tags, fetchTags, createTag, updateTag, deleteTag }}>
      {children}
    </TagContext.Provider>
  );
}

export function useTags() {
  const ctx = useContext(TagContext);
  if (!ctx) throw new Error('useTags must be used within TagProvider');
  return ctx;
}
