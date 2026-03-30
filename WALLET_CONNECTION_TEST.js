// SIMPLE WALLET CONNECTION TEST
// Add this to the browser console to test wallet connection

const testWalletConnection = () => {
  console.log('🧪 [WALLET-TEST] Starting wallet connection test...');
  
  // Test 1: Check if window.ethereum exists
  console.log('🔍 [WALLET-TEST] window.ethereum exists:', !!window.ethereum);
  
  // Test 2: Check current network
  if (window.ethereum) {
    window.ethereum.request({ method: 'eth_chainId' })
      .then(chainId => {
        console.log('🔍 [WALLET-TEST] Current chain ID:', chainId, 'Decimal:', parseInt(chainId, 16));
      })
      .catch(err => {
        console.error('❌ [WALLET-TEST] Failed to get chain ID:', err);
      });
      
    // Test 3: Check accounts
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        console.log('🔍 [WALLET-TEST] Connected accounts:', accounts);
      })
      .catch(err => {
        console.error('❌ [WALLET-TEST] Failed to get accounts:', err);
      });
  }
  
  // Test 4: Check React Query cache
  const queryClient = window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.queryClient;
  if (queryClient) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    console.log('🔍 [WALLET-TEST] React Query cache entries:', queries.length);
    
    const dashboardQueries = queries.filter(q => 
      q.queryKey.some(key => 
        typeof key === 'string' && (key.includes('positions') || key.includes('created'))
      )
    );
    
    console.log('🔍 [WALLET-TEST] Dashboard-related queries:', dashboardQueries.map(q => ({
      key: q.queryKey,
      state: q.state.status,
      dataUpdatedAt: new Date(q.state.dataUpdatedAt).toISOString(),
      data: q.state.data ? (Array.isArray(q.state.data) ? `Array(${q.state.data.length})` : 'Object') : 'null'
    })));
  }
};

// Run the test
testWalletConnection();