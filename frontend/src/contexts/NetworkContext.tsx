import React, { createContext, useContext, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getNetworkConfig } from '../config/networks';
import { getContracts } from '../config/addresses';
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
  isPolygon: boolean;
  theme: NetworkTheme;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const chainId = useChainId();
  
  const networkData = useMemo(() => {
    const config = getNetworkConfig(chainId);
    const contracts = getContracts(chainId);
    
    const isApeChain = chainId === CHAIN_IDS.APECHAIN_MAINNET || chainId === CHAIN_IDS.APECHAIN_TESTNET;
    const isPolygon = chainId === CHAIN_IDS.POLYGON_MAINNET;
    
    const theme: NetworkTheme = isApeChain 
      ? {
          primary: 'emerald',
          secondary: 'teal', 
          accent: 'cyan',
          logo: '🦍',
          gradient: 'from-emerald-400 via-teal-300 to-cyan-400'
        }
      : isPolygon
      ? {
          primary: 'purple',
          secondary: 'violet',
          accent: 'indigo', 
          logo: '🔷',
          gradient: 'from-purple-400 via-violet-300 to-indigo-400'
        }
      : {
          primary: 'emerald',
          secondary: 'teal',
          accent: 'cyan', 
          logo: '🦍',
          gradient: 'from-emerald-400 via-teal-300 to-cyan-400'
        };
    
    // Set CSS custom properties for dynamic theming
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isApeChain) {
        root.style.setProperty('--network-primary', '#10b981'); // emerald-500
        root.style.setProperty('--network-primary-light', '#34d399'); // emerald-400
        root.style.setProperty('--network-border', 'rgba(52, 211, 153, 0.3)'); // emerald-400/30
        root.style.setProperty('--network-shadow', 'rgba(16, 185, 129, 0.2)'); // emerald-500/20
      } else if (isPolygon) {
        root.style.setProperty('--network-primary', '#a855f7'); // purple-500
        root.style.setProperty('--network-primary-light', '#c084fc'); // purple-400
        root.style.setProperty('--network-border', 'rgba(192, 132, 252, 0.3)'); // purple-400/30
        root.style.setProperty('--network-shadow', 'rgba(168, 85, 247, 0.2)'); // purple-500/20
      } else {
        // Default to ApeChain styling for unsupported networks
        root.style.setProperty('--network-primary', '#10b981'); // emerald-500
        root.style.setProperty('--network-primary-light', '#34d399'); // emerald-400
        root.style.setProperty('--network-border', 'rgba(52, 211, 153, 0.3)'); // emerald-400/30
        root.style.setProperty('--network-shadow', 'rgba(16, 185, 129, 0.2)'); // emerald-500/20
      }
    }
    
    return {
      chainId,
      networkName: config.name,
      nativeCurrency: config.nativeCurrency,
      explorerUrl: config.explorerUrl,
      contracts,
      isApeChain,
      isPolygon,
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