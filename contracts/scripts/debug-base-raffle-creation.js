const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Debugging Base Raffle Creation Issue...\n');

  // Base network details from logs
  const factoryAddress = '0xaD3B887a57a9e3a3103De2a372BC3834A7C5023c';
  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
  const tokenId = '1064';
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const ticketPrice = ethers.utils.parseEther('0.001');
  const maxTickets = 10;
  const duration = 3600;

  try {
    // Get factory contract
    const factoryABI = [
      'function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external',
      'function platformFee() external view returns (uint256)',
      'function rateLimit() external view returns (uint256)',
      'function lastRaffleTime(address) external view returns (uint256)',
      'function paused() external view returns (bool)',
      'function owner() external view returns (address)'
    ];

    const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);

    console.log('📋 Factory State Check:');
    console.log('Factory Address:', factoryAddress);
    
    try {
      const isPaused = await factory.paused();
      console.log('Is Paused:', isPaused);
    } catch (e) {
      console.log('Paused check failed:', e.message);
    }

    try {
      const platformFee = await factory.platformFee();
      console.log('Platform Fee:', platformFee.toString(), 'basis points');
    } catch (e) {
      console.log('Platform fee check failed:', e.message);
    }

    try {
      const rateLimit = await factory.rateLimit();
      console.log('Rate Limit:', rateLimit.toString(), 'seconds');
    } catch (e) {
      console.log('Rate limit check failed:', e.message);
    }

    try {
      const lastTime = await factory.lastRaffleTime(userAddress);
      const now = Math.floor(Date.now() / 1000);
      console.log('Last Raffle Time:', lastTime.toString());
      console.log('Current Time:', now);
      console.log('Time Since Last:', now - Number(lastTime), 'seconds');
    } catch (e) {
      console.log('Last raffle time check failed:', e.message);
    }

    console.log('\n🎨 NFT Ownership & Approval Check:');
    
    // Check NFT contract
    const nftABI = [
      'function ownerOf(uint256 tokenId) external view returns (address)',
      'function isApprovedForAll(address owner, address operator) external view returns (bool)',
      'function getApproved(uint256 tokenId) external view returns (address)'
    ];

    const nft = new ethers.Contract(nftContract, nftABI, ethers.provider);

    try {
      const owner = await nft.ownerOf(tokenId);
      console.log('NFT Owner:', owner);
      console.log('User Address:', userAddress);
      console.log('Owns NFT:', owner.toLowerCase() === userAddress.toLowerCase());
    } catch (e) {
      console.log('❌ NFT ownership check failed:', e.message);
      return;
    }

    try {
      const isApprovedForAll = await nft.isApprovedForAll(userAddress, factoryAddress);
      console.log('Approved for All:', isApprovedForAll);
    } catch (e) {
      console.log('Approval for all check failed:', e.message);
    }

    try {
      const approved = await nft.getApproved(tokenId);
      console.log('Token Approved To:', approved);
      console.log('Approved to Factory:', approved.toLowerCase() === factoryAddress.toLowerCase());
    } catch (e) {
      console.log('Token approval check failed:', e.message);
    }

    console.log('\n🔍 Simulating createRaffle call...');
    
    // Try to simulate the call to get the actual revert reason
    try {
      await factory.createRaffle.staticCall(
        nftContract,
        tokenId,
        ticketPrice,
        maxTickets,
        duration
      );
      console.log('✅ Static call succeeded - transaction should work');
    } catch (error) {
      console.log('❌ Static call failed with error:');
      console.log('Error message:', error.message);
      
      // Try to decode the error
      if (error.data) {
        console.log('Error data:', error.data);
        
        // Common error signatures
        const errorSignatures = {
          '0xe1f1d02e': 'Custom error - likely rate limit or validation failure',
          '0x08c379a0': 'Error(string) - standard revert message',
          '0x4e487b71': 'Panic(uint256) - assertion failure'
        };
        
        const signature = error.data.slice(0, 10);
        if (errorSignatures[signature]) {
          console.log('Decoded error:', errorSignatures[signature]);
        }
      }
    }

    console.log('\n📊 Transaction Parameters:');
    console.log('NFT Contract:', nftContract);
    console.log('Token ID:', tokenId);
    console.log('Ticket Price:', ethers.utils.formatEther(ticketPrice), 'ETH');
    console.log('Max Tickets:', maxTickets);
    console.log('Duration:', duration, 'seconds');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });