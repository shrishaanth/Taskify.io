import { create } from 'zustand';
import { api, setTokens, clearTokens } from '../stores/api.client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const storedRefresh = localStorage.getItem('refreshToken');
    if (!storedRefresh) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api/v1'}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });
      if (!res.ok) {
        clearTokens();
        set({ isLoading: false });
        return;
      }
      const data: AuthResponse = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password });
    setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (name: string, email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/register', { name, email, password });
    setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },
}));
