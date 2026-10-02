import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

function storageKey(email) {
  return `apex_cart_${email || 'guest'}`;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const activeEmail = user?.email || null;
  const loadedForRef = useRef(undefined);

  const [items, setItems] = useState([]); // [{ vehicle, quantity }]

  // Cart is scoped per account: whenever the signed-in user changes
  // (login, logout, or switching accounts), swap in that user's saved
  // cart instead of leaking whatever was in memory for the last one.
  useEffect(() => {
    if (loadedForRef.current === activeEmail) return;
    loadedForRef.current = activeEmail;
    if (!activeEmail) {
      setItems([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(activeEmail));
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, [activeEmail]);

  useEffect(() => {
    if (!activeEmail) return;
    try {
      localStorage.setItem(storageKey(activeEmail), JSON.stringify(items));
    } catch {
      // storage full or unavailable — cart just won't survive a refresh
    }
  }, [items, activeEmail]);

  const addItem = useCallback((vehicle, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.vehicle.id === vehicle.id);
      const maxQty = vehicle.quantity;
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, maxQty);
        return prev.map((i) => (i.vehicle.id === vehicle.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, { vehicle, quantity: Math.min(quantity, maxQty) }];
    });
  }, []);

  const updateQuantity = useCallback((vehicleId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => (i.vehicle.id === vehicleId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((vehicleId) => {
    setItems((prev) => prev.filter((i) => i.vehicle.id !== vehicleId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (activeEmail) {
      try { localStorage.removeItem(storageKey(activeEmail)); } catch { /* noop */ }
    }
  }, [activeEmail]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.vehicle.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
