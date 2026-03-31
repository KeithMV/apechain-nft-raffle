/**
 * Debug Script for Stuck "Processing" Issue
 * Run this in browser console when a purchase gets stuck
 */

// 1. Check current transaction state
function debugTransactionState() {
  console.log('🔍 DEBUGGING TRANSACTION STATE...');
  console.log('=====================================');
  
  // Check if there are any pending transactions
  const pendingTxs = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('eth_') || r.name.includes('polygon') || r.name.includes('alchemy'))
    .slice(-10);
  
  console.log('Recent RPC calls:', pendingTxs);
  
  // Check React Query cache for stuck states
  if (window.queryClient) {
    const cache = window.queryClient.getQueryCache();
    const queries = cache.getAll();
    const raffleQueries = queries.filter(q => 
      q.queryKey.some(key => 
        typeof key === 'string' && 
        (key.includes('raffle') || key.includes('ticket') || key.includes('user'))
      )
    );
    
    console.log('Active raffle queries:', raffleQueries.length);
    raffleQueries.forEach(q => {
      console.log('Query:', q.queryKey, 'State:', q.state.status, 'Fetching:', q.state.isFetching);
    });
  }
  
  // Check localStorage for any stuck states
  const localStorageKeys = Object.keys(localStorage).filter(k => 
    k.includes('raffle') || k.includes('ticket') || k.includes('processing')
  );
  console.log('LocalStorage raffle keys:', localStorageKeys);
  
  return {
    pendingTxs: pendingTxs.length,
    raffleQueries: raffleQueries?.length || 0,
    localStorageKeys
  };
}

// 2. Check wallet connection and network
async function debugWalletState() {
  console.log('🔍 DEBUGGING WALLET STATE...');
  console.log('=====================================');
  
  if (!window.ethereum) {
    console.log('❌ No wallet detected');
    return null;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const balance = await window.ethereum.request({ 
      method: 'eth_getBalance', 
      params: [accounts[0], 'latest'] 
    });
    
    const walletState = {
      connected: accounts.length > 0,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      balance: parseInt(balance, 16) / 1e18
    };
    
    console.log('Wallet state:', walletState);
    
    // Check if we're on the right network
    const expectedChains = [33139, 137]; // ApeChain, Polygon
    if (!expectedChains.includes(walletState.chainId)) {
      console.log('⚠️ Wrong network! Expected ApeChain (33139) or Polygon (137)');
    }
    
    return walletState;
  } catch (error) {
    console.error('❌ Wallet state check failed:', error);
    return null;
  }
}

// 3. Test RPC connectivity
async function debugRPCConnectivity() {
  console.log('🔍 DEBUGGING RPC CONNECTIVITY...');
  console.log('=====================================');
  
  const rpcEndpoints = {
    apechain: 'https://apechain.calderachain.xyz/http',
    polygon: 'https://polygon-mainnet.g.alchemy.com/v2/AyuLQ-1xvN148vswTZxHo'
  };
  
  const results = {};
  
  for (const [network, url] of Object.entries(rpcEndpoints)) {
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      results[network] = {
        status: response.ok ? 'OK' : 'ERROR',
        duration: `${duration}ms`,
        blockNumber: data.result ? parseInt(data.result, 16) : null,
        error: data.error || null
      };
      
      console.log(`${network.toUpperCase()} RPC:`, results[network]);
    } catch (error) {
      results[network] = {
        status: 'FAILED',
        error: error.message
      };
      console.log(`${network.toUpperCase()} RPC:`, results[network]);
    }
  }
  
  return results;
}

// 4. Clear stuck states
function clearStuckStates() {
  console.log('🧹 CLEARING STUCK STATES...');
  console.log('=====================================');
  
  // Clear React Query cache
  if (window.queryClient) {
    window.queryClient.clear();
    console.log('✅ Cleared React Query cache');
  }
  
  // Clear relevant localStorage
  const keysToRemove = Object.keys(localStorage).filter(k => 
    k.includes('raffle') || k.includes('ticket') || k.includes('processing')
  );
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('✅ Removed localStorage key:', key);
  });
  
  // Force page refresh to reset all states
  console.log('🔄 Refreshing page to reset all states...');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// 5. Main diagnostic function
async function runPurchaseDebug() {
  console.log('🚀 STARTING PURCHASE DEBUG...');
  console.log('=====================================');
  
  const txState = debugTransactionState();
  console.log('');
  
  const walletState = await debugWalletState();
  console.log('');
  
  const rpcState = await debugRPCConnectivity();
  console.log('');
  
  console.log('📊 SUMMARY:');
  console.log('=====================================');
  console.log('Transaction state:', txState);
  console.log('Wallet state:', walletState);
  console.log('RPC connectivity:', rpcState);
  
  // Provide recommendations
  console.log('');
  console.log('💡 RECOMMENDATIONS:');
  console.log('=====================================');
  
  if (txState.pendingTxs > 5) {
    console.log('⚠️ Many pending RPC calls - possible network congestion');
  }
  
  if (txState.raffleQueries > 10) {
    console.log('⚠️ Many active queries - possible memory leak');
  }
  
  if (walletState && walletState.balance < 0.01) {
    console.log('⚠️ Low balance - may not have enough for gas fees');
  }
  
  const failedRPCs = Object.entries(rpcState).filter(([_, state]) => state.status !== 'OK');
  if (failedRPCs.length > 0) {
    console.log('⚠️ RPC connectivity issues:', failedRPCs.map(([name]) => name));
  }
  
  console.log('');
  console.log('🔧 TO FIX STUCK PROCESSING:');
  console.log('1. Run clearStuckStates() to reset all states');
  console.log('2. Check wallet connection and switch networks if needed');
  console.log('3. Try the purchase again');
  
  return {
    txState,
    walletState,
    rpcState,
    recommendations: {
      clearStates: txState.raffleQueries > 10 || txState.pendingTxs > 5,
      checkBalance: walletState && walletState.balance < 0.01,
      checkNetwork: walletState && ![33139, 137].includes(walletState.chainId),
      checkRPC: failedRPCs.length > 0
    }
  };
}

// Export to window for easy access
if (typeof window !== 'undefined') {
  window.purchaseDebug = {
    runPurchaseDebug,
    debugTransactionState,
    debugWalletState,
    debugRPCConnectivity,
    clearStuckStates
  };
  
  console.log('🛠️ Purchase Debug Tools Loaded!');
  console.log('Usage:');
  console.log('  window.purchaseDebug.runPurchaseDebug() - Full diagnostic');
  console.log('  window.purchaseDebug.clearStuckStates() - Reset stuck states');
}