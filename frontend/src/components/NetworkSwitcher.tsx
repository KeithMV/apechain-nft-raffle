import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { apeChain, baseChain } from '../config/wagmi';

const SUPPORTED_CHAINS = [
  {
    ...apeChain,
    logo: '',
    color: 'emerald'
  },
  {
    ...baseChain,
    logo: '',
    color: 'blue'
  }
];

export const NetworkSwitcher: React.FC = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isOpen, setIsOpen] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);

  if (!isConnected) return null;

  const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  const otherChains = SUPPORTED_CHAINS.filter(chain => chain.id !== chainId);

  const handleNetworkSwitch = async (chainId: number) => {
    setSwitching(true);
    try {
      await switchChain({ chainId });
      setIsOpen(false);
    } catch (error) {
      console.error('Network switch failed:', error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-xl hover:border-emerald-400/50 transition-all duration-200"
      >
        <span className="text-sm font-medium text-slate-300">
          {currentChain?.name || 'Unknown'}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50">
            <div className="p-2">
              {otherChains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleNetworkSwitch(chain.id)}
                  disabled={switching}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 active:bg-slate-700/70 transition-colors duration-200 text-left disabled:opacity-50"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200">{chain.name}</div>
                    <div className="text-xs text-slate-400">{chain.nativeCurrency.symbol}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};