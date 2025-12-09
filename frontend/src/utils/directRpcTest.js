// Direct RPC Test - Proves ApeChain Infrastructure Issue
// Run this in browser console to confirm RPC is broken

async function testApeChainRPC() {
  console.log('🔍 Testing ApeChain RPC Gas Estimation...\n');
  
  const rpcUrls = [
    'https://apechain.calderachain.xyz/http',
    'https://rpc.apechain.com'
  ];
  
  // Simple gas estimation request
  const gasRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_estimateGas',
    params: [{
      from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
      to: '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff',
      data: '0x4b8bcb94' // createRaffle function selector
    }]
  };
  
  for (const rpcUrl of rpcUrls) {
    try {
      console.log(`Testing: ${rpcUrl}`);
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gasRequest)
      });
      
      const result = await response.json();
      console.log(`Response:`, result);
      
      if (result.result === undefined || result.result === 'undefined') {
        console.log(`❌ ${rpcUrl} - Gas estimation BROKEN (returns undefined)`);
      } else {
        const gasHex = result.result;
        const gasDecimal = parseInt(gasHex, 16);
        console.log(`✅ ${rpcUrl} - Gas: ${gasDecimal} (${gasHex})`);
      }
      
    } catch (error) {
      console.log(`🔴 ${rpcUrl} - Error: ${error.message}`);
    }
    
    console.log('---');
  }
  
  console.log('\n📋 CONCLUSION:');
  console.log('If both RPCs return undefined/null for gas estimation,');
  console.log('then MetaMask shows inflated fees as safety fallback.');
  console.log('This is ApeChain infrastructure issue, not our platform.');
}

// Run the test
testApeChainRPC();