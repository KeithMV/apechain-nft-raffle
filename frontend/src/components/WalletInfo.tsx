import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';

export default function WalletInfo() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [apeBalance, setApeBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address && publicClient) {
      loadApeBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(loadApeBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address, publicClient]);

  const loadApeBalance = async () => {
    if (!address || !publicClient) return;
    
    try {
      const balance = await publicClient.getBalance({ address: address as `0x${string}` });
      setApeBalance(formatEther(balance));
    } catch (error) {
      console.error('Failed to load APE balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!address) return null;

  return (
    <div className="flex items-center space-x-3 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">🐵</span>
        </div>
        <span className="text-slate-300 text-sm font-medium">APE:</span>
      </div>
      {loading ? (
        <div className="w-4 h-4 border border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <span className="text-orange-400 font-mono font-semibold text-sm">
          {parseFloat(apeBalance).toFixed(2)}
        </span>
      )}
    </div>
  );
}