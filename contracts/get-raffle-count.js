const { ethers } = require('ethers');
require('dotenv').config();

// Contract addresses from your config
const CONTRACTS = {
  apechain: {
    factory: '0x1627E7e63b63878E61f91D336385a59B1747934a',
    rpc: 'https://apechain.calderachain.xyz/http',
    chainId: 33139,
    name: 'ApeChain'
  },
  polygon: {
    factory: '0xC9Bd344f5E31481F202E400C33210Bd1AB542b42',
    rpc: process.env.ALCHEMY_API_KEY 
      ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      : 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon'
  }
};

// Minimal ABI - just need raffleCounter function
const FACTORY_ABI = [
  'function raffleCounter() view returns (uint256)',
  'function getRaffleContract(uint256 index) view returns (address)'
];

async function getRaffleCount(chain) {
  try {
    console.log(`\n🔍 Checking ${chain.name}...`);
    console.log(`   Factory: ${chain.factory}`);
    console.log(`   RPC: ${chain.rpc.substring(0, 50)}...`);
    
    const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
    const factory = new ethers.Contract(chain.factory, FACTORY_ABI, provider);
    
    const count = await factory.raffleCounter();
    console.log(`   ✅ Total raffles: ${count.toString()}`);
    
    return Number(count);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🎯 Fetching on-chain raffle counts...\n');
  console.log('=' .repeat(60));
  
  const apechainCount = await getRaffleCount(CONTRACTS.apechain);
  const polygonCount = await getRaffleCount(CONTRACTS.polygon);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log(`   ApeChain: ${apechainCount} raffles`);
  console.log(`   Polygon:  ${polygonCount} raffles`);
  console.log(`   ─────────────────────────`);
  console.log(`   TOTAL:    ${apechainCount + polygonCount} raffles`);
  console.log('\n' + '='.repeat(60));
  
  // Suggest README update
  const total = apechainCount + polygonCount;
  if (total > 0) {
    console.log(`\n💡 Update README.md with: ${total}+ raffles`);
  }
}

main().catch(console.error);
