import { useConnectors } from 'wagmi';

// ApeChain compatible connector IDs
const APECHAIN_COMPATIBLE_CONNECTORS = [
  'metaMask',
  'walletConnect',
  'io.metamask',
  'com.coinbase.wallet',
  'me.rainbow'
];

// Connectors that definitely don't work with ApeChain
const BLOCKED_CONNECTORS = [
  'phantom',
  'keplr',
  'ledger',
  'trezor',
  'argent',
  'gnosis',
  'frame'
];

export function useApeChainConnectors() {
  const allConnectors = useConnectors();
  
  return allConnectors.filter(connector => {
    const connectorId = connector.id.toLowerCase();
    const connectorName = connector.name.toLowerCase();
    
    // Block known incompatible connectors
    if (BLOCKED_CONNECTORS.some(blocked => 
      connectorId.includes(blocked) || connectorName.includes(blocked)
    )) {
      return false;
    }
    
    // Allow known compatible connectors
    if (APECHAIN_COMPATIBLE_CONNECTORS.some(compatible => 
      connectorId.includes(compatible) || connectorName.includes(compatible)
    )) {
      return true;
    }
    
    // Default: allow (for future compatibility)
    return true;
  });
}

export function getConnectorDisplayInfo(connector: any) {
  const id = connector.id.toLowerCase();
  const name = connector.name;
  
  // Custom display info for better UX
  if (id.includes('metamask')) {
    return {
      name: 'MetaMask',
      description: 'Desktop & Mobile Browser',
      icon: '🦊',
      recommended: true
    };
  }
  
  if (id.includes('walletconnect')) {
    return {
      name: 'Mobile Wallets',
      description: 'Trust, Rainbow, Coinbase & more',
      icon: '🔗',
      recommended: true
    };
  }
  
  // Default display
  return {
    name: name,
    description: 'Custom Network Support Required',
    icon: '💼',
    recommended: false
  };
}