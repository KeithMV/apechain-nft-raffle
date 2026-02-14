const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Testing Exact Raffle Creation...\n");

  const userAddress = "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e";
  const nftContract = "0x3f58c6eb6a3f58cf137ac093856f0b6e83727260";
  const tokenId = 1064;
  const factoryAddress = "0x11936710d452bb677E22887105bA329f3267ae18";
  
  try {
    // Check current state
    const erc721ABI = [
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function isApprovedForAll(address owner, address operator) view returns (bool)",
      "function name() view returns (string)"
    ];
    const nft = new ethers.Contract(nftContract, erc721ABI, ethers.provider);
    
    const owner = await nft.ownerOf(tokenId);
    const isApproved = await nft.isApprovedForAll(userAddress, factoryAddress);
    const nftName = await nft.name();
    
    console.log("✅ NFT Status:");
    console.log("- Collection:", nftName);
    console.log("- Owner:", owner);
    console.log("- User:", userAddress);
    console.log("- Ownership Match:", owner.toLowerCase() === userAddress.toLowerCase());
    console.log("- Approved:", isApproved);
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      console.log("❌ Ownership mismatch!");
      return;
    }
    
    if (!isApproved) {
      console.log("❌ NFT not approved for new factory!");
      return;
    }
    
    // Test factory
    const RaffleFactory = await ethers.getContractFactory("RaffleFactorySecureV4");
    const factory = RaffleFactory.attach(factoryAddress);
    
    const raffleCounter = await factory.raffleCounter();
    const paused = await factory.paused();
    const rateLimit = await factory.RATE_LIMIT();
    const lastRaffleTime = await factory.lastRaffleTime(userAddress);
    
    console.log("\n✅ Factory Status:");
    console.log("- Counter:", raffleCounter.toString());
    console.log("- Paused:", paused);
    console.log("- Rate Limit:", rateLimit.toString(), "seconds");
    console.log("- Last Raffle Time:", lastRaffleTime.toString());
    
    // Check rate limit
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastRaffle = currentTime - lastRaffleTime.toNumber();
    console.log("- Time Since Last:", timeSinceLastRaffle, "seconds");
    console.log("- Can Create:", timeSinceLastRaffle >= rateLimit.toNumber());
    
    if (timeSinceLastRaffle < rateLimit.toNumber()) {
      console.log("❌ Rate limit not met!");
      return;
    }
    
    // Test with exact parameters from frontend
    const ticketPrice = ethers.utils.parseEther("0.001"); // 0.001 ETH
    const maxTickets = 10;
    const duration = 3600; // 1 hour
    
    console.log("\n🔍 Testing createRaffle...");
    console.log("- NFT:", nftContract);
    console.log("- Token ID:", tokenId);
    console.log("- Ticket Price:", ethers.utils.formatEther(ticketPrice), "ETH");
    console.log("- Max Tickets:", maxTickets);
    console.log("- Duration:", duration, "seconds");
    
    // Test static call first
    try {
      await factory.callStatic.createRaffle(
        nftContract,
        tokenId,
        ticketPrice,
        maxTickets,
        duration
      );
      console.log("✅ Static call succeeded");
    } catch (error) {
      console.log("❌ Static call failed:", error.message);
      if (error.data) {
        console.log("- Error data:", error.data);
      }
      return;
    }
    
    // Test gas estimation
    try {
      const gasEstimate = await factory.estimateGas.createRaffle(
        nftContract,
        tokenId,
        ticketPrice,
        maxTickets,
        duration
      );
      console.log("✅ Gas estimate:", gasEstimate.toString());
    } catch (error) {
      console.log("❌ Gas estimation failed:", error.message);
      if (error.data) {
        console.log("- Error data:", error.data);
      }
      return;
    }
    
    console.log("\n🎉 All tests passed! Raffle creation should work.");
    
  } catch (error) {
    console.log("\n❌ Test failed:");
    console.log("- Message:", error.message);
    console.log("- Code:", error.code);
    if (error.data) {
      console.log("- Data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });