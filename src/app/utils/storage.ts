// Simple utilities for safely working with localStorage

export function safeStoreItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to store item in localStorage:', e);
    }
  }
  
  export function safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Failed to retrieve item from localStorage:', e);
      return null;
    }
  } 