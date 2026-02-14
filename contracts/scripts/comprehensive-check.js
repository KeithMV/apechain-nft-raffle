const { ethers } = require("hardhat");

async function comprehensiveCheck() {
  const factoryAddress = "0xaD3B887a57a9e3a3103De2a372BC3834A7C5023c";
  const nftContract = "0xad08a46cd6f73b15527c16df9dfd2b6d28470321";
  const tokenId = 2384;
  const userAddress = "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e";
  
  console.log("🔍 COMPREHENSIVE PRE-FLIGHT CHECK");
  console.log("=====================================");
  
  try {
    // Check NFT contract
    const nftABI = [
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function getApproved(uint256 tokenId) view returns (address)",
      "function isApprovedForAll(address owner, address operator) view returns (bool)"
    ];
    
    const nft = new ethers.Contract(nftContract, nftABI, ethers.provider);
    
    console.log("1. NFT OWNERSHIP CHECK:");
    const owner = await nft.ownerOf(tokenId);
    console.log("   Owner:", owner);
    console.log("   User:", userAddress);
    console.log("   ✅ Owns NFT:", owner.toLowerCase() === userAddress.toLowerCase());
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      console.log("❌ CRITICAL: You don't own this NFT!");
      return;
    }
    
    console.log("\\n2. NFT APPROVAL CHECK:");
    const approved = await nft.getApproved(tokenId);
    const approvedForAll = await nft.isApprovedForAll(owner, factoryAddress);
    
    console.log("   Approved To:", approved);
    console.log("   Factory Address:", factoryAddress);
    console.log("   Approved For All:", approvedForAll);
    console.log("   ✅ Can Transfer:", approved.toLowerCase() === factoryAddress.toLowerCase() || approvedForAll);
    
    if (approved.toLowerCase() !== factoryAddress.toLowerCase() && !approvedForAll) {
      console.log("❌ CRITICAL: NFT not approved for factory!");
      console.log("💡 SOLUTION: Run this command in your browser console:");
      console.log(`   window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: '${userAddress}',
          to: '${nftContract}',
          data: '${nft.interface.encodeFunctionData('setApprovalForAll', [factoryAddress, true])}'
        }]
      })`);
      return;
    }
    
    // Check factory contract
    const factoryABI = [
      "function paused() view returns (bool)",
      "function lastRaffleTime(address) view returns (uint256)",
      "function RATE_LIMIT() view returns (uint256)"
    ];
    
    const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);
    
    console.log("\\n3. FACTORY STATUS CHECK:");
    const isPaused = await factory.paused();
    console.log("   Factory Paused:", isPaused);
    console.log("   ✅ Factory Active:", !isPaused);
    
    if (isPaused) {
      console.log("❌ CRITICAL: Factory is paused!");
      return;
    }
    
    console.log("\\n4. RATE LIMIT CHECK:");
    const lastRaffleTime = await factory.lastRaffleTime(userAddress);
    const rateLimit = await factory.RATE_LIMIT();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastRaffle = currentTime - Number(lastRaffleTime);
    
    console.log("   Last Raffle Time:", new Date(Number(lastRaffleTime) * 1000).toISOString());
    console.log("   Rate Limit:", Number(rateLimit), "seconds");
    console.log("   Time Since Last:", timeSinceLastRaffle, "seconds");
    console.log("   ✅ Can Create Now:", timeSinceLastRaffle >= Number(rateLimit));
    
    if (timeSinceLastRaffle < Number(rateLimit)) {
      const waitTime = Number(rateLimit) - timeSinceLastRaffle;
      console.log(`❌ RATE LIMITED: Wait ${waitTime} more seconds`);
      return;
    }
    
    console.log("\\n🎉 ALL CHECKS PASSED!");
    console.log("✅ You should be able to create a raffle now");
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

comprehensiveCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });