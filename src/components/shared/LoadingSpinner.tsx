import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 24, className = '' }: LoadingSpinnerProps) {
  // Convert string sizes to numbers
  let sizeValue = size;
  if (size === 'sm') sizeValue = 16;
  if (size === 'md') sizeValue = 24;
  if (size === 'lg') sizeValue = 32;
  
  return (
    <Loader2 
      className={`animate-spin text-primary ${className}`}
      size={typeof sizeValue === 'number' ? sizeValue : 24}
    />
  );
} 