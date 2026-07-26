import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
