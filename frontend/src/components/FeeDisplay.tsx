import React from 'react';
import { usePlatformFeeV4 } from '../hooks/useRaffleContractV4';

// Fee tier definitions
const FEE_TIERS = {
  PROMOTIONAL: { basisPoints: 100, percentage: 1, label: 'Promotional', color: 'green', useCase: 'Launch campaigns & special events' },
  COMPETITIVE: { basisPoints: 500, percentage: 5, label: 'Competitive', color: 'blue', useCase: 'Market standard pricing' },
  STANDARD: { basisPoints: 1000, percentage: 10, label: 'Standard', color: 'gray', useCase: 'Balanced revenue model' },
  PREMIUM: { basisPoints: 2000, percentage: 20, label: 'Premium', color: 'purple', useCase: 'Exclusive high-value events' },
} as const;

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