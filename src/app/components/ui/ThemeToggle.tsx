'use client';

import { useTheme } from '@/app/contexts/ThemeContext';
import { BsMoonStars, BsSun } from 'react-icons/bs';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center">
      <span className="mr-2 text-gray-600 dark:text-gray-300">
        <BsSun className="w-5 h-5" />
      </span>
      <div
        className="relative inline-block w-12 h-6 transition-colors duration-300 rounded-full cursor-pointer"
        style={{
          backgroundColor: theme === 'dark' ? '#4f46e5' : '#D1D5DB', // Indigo-600 vs Gray-300
        }}
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out
                      ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}
        ></div>
      </div>
      <span className="ml-2 text-gray-600 dark:text-gray-300">
        <BsMoonStars className="w-5 h-5" />
      </span>
    </div>
  );
}
