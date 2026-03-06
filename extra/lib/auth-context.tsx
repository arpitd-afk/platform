'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { api } from './api';
import toast from 'react-hot-toast';

export type UserRole = 'super_admin' | 'academy_admin' | 'coach' | 'student' | 'parent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  academyId?: string;
  academyName?: string;
  academySubdomain?: string;
  rating?: number;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  academyName?: string;
  academySubdomain?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_REDIRECT: Record<UserRole, string> = {
  super_admin: '/super-admin',
  academy_admin: '/academy',
  coach: '/coach',
  student: '/student',
  parent: '/parent',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize from stored token
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('auth_token');
      if (token) {
        try {
          const decoded = jwtDecode<{ exp: number; user: User }>(token);
          if (decoded.exp * 1000 > Date.now()) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setState({
              user: decoded.user,
              token,
              isLoading: false,
              isAuthenticated: true,
            });
            return;
          }
        } catch {
          Cookies.remove('auth_token');
        }
      }
      setState(prev => ({ ...prev, isLoading: false }));
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user } = data;

      Cookies.set('auth_token', token, { expires: 7, secure: true, sameSite: 'strict' });
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });

      toast.success(`Welcome back, ${user.name}!`);
      router.push(ROLE_REDIRECT[user.role as UserRole]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const { data: response } = await api.post('/auth/register', data);
      const { token, user } = response;

      Cookies.set('auth_token', token, { expires: 7, secure: true, sameSite: 'strict' });
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });

      toast.success('Account created successfully!');
      router.push(ROLE_REDIRECT[user.role as UserRole]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed.';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    Cookies.remove('auth_token');
    delete api.defaults.headers.common['Authorization'];
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.push('/login');
    toast.success('Logged out successfully');
  }, [router]);

  const updateUser = useCallback((data: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...data } : null,
    }));
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      const { token } = data;
      Cookies.set('auth_token', token, { expires: 7 });
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setState(prev => ({ ...prev, token }));
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateUser, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push(ROLE_REDIRECT[user.role]);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  return { user, isLoading };
}
