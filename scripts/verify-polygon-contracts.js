/**
 * Polygon Contract Verification Script
 * Verifies that Polygon contracts are properly deployed and functional
 */

const { ethers } = require('ethers');

const POLYGON_RPC = 'https://rpc.ankr.com/polygon';
const POLYGON_CONTRACTS = {
  RAFFLE_FACTORY: "0x5854AF7c836275c55469350a114F62a1609c4A42",
  RAFFLE_FACTORY_V4: "0x5854AF7c836275c55469350a114F62a1609c4A42",
  RAFFLE_TEMPLATE: "0xC7b41b9749724260B4264B90555c9417d66D655A"
};

async function verifyPolygonContracts() {
  console.log('🔍 Verifying Polygon Contract Deployment...\n');

  const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
  
  console.log('📍 Network:', await provider.getNetwork());
  console.log('📍 Latest Block:', await provider.getBlockNumber());
  console.log('');

  // Check each contract
  for (const [name, address] of Object.entries(POLYGON_CONTRACTS)) {
    console.log(`🔍 Checking ${name}: ${address}`);
    
    try {
      // Check if contract exists
      const code = await provider.getCode(address);
      console.log(`📄 Contract Code Length: ${code.length}`);
      console.log(`📄 Contract Deployed: ${code !== '0x' ? '✅ YES' : '❌ NO'}`);
      
      if (code === '0x') {
        console.log(`❌ ${name} is NOT deployed on Polygon!`);
        continue;
      }

      // Try to call basic functions
      if (name.includes('FACTORY')) {
        const factoryABI = [
          'function raffleCounter() external view returns (uint256)',
          'function platformFee() external view returns (uint256)',
          'function paused() external view returns (bool)',
          'function owner() external view returns (address)',
          'function RATE_LIMIT() external view returns (uint256)'
        ];
        
        const factory = new ethers.Contract(address, factoryABI, provider);
        
        try {
          console.log('- Raffle Counter:', (await factory.raffleCounter()).toString());
          console.log('- Platform Fee:', (await factory.platformFee()).toString());
          console.log('- Paused:', await factory.paused());
          console.log('- Owner:', await factory.owner());
          
          // Check if it has RATE_LIMIT (V4 feature)
          try {
            const rateLimit = await factory.RATE_LIMIT();
            console.log('- Rate Limit:', rateLimit.toString(), 'seconds');
            console.log('✅ This appears to be V4 (has RATE_LIMIT)');
          } catch (e) {
            console.log('⚠️  No RATE_LIMIT function - this might be V3');
          }
          
          console.log('✅ Factory functions working');
        } catch (error) {
          console.log('❌ Factory function error:', error.message);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${name}:`, error.message);
    }
    
    console.log('');
  }

  // Test RPC endpoints
  console.log('🌐 Testing Polygon RPC Endpoints...\n');
  
  const endpoints = [
    'https://rpc.ankr.com/polygon',
    'https://polygon-rpc.com',
    'https://polygon.llamarpc.com',
    'https://rpc-mainnet.matic.network',
    'https://polygon-mainnet.public.blastapi.io',
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Testing: ${endpoint}`);
    
    try {
      const testProvider = new ethers.providers.JsonRpcProvider(endpoint);
      const start = Date.now();
      const blockNumber = await testProvider.getBlockNumber();
      const responseTime = Date.now() - start;
      
      console.log(`✅ Block: ${blockNumber}, Response: ${responseTime}ms`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await verifyPolygonContracts();
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyPolygonContracts };