import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Custom hook to apply high contrast text styling
 * This can be used in any component that needs to ensure text visibility
 */
export function useTextContrast() {
  const { theme, systemTheme } = useTheme();
  
  useEffect(() => {
    // Always use light mode
    const isDarkMode = false;
    
    // Apply high contrast styles based on light theme only
    document.documentElement.classList.toggle('high-contrast', true);
    document.documentElement.classList.toggle('dark-contrast', false);
    
    return () => {
      document.documentElement.classList.remove('high-contrast');
      document.documentElement.classList.remove('dark-contrast');
    };
  }, []);
  
  // Always return light theme
  return { theme: 'light', systemTheme: 'light' };
} 