import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './stores/auth.store';

// ═══════════════════════════════════════════════════════════════
// NEW v2 Pages (built incrementally alongside old pages)
// ═══════════════════════════════════════════════════════════════
import { LoginPage } from './features/auth/LoginPage';
import { AppShell } from './v2components/layouts/AppShell';
import { OrgListPage } from './features/organizations/OrgListPage';

// ═══════════════════════════════════════════════════════════════
// OLD v1 Pages (will be removed in Phase 4)
// ═══════════════════════════════════════════════════════════════
import { AuthProvider, useAuth as useOldAuth } from './Context/AuthContext';
import { AppProvider } from './Context/AppContext';
import { SocketProvider } from './Context/SocketContext';
import { ToastProvider } from './Context/ToastContext';
import { ThemeProvider } from './Context/ThemeContext';
import Index from './Pages/Index';
import Tasks from './Pages/Tasks';
import Users from './Pages/Users';
import Profile from './Pages/Profile';
import NotFound from './Pages/NotFound';
import Login from './Pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ═══════════════════════════════════════════════════════════════
// NEW v2 Routes (TanStack Query + Zustand based)
// ═══════════════════════════════════════════════════════════════
const V2ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const V2Routes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<V2ProtectedRoute><AppShell /></V2ProtectedRoute>}>
        <Route index element={<Navigate to="/orgs" replace />} />
        <Route path="orgs" element={<OrgListPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ═══════════════════════════════════════════════════════════════
// OLD v1 Routes (kept operational until Phase 4 migration)
// ═══════════════════════════════════════════════════════════════
const OldProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useOldAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const OldRoutes = () => {
  const { isAuthenticated } = useOldAuth();
  return (
    <Routes>
      <Route path="/old/login" element={isAuthenticated ? <Navigate to="/old" replace /> : <Login />} />
      <Route path="/old" element={<OldProtectedRoute><Index /></OldProtectedRoute>} />
      <Route path="/old/tasks" element={<OldProtectedRoute><Tasks /></OldProtectedRoute>} />
      <Route path="/old/users" element={<OldProtectedRoute><Users /></OldProtectedRoute>} />
      <Route path="/old/profile" element={<OldProtectedRoute><Profile /></OldProtectedRoute>} />
      <Route path="/old/*" element={<NotFound />} />
    </Routes>
  );
};

// ═══════════════════════════════════════════════════════════════
// APP — runs both v1 and v2 side by side
// ═══════════════════════════════════════════════════════════════
const App = () => {
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 transition-colors duration-300">
      <QueryClientProvider client={queryClient}>
        {/* NEW v2 — unbranded, new auth/state */}
        <V2Routes />

        {/* OLD v1 — branded, old state management */}
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <SocketProvider>
                <ToastProvider>
                  <AppProvider>
                    <OldRoutes />
                  </AppProvider>
                </ToastProvider>
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
