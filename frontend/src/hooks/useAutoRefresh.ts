/**
 * Auto-refresh hook for keeping raffle data up to date
 */

import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoRefresh(
  refreshFunction: () => void,
  options: UseAutoRefreshOptions = {}
) {
  const { interval = 30000, enabled = true } = options; // Default 30 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Set up interval
    intervalRef.current = setInterval(() => {
      refreshFunction();
    }, interval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshFunction, interval, enabled]);

  // Manual refresh function
  const refresh = () => {
    refreshFunction();
  };

  return { refresh };
}