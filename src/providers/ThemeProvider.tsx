'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply high contrast class to HTML element for global styling
  useEffect(() => {
    // Add high contrast to enhance text visibility
    document.documentElement.classList.add('high-contrast');
    
    return () => {
      document.documentElement.classList.remove('high-contrast');
    };
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {mounted && children}
    </NextThemesProvider>
  );
} 