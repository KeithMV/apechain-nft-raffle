/**
 * Dashboard Debug Script
 * Run this in browser console to diagnose Polygon loading issues
 */

// 1. Check current state
function debugDashboardState() {
  const state = {
    timestamp: new Date().toISOString(),
    chainId: window.ethereum?.chainId ? parseInt(window.ethereum.chainId, 16) : 'unknown',
    walletConnected: !!window.ethereum?.selectedAddress,
    address: window.ethereum?.selectedAddress,
    
    // Check localStorage for cached debug data
    cachedStates: Object.keys(localStorage)
      .filter(k => k.startsWith('dashboard-debug-'))
      .map(k => JSON.parse(localStorage.getItem(k) || '{}'))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    
    // Check React Query cache
    reactQueryCache: window.__REACT_QUERY_DEVTOOLS_CACHE__ || 'Not available',
    
    // Check network requests
    networkRequests: performance.getEntriesByType('resource')
      .filter(r => r.name.includes('alchemy') || r.name.includes('polygon') || r.name.includes('apechain'))
      .slice(-10)
  };
  
  console.log('🔍 [DASHBOARD-DEBUG] Current State:', state);
  return state;
}

// 2. Compare states between networks
function compareDashboardStates() {
  if (typeof window.compareDashboardStates === 'function') {
    return window.compareDashboardStates();
  } else {
    console.log('❌ Dashboard comparison function not available. Make sure dashboard is loaded.');
    return null;
  }
}

// 3. Clear all dashboard-related cache
function clearDashboardCache() {
  // Clear localStorage debug data
  Object.keys(localStorage)
    .filter(k => k.startsWith('dashboard-debug-'))
    .forEach(k => localStorage.removeItem(k));
  
  // Clear React Query cache if available
  if (window.queryClient) {
    window.queryClient.clear();
    console.log('✅ React Query cache cleared');
  }
  
  console.log('✅ Dashboard cache cleared');
}

// 4. Monitor network requests
function monitorNetworkRequests() {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('alchemy') || entry.name.includes('polygon') || entry.name.includes('apechain')) {
        console.log('🌐 [NETWORK]', {
          url: entry.name,
          duration: entry.duration,
          status: entry.responseStatus || 'unknown'
        });
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
  console.log('👀 Network monitoring started');
  
  return observer;
}

// 5. Test contract calls directly
async function testContractCalls() {
  if (!window.ethereum) {
    console.log('❌ No wallet detected');
    return;
  }
  
  const chainId = parseInt(window.ethereum.chainId, 16);
  const isPolygon = chainId === 137;
  
  console.log(`🧪 Testing contract calls on ${isPolygon ? 'Polygon' : 'ApeChain'} (${chainId})`);
  
  // Test basic RPC call
  try {
    const blockNumber = await window.ethereum.request({
      method: 'eth_blockNumber',
      params: []
    });
    console.log('✅ RPC working, block:', parseInt(blockNumber, 16));
  } catch (error) {
    console.log('❌ RPC failed:', error);
  }
  
  // Test contract addresses
  const addresses = {
    polygon: {
      factory: "0x5854AF7c836275c55469350a114F62a1609c4A42",
      template: "0xC7b41b9749724260B4264B90555c9417d66D655A"
    },
    apechain: {
      factory: "0x1627E7e63b63878E61f91D336385a59B1747934a",
      template: "0x242f56507BFd5034b369418A7C9FB1b4643710a4"
    }
  };
  
  const contractAddresses = isPolygon ? addresses.polygon : addresses.apechain;
  console.log('📋 Contract addresses:', contractAddresses);
  
  return { chainId, isPolygon, contractAddresses };
}

// 6. Main diagnostic function
async function runDashboardDiagnostic() {
  console.log('🚀 Starting Dashboard Diagnostic...');
  
  const state = debugDashboardState();
  const comparison = compareDashboardStates();
  const contractTest = await testContractCalls();
  
  const diagnostic = {
    state,
    comparison,
    contractTest,
    recommendations: []
  };
  
  // Generate recommendations
  if (state.chainId === 137) {
    diagnostic.recommendations.push('Polygon detected - check for slower loading times');
    diagnostic.recommendations.push('Monitor network requests for timeouts');
  }
  
  if (state.cachedStates.length > 3) {
    diagnostic.recommendations.push('Multiple cached states found - possible cache inconsistency');
  }
  
  if (!state.walletConnected) {
    diagnostic.recommendations.push('Wallet not connected - this may affect data loading');
  }
  
  console.log('📊 [DIAGNOSTIC-COMPLETE]', diagnostic);
  return diagnostic;
}

// Export functions to window for easy access
window.dashboardDebug = {
  debugState: debugDashboardState,
  compareStates: compareDashboardStates,
  clearCache: clearDashboardCache,
  monitorNetwork: monitorNetworkRequests,
  testContracts: testContractCalls,
  runDiagnostic: runDashboardDiagnostic
};

console.log('🛠️ Dashboard Debug Tools Loaded!');
console.log('Usage:');
console.log('  window.dashboardDebug.runDiagnostic() - Full diagnostic');
console.log('  window.dashboardDebug.debugState() - Current state');
console.log('  window.dashboardDebug.clearCache() - Clear all cache');
console.log('  window.dashboardDebug.monitorNetwork() - Monitor requests');