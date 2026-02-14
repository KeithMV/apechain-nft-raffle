import React from 'react';
import { useAccount, useChainId } from 'wagmi';
import { NETWORK_CONFIGS } from '../config/addresses';
import { CHAIN_IDS } from '../constants/chains';

export default function NetworkStatus() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) return null;

  const networkConfig = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
  const isApeChain = chainId === CHAIN_IDS.APECHAIN_MAINNET;
  const isBase = chainId === CHAIN_IDS.BASE_MAINNET;
  const isSupportedNetwork = isApeChain || isBase;

  return (
    <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium min-h-[44px] ${
      isSupportedNetwork 
        ? isApeChain
          ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
          : 'bg-blue-500/20 border border-blue-400/50 text-blue-300'
        : 'bg-red-500/20 border border-red-400/50 text-red-300'
    }`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        isSupportedNetwork 
          ? isApeChain 
            ? 'bg-emerald-400 animate-pulse' 
            : 'bg-blue-400 animate-pulse'
          : 'bg-red-400 animate-pulse'
      }`}></div>
      <span className="truncate">
        {networkConfig ? networkConfig.name : `Chain ${chainId}`}
      </span>
      {!isSupportedNetwork && (
        <span className="text-xs opacity-75 hidden sm:inline">(Switch)</span>
      )}
    </div>
  );
}