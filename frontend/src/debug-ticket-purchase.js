/**
 * Debug Script for Ticket Purchase Issues
 * Run this in browser console to diagnose the problem
 */

// Test environment variables
console.log('🔍 Environment Variables:');
console.log('REACT_APP_ALCHEMY_API_KEY:', process.env.REACT_APP_ALCHEMY_API_KEY);
console.log('REACT_APP_ALCHEMY_GAS_KEY:', process.env.REACT_APP_ALCHEMY_GAS_KEY);

// Test Alchemy API directly
async function testAlchemyAPI() {
  const apiKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  if (!apiKey) {
    console.error('❌ No Alchemy API key found');
    return;
  }
  
  try {
    const response = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    
    const data = await response.text();
    console.log('✅ Alchemy API Response:', data);
    
    try {
      const json = JSON.parse(data);
      console.log('✅ Alchemy API working, block number:', parseInt(json.result, 16));
    } catch (e) {
      console.error('❌ Alchemy API returned non-JSON:', data);
    }
  } catch (error) {
    console.error('❌ Alchemy API Error:', error);
  }
}

// Test gas oracle
async function testGasOracle() {
  try {
    const { alchemyGasOracle } = await import('./utils/alchemyGasOracle');
    console.log('🔍 Testing Gas Oracle...');
    
    const gasEstimate = await alchemyGasOracle.getOptimalGas('buy-tickets');
    console.log('✅ Gas Oracle Response:', gasEstimate);
  } catch (error) {
    console.error('❌ Gas Oracle Error:', error);
  }
}

// Test transaction manager
async function testTransactionManager() {
  try {
    console.log('🔍 Testing Transaction Manager...');
    
    // Check if wagmi hooks are working
    const { useAccount, useChainId } = await import('wagmi');
    console.log('✅ Wagmi hooks imported successfully');
    
    // Test if we can create a contract call structure
    const testCall = {
      address: '0x5854AF7c836275c55469350a114F62a1609c4A42',
      abi: [{
        name: 'buyTickets',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{ name: 'quantity', type: 'uint256' }],
        outputs: []
      }],
      functionName: 'buyTickets',
      args: [BigInt(1)],
      value: BigInt('100000000000000000') // 0.1 ETH
    };
    
    console.log('✅ Test contract call structure:', testCall);
  } catch (error) {
    console.error('❌ Transaction Manager Error:', error);
  }
}

// Run all tests
console.log('🚀 Starting Debug Tests...');
testAlchemyAPI();
testGasOracle();
testTransactionManager();

// Export for manual testing
window.debugTicketPurchase = {
  testAlchemyAPI,
  testGasOracle,
  testTransactionManager
};

console.log('💡 Run window.debugTicketPurchase.testAlchemyAPI() to test API manually');