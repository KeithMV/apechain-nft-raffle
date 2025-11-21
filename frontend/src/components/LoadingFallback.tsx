/**
 * Professional loading fallback component for lazy-loaded routes
 * Provides consistent UX during code splitting loads
 */

import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  minimal?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Loading...", 
  minimal = false 
}) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-sm animate-pulse"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-slate-300 font-medium">{message}</p>
      </div>
    </div>
  );
};

export const ComponentLoadingFallback: React.FC = () => (
  <LoadingFallback message="Loading component..." minimal />
);

export const PageLoadingFallback: React.FC = () => (
  <LoadingFallback message="Loading page..." />
);

export default LoadingFallback;