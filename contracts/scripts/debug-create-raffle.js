const { ethers } = require("hardhat");

async function debugCreateRaffle() {
  const factoryAddress = "0xaD3B887a57a9e3a3103De2a372BC3834A7C5023c"; // Base factory
  const nftContract = "0xad08a46cd6f73b15527c16df9dfd2b6d28470321";
  const tokenId = 2384;
  const userAddress = "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e";
  
  console.log("🔍 Debugging createRaffle failure...");
  
  try {
    const factoryABI = [
      "function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external",
      "function lastRaffleTime(address) view returns (uint256)",
      "function RATE_LIMIT() view returns (uint256)",
      "function owner() view returns (address)"
    ];
    
    const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);
    
    // Check rate limit
    const lastCreation = await factory.lastRaffleTime(userAddress);
    const rateLimitDuration = await factory.RATE_LIMIT();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastCreation = currentTime - Number(lastCreation);
    
    console.log("⏰ Rate Limit Check:");
    console.log("  Last Creation:", new Date(Number(lastCreation) * 1000).toISOString());
    console.log("  Rate Limit Duration:", Number(rateLimitDuration), "seconds");
    console.log("  Time Since Last:", timeSinceLastCreation, "seconds");
    console.log("  Can Create Now:", timeSinceLastCreation >= Number(rateLimitDuration));
    
    if (timeSinceLastCreation < Number(rateLimitDuration)) {
      const waitTime = Number(rateLimitDuration) - timeSinceLastCreation;
      console.log("❌ RATE LIMITED! Must wait", waitTime, "more seconds");
      return;
    }
    
    // Check NFT ownership and approval
    const nftABI = [
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function getApproved(uint256 tokenId) view returns (address)",
      "function isApprovedForAll(address owner, address operator) view returns (bool)"
    ];
    
    const nft = new ethers.Contract(nftContract, nftABI, ethers.provider);
    
    const owner = await nft.ownerOf(tokenId);
    const approved = await nft.getApproved(tokenId);
    const approvedForAll = await nft.isApprovedForAll(owner, factoryAddress);
    
    console.log("🎫 NFT Status:");
    console.log("  Owner:", owner);
    console.log("  User:", userAddress);
    console.log("  Owns NFT:", owner.toLowerCase() === userAddress.toLowerCase());
    console.log("  Approved To:", approved);
    console.log("  Approved For All:", approvedForAll);
    console.log("  Can Transfer:", approved === factoryAddress || approvedForAll);
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      console.log("❌ USER DOESN'T OWN THE NFT!");
      return;
    }
    
    if (approved !== factoryAddress && !approvedForAll) {
      console.log("❌ NFT NOT APPROVED FOR FACTORY!");
      return;
    }
    
    console.log("✅ All checks passed - raffle creation should work");
    
  } catch (error) {
    console.error("❌ Debug error:", error.message);
  }
}

debugCreateRaffle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });