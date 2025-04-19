'use client';

import { useEffect, useState } from 'react';

export default function DbInitializer() {
  const [status, setStatus] = useState<'initializing' | 'success' | 'error' | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        setStatus('initializing');
        const response = await fetch('/api/init-database');
        const data = await response.json();
        
        if (data.success) {
          console.log('Database initialized successfully');
          setStatus('success');
        } else {
          console.error('Error initializing database:', data.error);
          setStatus('error');
        }
      } catch (err) {
        console.error('Unexpected error initializing database:', err);
        setStatus('error');
      }
    };

    initDatabase();
  }, []);

  // This component doesn't render anything - it just runs the initialization
  return null;
} 