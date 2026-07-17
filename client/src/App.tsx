import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import { AppProvider } from "./Context/AppContext";
import { SocketProvider } from "./Context/SocketContext";
import { ToastProvider } from "./Context/ToastContext";
import { ThemeProvider } from "./Context/ThemeContext";
import Index from "./Pages/Index";
import Tasks from "./Pages/Tasks";
import Users from "./Pages/Users";
import Profile from "./Pages/Profile";
import NotFound from "./Pages/NotFound";
import Login from "./Pages/Login";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
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

// User management is Admin-only. A Member hitting /users is bounced back
// to the dashboard rather than seeing a broken page.
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><AdminRoute><Users /></AdminRoute></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <AppProvider>
                <div className="min-h-screen text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 transition-colors duration-300">
                  <AppRoutes />
                </div>
              </AppProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
