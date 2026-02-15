import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'blue' | 'white' | 'red';
  className?: string;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4', 
  lg: 'w-5 h-5'
};

const colorClasses = {
  emerald: 'border-emerald-400',
  blue: 'border-blue-400',
  white: 'border-white',
  red: 'border-red-400'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'emerald',
  className = ''
}) => {
  return (
    <div 
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin ${className}`}
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;