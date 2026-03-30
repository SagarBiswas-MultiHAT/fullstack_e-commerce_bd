'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getUser as getUserFromAuth,
  login as loginRequest,
  logout as logoutRequest,
} from '@/lib/auth';
import type { AuthUser } from '@/lib/types';

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(payload: Record<string, unknown> | null): AuthUser | null {
  if (!payload) {
    return null;
  }

  return {
    id: String(payload.id),
    email: String(payload.email),
    name: String(payload.name),
    phone: payload.phone ? String(payload.phone) : null,
    isVerified: Boolean(payload.isVerified),
    createdAt: String(payload.createdAt),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    const response = await getUserFromAuth();
    setCurrentUser(toAuthUser(response));
  };

  useEffect(() => {
    refresh()
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const login = async (email: string, password: string) => {
      const response = await loginRequest(email, password);
      setCurrentUser(toAuthUser(response.customer));
    };

    const logout = async () => {
      await logoutRequest();
      setCurrentUser(null);
    };

    const refreshUser = async () => {
      await refresh();
    };

    return {
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isLoading,
      login,
      logout,
      refresh: refreshUser,
    };
  }, [currentUser, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
