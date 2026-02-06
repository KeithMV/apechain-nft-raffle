import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { apeTokenUtils } from '../hooks/useApeToken';

interface ApeTokenBalanceProps {
  requiredAmount?: string;
}

export default function ApeTokenBalance({ 
  requiredAmount
}: ApeTokenBalanceProps) {
  const { address } = useAccount();
  
  // Validate address format before using
  const isValidAddress = address && 
    typeof address === 'string' && 
    address.startsWith('0x') && 
    address.length === 42 && 
    /^0x[a-fA-F0-9]{40}$/.test(address);

  // APE token contract address on ApeChain
  const APE_TOKEN_ADDRESS = '0x4d224452801ACEd8B2F0aebE155379bb5D594381' as const;

  // Professional wagmi hook for APE token balance with error handling
  const { data: balanceData, isLoading: loading, error } = useBalance({
    address: isValidAddress ? (address as `0x${string}`) : undefined,
    token: APE_TOKEN_ADDRESS,
    query: {
      enabled: isValidAddress,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Handle case where address is invalid
  if (!address) {
    return (
      <div className="bg-slate-800/50 border border-yellow-400/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <span className="text-yellow-400 text-sm">⚠️</span>
          <span className="text-yellow-300 text-sm">Please connect your wallet</span>
        </div>
      </div>
    );
  }

  const balance = balanceData?.formatted || '0';
  const hasInsufficientBalance = requiredAmount && 
    !isNaN(parseFloat(balance)) && 
    !isNaN(parseFloat(requiredAmount)) && 
    parseFloat(balance) < parseFloat(requiredAmount);

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-300">Loading APE balance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 border border-red-400/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <span className="text-red-400 text-sm">❌</span>
          <div>
            <p className="text-red-300 text-sm font-medium">Failed to load APE balance</p>
            <p className="text-red-400/70 text-xs mt-1">Check your connection and try again</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
          </div>
          <span className="text-white font-semibold">APE Balance</span>
        </div>
        <span className="text-orange-400 font-mono font-bold">
          {(() => {
            try {
              return apeTokenUtils.formatApe(balance) + ' APE';
            } catch {
              return balance + ' APE';
            }
          })()}
        </span>
      </div>

      {requiredAmount && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Required:</span>
            <span className="text-white font-mono">{requiredAmount} APE</span>
          </div>

          {hasInsufficientBalance ? (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mt-3">
              <div className="flex items-center space-x-2">
                <span className="text-red-400 text-sm">❌</span>
                <p className="text-red-300 text-sm">
                  Insufficient APE balance. You need {(() => {
                    try {
                      const needed = parseFloat(requiredAmount) - parseFloat(balance);
                      return isNaN(needed) ? '0.000' : needed.toFixed(3);
                    } catch {
                      return '0.000';
                    }
                  })()} more APE.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 mt-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-sm">✅</span>
                <p className="text-green-300 text-sm">
                  Ready to purchase tickets
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}