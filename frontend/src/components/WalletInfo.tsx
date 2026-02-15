import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { formatEther } from 'viem/utils';

// Pure function moved outside component
const getTokenInfo = (chainId: number) => {
  switch (chainId) {
    case 33139: // ApeChain
      return { symbol: 'APE', emoji: '🐵', color: 'orange' };
    case 137: // Polygon
      return { symbol: 'MATIC', emoji: '🔷', color: 'purple' };
    default:
      return { symbol: 'ETH', emoji: '⚡', color: 'gray' };
  }
};

const colorClasses = {
  orange: 'from-orange-400 to-red-500 text-orange-400',
  purple: 'from-purple-400 to-purple-600 text-purple-400',
  gray: 'from-gray-400 to-gray-600 text-gray-400'
} as const;

export default function WalletInfo() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  // Memoize token info to prevent recalculation
  const tokenInfo = useMemo(() => getTokenInfo(chainId), [chainId]);

  const loadBalance = useCallback(async () => {
    if (!address || !publicClient) return;
    
    try {
      const bal = await publicClient.getBalance({ address: address as `0x${string}` });
      const formattedBalance = formatEther(bal);
      // Only log in local development
      if (process.env.NODE_ENV === 'development' && 
          typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'))) {
        console.log(`Network: ${chainId}, ${tokenInfo.symbol} balance for ${address}:`, formattedBalance);
        console.log('Raw balance (wei):', bal.toString());
      }
      setBalance(formattedBalance);
    } catch (error) {
      console.error(`Failed to load ${tokenInfo.symbol} balance:`, error);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, chainId, tokenInfo.symbol]);

  useEffect(() => {
    if (address && publicClient) {
      setLoading(true);
      loadBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(loadBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address, publicClient, chainId, loadBalance]);



  if (!address) return null;

  return (
    <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 sm:px-3 py-2 min-h-[44px]">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <div className={`w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br ${colorClasses[tokenInfo.color as keyof typeof colorClasses].split(' ')[0]} ${colorClasses[tokenInfo.color as keyof typeof colorClasses].split(' ')[1]} rounded-full flex items-center justify-center shrink-0`}>
          <span className="text-white text-xs">{tokenInfo.emoji}</span>
        </div>
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