/**
 * Professional APE Token Hooks
 * Uses wagmi React hooks for proper mobile Safari compatibility
 */

import { useReadContract } from 'wagmi';
import { APE_TOKEN_ADDRESS, APE_TOKEN_ABI } from '../config/contracts';
import { formatUnits } from 'viem/utils';

/**
 * Hook for reading APE token balance
 */
export function useApeBalance(address: string) {
  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: APE_TOKEN_ADDRESS as `0x${string}`,
    abi: APE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  const formattedBalance = balance ? formatUnits(balance as bigint, 18) : '0';

  return {
    balance: formattedBalance,
    rawBalance: balance as bigint,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading APE token decimals
 */
export function useApeDecimals() {
  return useReadContract({
    address: APE_TOKEN_ADDRESS as `0x${string}`,
    abi: APE_TOKEN_ABI,
    functionName: 'decimals',
  });
}

/**
 * Hook for reading APE token symbol
 */
export function useApeSymbol() {
  return useReadContract({
    address: APE_TOKEN_ADDRESS as `0x${string}`,
    abi: APE_TOKEN_ABI,
    functionName: 'symbol',
  });
}

/**
 * Utility functions for APE token formatting
 */
export const apeTokenUtils = {
  /**
   * Format APE amount for display
   */
  formatApe: (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    } else if (num >= 1) {
      return num.toFixed(2);
    } else {
      return num.toFixed(4);
    }
  },

  /**
   * Validate APE amount
   */
  validateAmount: (amount: string): { isValid: boolean; error?: string } => {
    const num = parseFloat(amount);
    if (isNaN(num)) {
      return { isValid: false, error: 'Invalid number' };
    }
    if (num <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }
    if (num > 1000000) {
      return { isValid: false, error: 'Amount too large' };
    }
    return { isValid: true };
  },
};