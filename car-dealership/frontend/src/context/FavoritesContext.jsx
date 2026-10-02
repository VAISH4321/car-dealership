import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';

const FavoritesContext = createContext(null);

function storageKey(email) {
  return `apex_favorites_${email || 'guest'}`;
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const activeEmail = user?.email || null;
  const loadedForRef = useRef(undefined);

  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (loadedForRef.current === activeEmail) return;
    loadedForRef.current = activeEmail;
    if (!activeEmail) {
      setIds(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(activeEmail));
      setIds(new Set(raw ? JSON.parse(raw) : []));
    } catch {
      setIds(new Set());
    }
  }, [activeEmail]);

  useEffect(() => {
    if (!activeEmail) return;
    try {
      localStorage.setItem(storageKey(activeEmail), JSON.stringify([...ids]));
    } catch {
      // ignore
    }
  }, [ids, activeEmail]);

  const toggleFavorite = useCallback((vehicleId) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  }, []);

  const isFavorite = useCallback((vehicleId) => ids.has(vehicleId), [ids]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds: ids, toggleFavorite, isFavorite, count: ids.size }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
