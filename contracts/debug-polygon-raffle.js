const { ethers } = require('ethers');

async function debugPolygonRaffle() {
  console.log('🔍 Debugging Polygon raffle creation failure...');
  
  const provider = new ethers.providers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/AyuLQ-1xvN148vswTZxHo');
  
  const factoryAddress = '0x5854AF7c836275c55469350a114F62a1609c4A42';
  const nftContract = '0x78865315E4419E63073527BfDb660C550905DA14';
  const tokenId = '4794';
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const ticketPrice = '100000000000000000'; // 0.1 POL
  const maxTickets = '100';
  const duration = '3600'; // 1 hour
  
  try {
    // 1. Check factory contract exists
    const factoryCode = await provider.getCode(factoryAddress);
    console.log('✅ Factory contract exists:', factoryCode.length > 2);
    
    // 2. Check NFT contract exists
    const nftCode = await provider.getCode(nftContract);
    console.log('✅ NFT contract exists:', nftCode.length > 2);
    
    // 3. Check NFT ownership
    const nftAbi = [
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function getApproved(uint256 tokenId) view returns (address)',
      'function isApprovedForAll(address owner, address operator) view returns (bool)'
    ];
    const nftContractInstance = new ethers.Contract(nftContract, nftAbi, provider);
    
    try {
      const owner = await nftContractInstance.ownerOf(tokenId);
      console.log('🔍 NFT owner:', owner);
      console.log('🔍 User address:', userAddress);
      console.log('✅ User owns NFT:', owner.toLowerCase() === userAddress.toLowerCase());
      
      // Check approvals
      const approved = await nftContractInstance.getApproved(tokenId);
      console.log('🔍 Token approved to:', approved);
      console.log('✅ Token approved to factory:', approved.toLowerCase() === factoryAddress.toLowerCase());
      
      const approvedForAll = await nftContractInstance.isApprovedForAll(owner, factoryAddress);
      console.log('✅ Approved for all:', approvedForAll);
      
    } catch (e) {
      console.log('❌ NFT checks failed:', e.message);
    }
    
    // 4. Check factory contract details
    const factoryAbi = [
      'function raffleCounter() view returns (uint256)',
      'function platformFee() view returns (uint256)',
      'function owner() view returns (address)',
      'function lastRaffleTime(address) view returns (uint256)'
    ];
    
    try {
      const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, provider);
      
      const raffleCounter = await factoryContract.raffleCounter();
      console.log('🔍 Current raffle counter:', raffleCounter.toString());
      
      const platformFee = await factoryContract.platformFee();
      console.log('🔍 Platform fee:', platformFee.toString(), 'basis points');
      
      const factoryOwner = await factoryContract.owner();
      console.log('🔍 Factory owner:', factoryOwner);
      
      // Check rate limiting
      const lastRaffleTime = await factoryContract.lastRaffleTime(userAddress);
      console.log('🔍 Last raffle time for user:', lastRaffleTime.toString());
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastRaffle = currentTime - parseInt(lastRaffleTime.toString());
      console.log('🔍 Time since last raffle:', timeSinceLastRaffle, 'seconds');
      console.log('✅ Rate limit passed (>10s):', timeSinceLastRaffle > 10);
      
    } catch (e) {
      console.log('❌ Factory contract checks failed:', e.message);
    }
    
    // 5. Check user's POL balance
    const balance = await provider.getBalance(userAddress);
    console.log('🔍 User POL balance:', ethers.utils.formatEther(balance), 'POL');
    
    // 6. Estimate gas for the transaction
    console.log('\n🔍 Attempting to estimate gas for createRaffle...');
    
    const createRaffleAbi = [
      'function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) payable'
    ];
    
    try {
      const factoryForGas = new ethers.Contract(factoryAddress, createRaffleAbi, provider);
      
      // Calculate platform fee
      const platformFeeAmount = ethers.BigNumber.from(ticketPrice)
        .mul(maxTickets)
        .mul(500) // 5% platform fee
        .div(10000);
      
      console.log('🔍 Platform fee amount:', ethers.utils.formatEther(platformFeeAmount), 'POL');
      
      const gasEstimate = await factoryForGas.estimateGas.createRaffle(
        nftContract,
        tokenId,
        ticketPrice,
        maxTickets,
        duration,
        { value: platformFeeAmount }
      );
      
      console.log('✅ Gas estimate successful:', gasEstimate.toString());
      
    } catch (gasError) {
      console.log('❌ Gas estimation failed:', gasError.message);
      
      // Try to get more specific error
      if (gasError.reason) {
        console.log('🔍 Revert reason:', gasError.reason);
      }
      if (gasError.error && gasError.error.message) {
        console.log('🔍 Error message:', gasError.error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

debugPolygonRaffle().catch(console.error);