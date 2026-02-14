const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Comparing ApeChain vs Base Contract States...\n');

  // ApeChain V4 (working)
  const apeChainFactory = '0x1627E7e63b63878E61f91D336385a59B1747934a';
  
  // Base V4 (not working)
  const baseFactory = '0xaD3B887a57a9e3a3103De2a372BC3834A7C5023c';
  
  const factoryABI = [
    'function raffleCounter() external view returns (uint256)',
    'function platformFee() external view returns (uint256)',
    'function paused() external view returns (bool)',
    'function lastRaffleTime(address) external view returns (uint256)',
    'function RATE_LIMIT() external view returns (uint256)',
    'function owner() external view returns (address)',
    'function raffleTemplate() external view returns (address)'
  ];

  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';

  console.log('📊 ApeChain V4 Factory State:');
  try {
    // Connect to ApeChain
    const apeProvider = new ethers.providers.JsonRpcProvider('https://apechain.calderachain.xyz/http');
    const apeFactory = new ethers.Contract(apeChainFactory, factoryABI, apeProvider);
    
    const apeRaffleCounter = await apeFactory.raffleCounter();
    const apePlatformFee = await apeFactory.platformFee();
    const apePaused = await apeFactory.paused();
    const apeLastTime = await apeFactory.lastRaffleTime(userAddress);
    const apeRateLimit = await apeFactory.RATE_LIMIT();
    const apeOwner = await apeFactory.owner();
    const apeTemplate = await apeFactory.raffleTemplate();
    
    console.log('Raffle Counter:', apeRaffleCounter.toString());
    console.log('Platform Fee:', apePlatformFee.toString());
    console.log('Paused:', apePaused);
    console.log('User Last Raffle Time:', apeLastTime.toString());
    console.log('Rate Limit:', apeRateLimit.toString());
    console.log('Owner:', apeOwner);
    console.log('Template:', apeTemplate);
    
  } catch (error) {
    console.log('❌ ApeChain check failed:', error.message);
  }

  console.log('\n📊 Base V4 Factory State:');
  try {
    // Connect to Base
    const baseProvider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    const baseFactoryContract = new ethers.Contract(baseFactory, factoryABI, baseProvider);
    
    const baseRaffleCounter = await baseFactoryContract.raffleCounter();
    const basePlatformFee = await baseFactoryContract.platformFee();
    const basePaused = await baseFactoryContract.paused();
    const baseLastTime = await baseFactoryContract.lastRaffleTime(userAddress);
    const baseRateLimit = await baseFactoryContract.RATE_LIMIT();
    const baseOwner = await baseFactoryContract.owner();
    const baseTemplate = await baseFactoryContract.raffleTemplate();
    
    console.log('Raffle Counter:', baseRaffleCounter.toString());
    console.log('Platform Fee:', basePlatformFee.toString());
    console.log('Paused:', basePaused);
    console.log('User Last Raffle Time:', baseLastTime.toString());
    console.log('Rate Limit:', baseRateLimit.toString());
    console.log('Owner:', baseOwner);
    console.log('Template:', baseTemplate);
    
  } catch (error) {
    console.log('❌ Base check failed:', error.message);
  }

  console.log('\n🔍 Testing createRaffle on both networks...');
  
  // Test parameters
  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260'; // Base NFT
  const tokenId = '1064';
  const ticketPrice = ethers.utils.parseEther('0.001');
  const maxTickets = 10;
  const duration = 3600;

  console.log('\n🎯 ApeChain createRaffle test:');
  try {
    const apeProvider = new ethers.providers.JsonRpcProvider('https://apechain.calderachain.xyz/http');
    const apeFactory = new ethers.Contract(apeChainFactory, [
      'function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external'
    ], apeProvider);
    
    const result = await apeProvider.call({
      to: apeChainFactory,
      data: apeFactory.interface.encodeFunctionData('createRaffle', [
        nftContract, tokenId, ticketPrice, maxTickets, duration
      ]),
      from: userAddress
    });
    
    console.log('✅ ApeChain call result:', result);
    
  } catch (error) {
    console.log('❌ ApeChain call failed:', error.message);
    if (error.data) {
      console.log('Error data:', error.data);
    }
  }

  console.log('\n🎯 Base createRaffle test:');
  try {
    const baseProvider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    const baseFactoryContract = new ethers.Contract(baseFactory, [
      'function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external'
    ], baseProvider);
    
    const result = await baseProvider.call({
      to: baseFactory,
      data: baseFactoryContract.interface.encodeFunctionData('createRaffle', [
        nftContract, tokenId, ticketPrice, maxTickets, duration
      ]),
      from: userAddress
    });
    
    console.log('✅ Base call result:', result);
    
  } catch (error) {
    console.log('❌ Base call failed:', error.message);
    if (error.data) {
      console.log('Error data:', error.data);
      
      // Check if this is our mysterious error
      if (error.data === '0xe1f1d02e') {
        console.log('🎯 FOUND THE EXACT ERROR FROM FRONTEND!');
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });