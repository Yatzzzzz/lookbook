import React from 'react';
import { cn } from '@/lib/utils';

interface TextProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function HighContrastText({
  children,
  className,
  as: Component = 'p',
}: TextProps) {
  return (
    <Component
      className={cn(
        "text-foreground dark:text-white", 
        className
      )}
    >
      {children}
    </Component>
  );
}

export function MutedText({
  children,
  className,
  as: Component = 'p',
}: TextProps) {
  return (
    <Component
      className={cn(
        "text-gray-700 dark:text-gray-300",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function PrimaryText({
  children, 
  className,
  as: Component = 'p',
}: TextProps) {
  return (
    <Component
      className={cn(
        "text-blue-600 dark:text-blue-400",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function WhiteText({
  children,
  className,
  as: Component = 'span',
}: TextProps) {
  return (
    <Component
      className={cn(
        "text-white",
        className
      )}
    >
      {children}
    </Component>
  );
} 