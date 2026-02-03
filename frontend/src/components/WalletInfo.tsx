import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { formatEther } from 'viem/utils';

export default function WalletInfo() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  // Get network-specific token info
  const getTokenInfo = () => {
    switch (chainId) {
      case 33139: // ApeChain
        return { symbol: 'APE', color: 'orange' };
      case 8453: // Base
        return { symbol: 'ETH', color: 'blue' };
      default:
        return { symbol: 'ETH', color: 'gray' };
    }
  };

  const tokenInfo = getTokenInfo();

  const loadBalance = async () => {
    if (!address || !publicClient) return;
    
    try {
      const bal = await publicClient.getBalance({ address: address as `0x${string}` });
      const formattedBalance = formatEther(bal);
      console.log(`Network: ${chainId}, ${tokenInfo.symbol} balance for ${address}:`, formattedBalance);
      console.log('Raw balance (wei):', bal.toString());
      setBalance(formattedBalance);
    } catch (error) {
      console.error(`Failed to load ${tokenInfo.symbol} balance:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address && publicClient) {
      setLoading(true);
      loadBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(loadBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address, publicClient, chainId]);



  if (!address) return null;

  const colorClasses = {
    orange: 'from-orange-400 to-red-500 text-orange-400',
    blue: 'from-blue-400 to-blue-600 text-blue-400',
    gray: 'from-gray-400 to-gray-600 text-gray-400'
  };

  return (
    <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 sm:px-3 py-2 min-h-[44px]">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <span className="text-slate-300 text-xs sm:text-sm font-medium">{tokenInfo.symbol}:</span>
      </div>
      {loading ? (
        <div className={`w-3 h-3 sm:w-4 sm:h-4 border border-${tokenInfo.color}-400 border-t-transparent rounded-full animate-spin shrink-0`}></div>
      ) : (
        <span className={`${colorClasses[tokenInfo.color as keyof typeof colorClasses].split(' ')[2]} font-mono font-semibold text-xs sm:text-sm truncate`}>
          {parseFloat(balance).toFixed(4)}
        </span>
      )}
    </div>
  );
}