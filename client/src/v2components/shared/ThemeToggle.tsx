import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const isDark = theme === 'dark';
  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <button onClick={toggle} aria-label="Toggle theme" className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
};
