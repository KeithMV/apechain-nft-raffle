import React, { createContext, useContext, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getNetworkConfig, getContracts } from '../config/addresses';
import { CHAIN_IDS } from '../constants/chains';

interface NetworkTheme {
  primary: string;
  secondary: string;
  accent: string;
  logo: string;
  gradient: string;
}

interface NetworkContextType {
  chainId: number;
  networkName: string;
  nativeCurrency: string;
  explorerUrl: string;
  contracts: ReturnType<typeof getContracts>;
  isApeChain: boolean;
  isBase: boolean;
  theme: NetworkTheme;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const chainId = useChainId();
  
  const networkData = useMemo(() => {
    const config = getNetworkConfig(chainId);
    const contracts = getContracts(chainId);
    
    const isApeChain = chainId === CHAIN_IDS.APECHAIN_MAINNET || chainId === CHAIN_IDS.APECHAIN_TESTNET;
    const isBase = chainId === CHAIN_IDS.BASE_MAINNET || chainId === CHAIN_IDS.BASE_SEPOLIA;
    
    const theme: NetworkTheme = isApeChain 
      ? {
          primary: 'emerald',
          secondary: 'teal', 
          accent: 'cyan',
          logo: '',
          gradient: 'from-emerald-400 via-teal-300 to-cyan-400'
        }
      : {
          primary: 'blue',
          secondary: 'indigo',
          accent: 'purple', 
          logo: '',
          gradient: 'from-blue-400 via-indigo-300 to-purple-400'
        };
    
    // Set CSS custom properties for dynamic theming
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isApeChain) {
        root.style.setProperty('--network-primary', '#10b981'); // emerald-500
        root.style.setProperty('--network-primary-light', '#34d399'); // emerald-400
        root.style.setProperty('--network-border', 'rgba(52, 211, 153, 0.3)'); // emerald-400/30
        root.style.setProperty('--network-shadow', 'rgba(16, 185, 129, 0.2)'); // emerald-500/20
      } else {
        root.style.setProperty('--network-primary', '#3b82f6'); // blue-500
        root.style.setProperty('--network-primary-light', '#60a5fa'); // blue-400
        root.style.setProperty('--network-border', 'rgba(96, 165, 250, 0.3)'); // blue-400/30
        root.style.setProperty('--network-shadow', 'rgba(59, 130, 246, 0.2)'); // blue-500/20
      }
    }
    
    return {
      chainId,
      networkName: config.name,
      nativeCurrency: config.nativeCurrency,
      explorerUrl: config.explorerUrl,
      contracts,
      isApeChain,
      isBase,
      theme
    };
  }, [chainId]);

  return (
    <NetworkContext.Provider value={networkData}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};