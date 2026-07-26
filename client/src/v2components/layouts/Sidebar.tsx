import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, Users, CheckSquare, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../stores/auth.store';
import { ThemeToggle } from '../shared/ThemeToggle';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Organizations', path: '/orgs' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Users, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 transition-colors">
      <div className="flex h-14 items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold">T</div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Taskify</span>
        <div className="ml-auto"><ThemeToggle /></div>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800" title="Sign out">
            <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </aside>
  );
};
