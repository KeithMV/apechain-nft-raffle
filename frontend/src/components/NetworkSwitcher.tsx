import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { apeChain, baseChain } from '../config/wagmi';
import { AddNetworkButton } from '../utils/addTestnet';
import { config as envConfig } from '../config/environment';

const SUPPORTED_CHAINS = [
  {
    ...apeChain,
    logo: '🦍',
    color: 'emerald'
  },
  {
    ...baseChain,
    logo: '🔵',
    color: 'blue'
  }
];

export const NetworkSwitcher: React.FC = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!isConnected) return null;

  const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  const otherChains = SUPPORTED_CHAINS.filter(chain => chain.id !== chainId);

  return (
    <div className="relative group z-50">
      <button className="flex items-center space-x-2 px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-xl hover:border-emerald-400/50 transition-all duration-200">
        <span className="text-lg">{currentChain?.logo || '⚠️'}</span>
        <span className="text-sm font-medium text-slate-300">
          {currentChain?.name || 'Unknown'}
        </span>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
        <div className="p-2">
          {otherChains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => switchChain({ chainId: chain.id })}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors duration-200 text-left"
            >
              <span className="text-lg">{chain.logo}</span>
              <div>
                <div className="text-sm font-medium text-slate-200">{chain.name}</div>
                <div className="text-xs text-slate-400">{chain.nativeCurrency.symbol}</div>
              </div>
            </button>
          ))}
          {envConfig.environment === 'staging' && (
            <div className="border-t border-slate-600/50 mt-2 pt-2">
              <AddNetworkButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};