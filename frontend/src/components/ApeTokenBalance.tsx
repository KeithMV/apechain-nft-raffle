import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';

interface ApeTokenBalanceProps {
  requiredAmount?: string;
}

export default function ApeTokenBalance({ 
  requiredAmount
}: ApeTokenBalanceProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address && publicClient) {
      loadBalance();
    }
  }, [address, publicClient]);

  const loadBalance = async () => {
    if (!address || !publicClient) return;
    
    setLoading(true);
    try {
      // Get native APE balance
      const balanceResult = await publicClient.getBalance({ address: address as `0x${string}` });
      setBalance(formatEther(balanceResult));
    } catch (error) {
      console.error('Failed to load APE balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasInsufficientBalance = requiredAmount && parseFloat(balance) < parseFloat(requiredAmount);

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

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">🐵</span>
          </div>
          <span className="text-white font-semibold">APE Balance</span>
        </div>
        <span className="text-orange-400 font-mono font-bold">
          {parseFloat(balance).toFixed(3)} APE
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
                  Insufficient APE balance. You need {(parseFloat(requiredAmount) - parseFloat(balance)).toFixed(3)} more APE.
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