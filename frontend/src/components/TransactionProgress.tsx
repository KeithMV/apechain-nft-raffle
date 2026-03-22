/**
 * Transaction Progress Component
 * Simple transaction status indicators with mobile-optimized UI
 */

import React from 'react';
import { getDeviceSettings } from '../config/mobileSafeWagmi';

interface TransactionProgressProps {
  isVisible: boolean;
  transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle';
  hash?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: Error | null;
}

const getTransactionMessages = (type: string, error?: Error | null) => {
  if (error) {
    return `Transaction failed: ${error.message}`;
  }
  
  const messages = {
    'buy-tickets': 'Processing ticket purchase...',
    'select-winner': 'Selecting winner...',
    'create-raffle': 'Creating raffle...',
    'cancel-raffle': 'Cancelling raffle...',
  };

  return messages[type as keyof typeof messages] || 'Processing transaction...';
};

export const TransactionProgress: React.FC<TransactionProgressProps> = ({
  isVisible,
  transactionType,
  hash,
  onCancel,
  onRetry,
  error,
}) => {
  if (!isVisible) return null;

  const message = getTransactionMessages(transactionType, error);
  const deviceSettings = getDeviceSettings();
  const isMobile = deviceSettings.isMobile;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
      <div className={`bg-white rounded-lg shadow-xl ${isMobile ? 'w-full max-w-sm' : 'w-96'} p-6`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            error ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {error ? (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
          </div>
          
          <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'} text-gray-900 mb-2`}>
            {error ? 'Transaction Failed' : 'Processing Transaction'}
          </h3>
          
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
            {error ? error.message : message}
          </p>
        </div>



        {/* Transaction Hash */}
        {hash && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              {hash}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          {error && onRetry && (
            <button
              onClick={onRetry}
              className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors ${
                isMobile ? 'text-base' : 'text-sm'
              }`}
            >
              Retry Transaction
            </button>
          )}
          
          {onCancel && !error && (
            <button
              onClick={onCancel}
              className={`flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors ${
                isMobile ? 'text-base' : 'text-sm'
              }`}
            >
              Cancel
            </button>
          )}
          
          {error && (
            <button
              onClick={onCancel}
              className={`flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors ${
                isMobile ? 'text-base' : 'text-sm'
              }`}
            >
              Close
            </button>
          )}
        </div>

        {/* Mobile-specific optimizations */}
        {isMobile && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Keep this tab open to monitor progress
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for managing transaction progress state
export const useTransactionProgress = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [transactionType, setTransactionType] = React.useState<'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle'>('buy-tickets');
  const [hash, setHash] = React.useState<string | undefined>();
  const [error, setError] = React.useState<Error | null>(null);

  const showProgress = React.useCallback((type: typeof transactionType) => {
    setTransactionType(type);
    setIsVisible(true);
    setError(null);
    setHash(undefined);
  }, []);

  const showError = React.useCallback((err: Error) => {
    setError(err);
  }, []);

  const hideProgress = React.useCallback(() => {
    setIsVisible(false);
    setError(null);
    setHash(undefined);
  }, []);

  return {
    isVisible,
    transactionType,
    hash,
    error,
    showProgress,
    showError,
    hideProgress,
  };
};