import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CompareContext = createContext(null);
const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);

  const toggleCompare = useCallback((vehicle) => {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === vehicle.id);
      if (exists) return prev.filter((v) => v.id !== vehicle.id);
      if (prev.length >= MAX_COMPARE) return prev; // silently ignore past the cap
      return [...prev, vehicle];
    });
  }, []);

  const removeCompare = useCallback((vehicleId) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  }, []);

  const clearCompare = useCallback(() => setVehicles([]), []);

  const isComparing = useCallback((vehicleId) => vehicles.some((v) => v.id === vehicleId), [vehicles]);

  const value = useMemo(
    () => ({ vehicles, toggleCompare, removeCompare, clearCompare, isComparing, maxCompare: MAX_COMPARE }),
    [vehicles, toggleCompare, removeCompare, clearCompare, isComparing]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
}
