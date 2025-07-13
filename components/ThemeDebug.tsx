'use client';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';

export default function ThemeDebug() {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const hasDarkClass = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

  return (
    <div className="fixed top-20 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">Theme Debug</h3>
      <div className="text-sm space-y-1">
        <p className="text-gray-700 dark:text-gray-300">
          Redux Theme: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{theme}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          HTML Class: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{hasDarkClass ? 'dark' : 'no-dark'}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          localStorage: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
            {typeof window !== 'undefined' ? localStorage.getItem('theme') || 'null' : 'N/A'}
          </span>
        </p>
      </div>
    </div>
  );
} 