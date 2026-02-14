import React from 'react';
import { usePlatformFeeV4 } from '../hooks/useRaffleContractV4';

// Fee tier definitions
const FEE_TIERS = {
  PROMOTIONAL: { basisPoints: 100, percentage: 1, label: 'Promotional', color: 'green', useCase: 'Launch campaigns & special events' },
  COMPETITIVE: { basisPoints: 500, percentage: 5, label: 'Competitive', color: 'blue', useCase: 'Market standard pricing' },
  STANDARD: { basisPoints: 1000, percentage: 10, label: 'Standard', color: 'gray', useCase: 'Balanced revenue model' },
  PREMIUM: { basisPoints: 2000, percentage: 20, label: 'Premium', color: 'purple', useCase: 'Exclusive high-value events' },
} as const;

type FeeTier = typeof FEE_TIERS[keyof typeof FEE_TIERS];

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
  const { data: platformFeeData, isLoading: loading, error } = usePlatformFeeV4();
  
  // Determine current fee tier
  const getCurrentFeeTier = (basisPoints: number): FeeTier => {
    switch (basisPoints) {
      case 100: return FEE_TIERS.PROMOTIONAL;
      case 500: return FEE_TIERS.COMPETITIVE;
      case 1000: return FEE_TIERS.STANDARD;
      case 2000: return FEE_TIERS.PREMIUM;
      default: return FEE_TIERS.COMPETITIVE;
    }
  };
  
  const currentFee = platformFeeData ? {
    basisPoints: Number(platformFeeData),
    percentage: Number(platformFeeData) / 100,
    tier: getCurrentFeeTier(Number(platformFeeData))
  } : {
    basisPoints: 500,
    percentage: 5,
    tier: FEE_TIERS.COMPETITIVE
  };

  const feeDisplay = {
    percentage: `${currentFee.percentage}%`,
    badge: currentFee.tier.color,
    description: currentFee.tier.label
  };
  
  const breakdown = totalAmount > 0 ? {
    feeAmount: isNaN(totalAmount) ? 0 : totalAmount * currentFee.percentage / 100,
    creatorAmount: isNaN(totalAmount) ? 0 : totalAmount * (1 - currentFee.percentage / 100)
  } : null;

  const getBadgeColor = (badge: string) => {
    const colors = {
      promotional: 'bg-green-100 text-green-800 border-green-200',
      competitive: 'bg-blue-100 text-blue-800 border-blue-200',
      standard: 'bg-gray-100 text-gray-800 border-gray-200',
      premium: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[badge as keyof typeof colors] || colors.standard;
  };

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