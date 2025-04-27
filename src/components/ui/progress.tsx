import * as React from "react";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
}

export function Progress({
  value,
  max = 100,
  className = "",
  indicatorClassName = "",
  label,
}: ProgressProps) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{percentage}%</span>
        </div>
      )}
      <div className={`w-full h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 ${className}`}>
        <div 
          className={`h-2.5 bg-blue-600 rounded-full dark:bg-blue-500 transition-all ${indicatorClassName}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
} 