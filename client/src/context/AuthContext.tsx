import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

export type Role = 'LANDLORD' | 'TENANT' | 'CARETAKER';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  receiveSmsNotifications: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: { name: string; email: string; phone: string; password: string; role: Role }) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('rentease_token');
    const storedUser = localStorage.getItem('rentease_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persist(newToken: string, newUser: AuthUser) {
    localStorage.setItem('rentease_token', newToken);
    localStorage.setItem('rentease_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user as AuthUser;
  }

  async function register(data: { name: string; email: string; phone: string; password: string; role: Role }) {
    const res = await api.post('/auth/register', data);
    persist(res.data.token, res.data.user);
    return res.data.user as AuthUser;
  }

  function logout() {
    localStorage.removeItem('rentease_token');
    localStorage.removeItem('rentease_user');
    setToken(null);
    setUser(null);
  }

  function updateUser(newUser: AuthUser) {
    localStorage.setItem('rentease_user', JSON.stringify(newUser));
    setUser(newUser);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}