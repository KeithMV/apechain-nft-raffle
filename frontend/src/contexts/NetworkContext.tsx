import React, { createContext, useContext, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getNetworkConfig, getContracts } from '../config/addresses';

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
    
    const isApeChain = chainId === 33139 || chainId === 33111;
    const isBase = chainId === 8453 || chainId === 84532;
    
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