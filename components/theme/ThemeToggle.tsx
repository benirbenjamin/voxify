'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
        theme === 'light'
          ? 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800 shadow-sm'
          : 'bg-slate-800/90 text-amber-300 border-slate-700 hover:bg-slate-700 shadow-sm'
      } ${className}`}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label="Toggle Theme Mode"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-purple-400 shrink-0" />
          {showLabel && <span className="text-xs font-bold">Dark Mode</span>}
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          {showLabel && <span className="text-xs font-bold text-slate-200">Light Mode</span>}
        </>
      )}
    </button>
  );
}
