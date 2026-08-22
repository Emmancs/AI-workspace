'use client';

import * as React from 'react';
import { apiFetch, ApiError } from './api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  jobTitle?: string;
  isSystemAdmin?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  activeWorkspace: Workspace | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; name: string; workspaceName?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [activeWorkspace, setActiveWorkspace] = React.useState<Workspace | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const savedToken = localStorage.getItem('flowai_access_token');
    const savedUser = localStorage.getItem('flowai_user');
    const savedWorkspace = localStorage.getItem('flowai_active_workspace');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
        if (savedWorkspace) setActiveWorkspace(JSON.parse(savedWorkspace));
      } catch (e) {
        localStorage.removeItem('flowai_access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setUser(data.user);
      setActiveWorkspace(data.activeWorkspace);
      setToken(data.accessToken);

      localStorage.setItem('flowai_access_token', data.accessToken);
      localStorage.setItem('flowai_refresh_token', data.refreshToken);
      localStorage.setItem('flowai_user', JSON.stringify(data.user));
      if (data.activeWorkspace) {
        localStorage.setItem('flowai_active_workspace', JSON.stringify(data.activeWorkspace));
      }
    } catch (err) {
      throw err;
    }
  };

  const register = async (data: { email: string; password: string; name: string; workspaceName?: string }) => {
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setUser(response.user);
      setActiveWorkspace(response.workspace);
      setToken(response.accessToken);

      localStorage.setItem('flowai_access_token', response.accessToken);
      localStorage.setItem('flowai_refresh_token', response.refreshToken);
      localStorage.setItem('flowai_user', JSON.stringify(response.user));
      if (response.workspace) {
        localStorage.setItem('flowai_active_workspace', JSON.stringify(response.workspace));
      }
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setUser(null);
      setActiveWorkspace(null);
      setToken(null);
      localStorage.removeItem('flowai_access_token');
      localStorage.removeItem('flowai_refresh_token');
      localStorage.removeItem('flowai_user');
      localStorage.removeItem('flowai_active_workspace');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeWorkspace,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
