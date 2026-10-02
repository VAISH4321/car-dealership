import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('apex_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('apex_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [token]);

  const persist = (data) => {
    localStorage.setItem('apex_token', data.token);
    localStorage.setItem('apex_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    persist(res.data);
    return res.data.user;
  }, []);

  const register = useCallback(async (email, password, role) => {
    const res = await client.post('/auth/register', { email, password, role });
    persist(res.data);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
    setToken(null);
    setUser(null);
  }, []);

  // The API client fires this when a request comes back 401 because the
  // stored token expired or was revoked — sync our state so the UI
  // drops back to the signed-out landing page instead of staying stuck.
  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('apex:session-expired', onExpired);
    return () => window.removeEventListener('apex:session-expired', onExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
