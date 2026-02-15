const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Debugging User NFT on Base Network...\n');

  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const factoryAddress = '0xeBB962e8949e67301B4d2c4727EBC689E22516f8';
  
  // Connect to Base
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
  
  console.log('👤 User Address:', userAddress);
  console.log('🏭 Factory Address:', factoryAddress);
  console.log('💰 User ETH Balance:', ethers.utils.formatEther(await provider.getBalance(userAddress)));
  
  // Check factory state
  const factoryABI = [
    'function raffleCounter() external view returns (uint256)',
    'function platformFee() external view returns (uint256)',
    'function paused() external view returns (bool)',
    'function lastRaffleTime(address) external view returns (uint256)',
    'function RATE_LIMIT() external view returns (uint256)',
    'function owner() external view returns (address)'
  ];
  
  const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
  
  console.log('\n🏭 Factory State:');
  console.log('- Raffle Counter:', (await factory.raffleCounter()).toString());
  console.log('- Platform Fee:', (await factory.platformFee()).toString());
  console.log('- Paused:', await factory.paused());
  console.log('- User Last Raffle Time:', (await factory.lastRaffleTime(userAddress)).toString());
  console.log('- Rate Limit:', (await factory.RATE_LIMIT()).toString());
  console.log('- Owner:', await factory.owner());
  
  // Check current time vs rate limit
  const currentTime = Math.floor(Date.now() / 1000);
  const lastRaffleTime = await factory.lastRaffleTime(userAddress);
  const rateLimit = await factory.RATE_LIMIT();
  const timeSinceLastRaffle = currentTime - lastRaffleTime.toNumber();
  
  console.log('\n⏰ Rate Limit Check:');
  console.log('- Current Time:', currentTime);
  console.log('- Last Raffle Time:', lastRaffleTime.toString());
  console.log('- Time Since Last:', timeSinceLastRaffle, 'seconds');
  console.log('- Rate Limit:', rateLimit.toString(), 'seconds');
  console.log('- Can Create Raffle:', timeSinceLastRaffle >= rateLimit.toNumber() ? '✅ YES' : '❌ NO');
  
  // Let's check some common NFT contracts on Base
  const commonNFTs = [
    '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260', // Test NFT
    '0x4A4A4A4A4A4A4A4A4A4A4A4A4A4A4A4A4A4A4A4A', // Example
  ];
  
  const erc721ABI = [
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function isApprovedForAll(address owner, address operator) external view returns (bool)',
    'function getApproved(uint256 tokenId) external view returns (address)',
    'function name() external view returns (string)',
    'function symbol() external view returns (string)'
  ];
  
  console.log('\n🎨 Testing NFT Contracts:');
  
  for (const nftAddress of commonNFTs) {
    try {
      const nft = new ethers.Contract(nftAddress, erc721ABI, provider);
      const name = await nft.name();
      const symbol = await nft.symbol();
      console.log(`\n📍 ${nftAddress}:`);
      console.log(`- Name: ${name}`);
      console.log(`- Symbol: ${symbol}`);
      
      // Test token ownership for common token IDs
      const testTokenIds = [1, 1064, 100, 1000];
      for (const tokenId of testTokenIds) {
        try {
          const owner = await nft.ownerOf(tokenId);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            console.log(`✅ User owns token ${tokenId}`);
            
            // Check approval
            const isApproved = await nft.isApprovedForAll(userAddress, factoryAddress);
            const specificApproval = await nft.getApproved(tokenId);
            
            console.log(`- Approved for all: ${isApproved}`);
            console.log(`- Specific approval: ${specificApproval}`);
            console.log(`- Ready for raffle: ${isApproved || specificApproval.toLowerCase() === factoryAddress.toLowerCase()}`);
          }
        } catch (e) {
          // Token doesn't exist, skip
        }
      }
    } catch (error) {
      console.log(`❌ ${nftAddress}: ${error.message}`);
    }
  }
  
  console.log('\n💡 Common Revert Reasons:');
  console.log('1. Rate limit not met (need to wait 10 seconds between raffles)');
  console.log('2. NFT not owned by user');
  console.log('3. NFT not approved for factory');
  console.log('4. Invalid parameters (price, tickets, duration)');
  console.log('5. Contract paused');
  console.log('6. Insufficient gas limit');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });