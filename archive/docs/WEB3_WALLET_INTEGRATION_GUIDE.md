# Web3 Wallet Integration - Complete Developer Guide

## Table of Contents
1. [The Right Web3 Stack (2024)](#the-right-web3-stack-2024)
2. [Best Practice Architecture](#best-practice-architecture)
3. [Mobile Safari Best Practices](#mobile-safari-best-practices)
4. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
5. [Production Checklist](#production-checklist)
6. [Advanced Patterns](#advanced-patterns)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## The Right Web3 Stack (2024)

### Core Libraries (The Foundation)
```bash
npm install wagmi viem @tanstack/react-query
```

**Why these libraries?**
- **Wagmi** - React hooks for Ethereum (industry standard, used by Uniswap, Aave)
- **Viem** - TypeScript Ethereum library (modern replacement for ethers.js)
- **React Query** - State management for async blockchain data

### Wallet Connectors
```bash
npm install @wagmi/connectors
```

**Essential connectors for production:**
- **MetaMask** - Browser extension + mobile app (80% of users)
- **WalletConnect** - Universal mobile wallet connections
- **Coinbase Wallet** - Built-in browser wallet
- **Injected** - Fallback for other browser wallets

---

## Best Practice Architecture

### Step 1: Configuration Layer
```typescript
// config/wagmi.ts
import { createConfig, http } from 'wagmi';
import { metaMask, walletConnect, coinbaseWallet, injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

// Define your custom chain
export const yourChain = defineChain({
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { http: ['https://apechain.calderachain.xyz/http'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
});

// Create wagmi configuration
export const config = createConfig({
  chains: [yourChain],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Your App Name',
        url: 'https://yourapp.com',
      },
    }),
    walletConnect({
      projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID!,
      metadata: {
        name: 'Your App Name',
        description: 'Your app description',
        url: 'https://yourapp.com',
        icons: ['https://yourapp.com/icon.png'],
      },
    }),
    coinbaseWallet({
      appName: 'Your App Name',
      appLogoUrl: 'https://yourapp.com/icon.png',
    }),
    injected(), // Fallback for other wallets
  ],
  transports: {
    [yourChain.id]: http('https://your-rpc-url.com'),
  },
});
```

### Step 2: Provider Setup
```typescript
// App.tsx
import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <YourApp />
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Step 3: Connection Component
```typescript
// components/WalletConnection.tsx
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { yourChain } from '../config/wagmi';

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showConnectors, setShowConnectors] = useState(false);

  const isWrongNetwork = isConnected && chainId !== yourChain.id;

  const handleConnect = (connector: any) => {
    connect({ connector });
    setShowConnectors(false);
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: yourChain.id });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Connected state
  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Switch Network
          </button>
        )}
        
        <div className="flex items-center space-x-2 bg-gray-100 rounded px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-mono">
            {address ? formatAddress(address) : ''}
          </span>
        </div>
        
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Connection state
  if (showConnectors) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 bg-white border rounded-lg p-3 shadow-lg z-50">
          <div className="text-sm font-medium mb-2">Choose Wallet:</div>
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded mb-1"
            >
              {connector.name}
            </button>
          ))}
          <button
            onClick={() => setShowConnectors(false)}
            className="w-full px-3 py-1 text-gray-500 text-xs mt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error.message}
        </div>
      )}
      <button
        onClick={() => setShowConnectors(true)}
        disabled={isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}
```

---

## Mobile Safari Best Practices

### 1. MetaMask Mobile Integration
```typescript
metaMask({
  dappMetadata: {
    name: 'Your App Name',
    url: 'https://yourapp.com',
  },
})
```

**How it works:**
- Desktop: Uses browser extension
- Mobile: Deep links to MetaMask mobile app
- Fallback: Prompts user to install MetaMask

### 2. WalletConnect for Universal Mobile
```typescript
walletConnect({
  projectId: 'your-walletconnect-project-id',
  metadata: {
    name: 'Your App Name',
    description: 'Your app description',
    url: 'https://yourapp.com',
    icons: ['https://yourapp.com/icon.png'],
  },
})
```

**Mobile flow:**
1. User clicks connect
2. QR code appears (desktop) or deep link opens (mobile)
3. User approves in their wallet app
4. Returns to your app connected

### 3. Network Auto-Add Utility
```typescript
// utils/addNetwork.ts
export const addNetworkToWallet = async (networkConfig: any) => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    } catch (error) {
      console.error('Failed to add network:', error);
      throw error;
    }
  }
};

// Usage
const apeChainConfig = {
  chainId: '0x8133', // 33139 in hex
  chainName: 'ApeChain',
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrls: ['https://apechain.calderachain.xyz/http'],
  blockExplorerUrls: ['https://apechain.calderaexplorer.xyz'],
};
```

---

## Common Mistakes to Avoid

### ❌ Wrong Approaches

1. **Using ethers.js directly**
   ```typescript
   // DON'T DO THIS
   const provider = new ethers.providers.Web3Provider(window.ethereum);
   
   // DO THIS INSTEAD
   const { data } = useBalance({ address });
   ```

2. **Manual provider detection**
   ```typescript
   // DON'T DO THIS
   if (window.ethereum) {
     // Manual connection logic
   }
   
   // DO THIS INSTEAD
   const { connect, connectors } = useConnect();
   ```

3. **Complex connector logic**
   ```typescript
   // DON'T DO THIS
   const detectWallet = () => {
     if (window.ethereum?.isMetaMask) return 'metamask';
     if (window.ethereum?.isCoinbaseWallet) return 'coinbase';
     // ... complex detection
   };
   
   // DO THIS INSTEAD
   // Let wagmi handle connector detection
   ```

4. **Hardcoded configuration**
   ```typescript
   // DON'T DO THIS
   const projectId = '2f05a7cde2bb14b518a6484396a6fda8';
   
   // DO THIS INSTEAD
   const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;
   ```

### ❌ Outdated Libraries
- **web3.js** → Use viem instead
- **ethers.js** → Use viem instead  
- **Old wagmi versions** → Use v2+ only

---

## Production Checklist

### ✅ Security
- [ ] Environment variables for all sensitive data
- [ ] Input validation on all user inputs
- [ ] Proper error boundaries in React
- [ ] Rate limiting on RPC calls
- [ ] HTTPS only in production
- [ ] Content Security Policy headers

### ✅ User Experience
- [ ] Loading states for all async operations
- [ ] Clear error messages with actionable steps
- [ ] Mobile-responsive design
- [ ] Wallet connection persistence across sessions
- [ ] Network switching with user guidance
- [ ] Graceful fallbacks for unsupported wallets

### ✅ Performance
- [ ] Lazy load wallet connectors
- [ ] Cache blockchain data appropriately
- [ ] Optimize RPC calls (batch when possible)
- [ ] Use React.memo for expensive components
- [ ] Implement proper loading skeletons
- [ ] Monitor and optimize bundle size

### ✅ Testing
- [ ] Test on all major wallets (MetaMask, Coinbase, Trust)
- [ ] Test on all devices (iOS Safari, Android Chrome, Desktop)
- [ ] Test network switching scenarios
- [ ] Test connection/disconnection flows
- [ ] Test error scenarios (rejected transactions, network errors)

---

## Advanced Patterns

### 1. Custom Hook for Wallet State
```typescript
// hooks/useWallet.ts
import { useAccount, useChainId } from 'wagmi';
import { yourChain } from '../config/wagmi';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const isWrongNetwork = isConnected && chainId !== yourChain.id;
  const isReady = isConnected && !isWrongNetwork;
  
  return {
    address,
    isConnected,
    isWrongNetwork,
    isReady,
    chainId,
  };
}
```

### 2. Transaction Hook with Error Handling
```typescript
// hooks/useTransaction.ts
import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { writeContract } = useWriteContract();
  
  const executeTransaction = async (config: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const hash = await writeContract(config);
      
      // Wait for confirmation
      const receipt = await useWaitForTransactionReceipt({ hash });
      
      return receipt;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    executeTransaction,
    isLoading,
    error,
  };
}
```

### 3. Connection Persistence
```typescript
// hooks/useConnectionPersistence.ts
import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

export function useConnectionPersistence() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  useEffect(() => {
    const lastConnector = localStorage.getItem('lastWalletConnector');
    
    if (lastConnector && !isConnected) {
      const connector = connectors.find(c => c.id === lastConnector);
      if (connector) {
        connect({ connector });
      }
    }
  }, [connect, connectors, isConnected]);
  
  useEffect(() => {
    if (isConnected) {
      // Save successful connection
      const currentConnector = connectors.find(c => c.id);
      if (currentConnector) {
        localStorage.setItem('lastWalletConnector', currentConnector.id);
      }
    } else {
      // Clear on disconnect
      localStorage.removeItem('lastWalletConnector');
    }
  }, [isConnected, connectors]);
}
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Provider not found" on Mobile Safari
**Problem:** Mobile Safari doesn't have injected providers
**Solution:** Use MetaMask SDK or WalletConnect

#### 2. Network switching fails
**Problem:** User rejects network addition
**Solution:** Provide clear instructions and fallback options

#### 3. Connection persists after disconnect
**Problem:** Wagmi cache not clearing properly
**Solution:** Clear localStorage and reset wagmi state

#### 4. Slow RPC responses
**Problem:** Public RPC endpoints are overloaded
**Solution:** Use multiple RPC endpoints with fallbacks

#### 5. Transaction fails silently
**Problem:** Insufficient error handling
**Solution:** Implement comprehensive error catching and user feedback

### Debug Tools
```typescript
// Add to your app for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Wagmi Config:', config);
  console.log('Available Connectors:', connectors);
  console.log('Current Chain:', chainId);
}
```

---

## Resources for Further Learning

### Official Documentation
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [WalletConnect Documentation](https://docs.walletconnect.com)

### Example Projects
- [Uniswap Interface](https://github.com/Uniswap/interface) - Production Web3 app
- [Aave Interface](https://github.com/aave/interface) - DeFi protocol interface
- [Wagmi Examples](https://github.com/wagmi-dev/wagmi/tree/main/examples) - Official examples

### Best Practices
1. **Start simple** - Get basic connection working first
2. **Test extensively** - Every wallet, every device
3. **Handle errors gracefully** - Users will encounter issues
4. **Monitor usage** - Track connection success rates
5. **Stay updated** - Web3 ecosystem evolves rapidly

---

## Your Current Project Analysis

### ✅ What You're Doing Right
- Using wagmi + viem (correct modern stack)
- Multiple connector support for different wallets
- Custom chain configuration for ApeChain
- Proper TypeScript usage

### 🔧 Areas for Improvement
- Add comprehensive error boundaries
- Implement connection persistence
- Add proper loading states throughout
- Improve mobile UX with better responsive design
- Add transaction confirmation feedback
- Implement retry logic for failed operations

### 📈 Next Steps
1. **Master the wagmi hooks** - useAccount, useConnect, useWriteContract
2. **Study successful dApps** - Look at Uniswap, Aave source code
3. **Test rigorously** - All wallets, all devices, all scenarios
4. **Monitor and iterate** - Use analytics to improve UX

Remember: **Simplicity is key**. Let wagmi handle the complexity, focus on great user experience!