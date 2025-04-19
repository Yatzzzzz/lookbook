'use client';

import { useTheme } from 'next-themes';
import { Button } from './button';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-black dark:text-yellow-300" />
      ) : (
        <Moon className="h-5 w-5 text-black dark:text-gray-100" />
      )}
    </Button>
  );
} 