import React from 'react';
import { usePlatformFeeV4 } from '../hooks/useRaffleContractV4';

interface FeeDisplayProps {
  totalAmount?: number;
  showBreakdown?: boolean;
  className?: string;
}

export const FeeDisplay: React.FC<FeeDisplayProps> = ({ 
  totalAmount = 0, 
  showBreakdown = false,
  className = ""
}) => {
  // Professional wagmi hook with error handling
  const { isLoading: loading, error } = usePlatformFeeV4();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        <span>⚠️ Unable to load fee information</span>
      </div>
    );
  }

  return (
    <div className={`fee-display ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          Platform Fee:
        </span>
        <span className="font-semibold text-gray-900">
          5%
        </span>
      </div>
    </div>
  );
};

export default FeeDisplay;