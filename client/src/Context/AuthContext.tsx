import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, type AuthUser } from "../api/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  // No role parameter: the first registrant becomes Admin automatically;
  // afterward this endpoint is closed and an Admin must create the account.
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      authApi.me()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await authApi.register({ name, email, password });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authApi.me();
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      login, register, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
