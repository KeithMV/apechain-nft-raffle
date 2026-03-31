import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { apeChain, polygonChain, getQueryConfig } from './unified';
import { WALLET_IDS } from '../constants/chains';

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Unified metadata
const metadata = {
  name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain and Polygon',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};



// Device detection utility (runtime)
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    ? 'mobile' : 'desktop';
};

// Simplified wagmi configuration
const createWagmiConfig = () => {
  console.log('🔧 Creating unified multichain configuration');
  
  return defaultWagmiConfig({
    chains: [apeChain, polygonChain],
    projectId,
    metadata,
    ssr: false,
    syncConnectedChain: true,
    enableEIP6963: true,
    enableCoinbase: true,
  });
};

// Export single unified config
export const config = createWagmiConfig();

// Re-export from unified config
export const getChainQueryConfig = getQueryConfig;

export const getWalletConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  return {
    featuredWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined,
    
    includeWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined,
    
    excludeWalletIds: isMobile ? [
      WALLET_IDS.COINBASE,
      WALLET_IDS.LEDGER,
    ] : [],
  };
};

// Re-export utilities from unified config
export { 
  isApeChain, 
  isPolygonChain, 
  isSupportedChain, 
  getChainName,
  getChainConfig,
  getOperationConfig
} from './unified';

