import React, { useState, useEffect } from 'react';
import { feeManagementService, FEE_TIERS } from '../services/feeManagementService';

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
  const [currentFee, setCurrentFee] = useState({
    basisPoints: 500,
    percentage: 5,
    tier: FEE_TIERS.COMPETITIVE
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentFee();
  }, []);

  const loadCurrentFee = async () => {
    try {
      const fee = await feeManagementService.getCurrentPlatformFee();
      setCurrentFee(fee);
    } catch (error) {
      console.error('Failed to load fee:', error);
    } finally {
      setLoading(false);
    }
  };

  const feeDisplay = feeManagementService.formatFeeDisplay(currentFee.basisPoints);
  const breakdown = totalAmount > 0 ? 
    feeManagementService.calculateFeeAmount(totalAmount, currentFee.basisPoints) : null;

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

  return (
    <div className={`fee-display ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          Platform Fee:
        </span>
        <span className="font-semibold text-gray-900">
          {feeDisplay.percentage}
        </span>
        <span className={`
          px-2 py-1 text-xs font-medium rounded-full border
          ${getBadgeColor(feeDisplay.badge)}
        `}>
          {feeDisplay.description}
        </span>
      </div>

      {showBreakdown && breakdown && (
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total Sales:</span>
            <span className="font-medium">{totalAmount.toFixed(2)} APE</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee ({feeDisplay.percentage}):</span>
            <span className="font-medium">{breakdown.feeAmount.toFixed(2)} APE</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span>Creator Receives:</span>
            <span className="font-semibold text-green-600">
              {breakdown.creatorAmount.toFixed(2)} APE
            </span>
          </div>
        </div>
      )}

      {currentFee.tier && (
        <div className="mt-1 text-xs text-gray-500">
          {currentFee.tier.useCase}
        </div>
      )}
    </div>
  );
};

export default FeeDisplay;