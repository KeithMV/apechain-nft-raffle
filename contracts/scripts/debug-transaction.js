const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Debug: Testing Exact Raffle Creation Transaction...\n");

  const userAddress = "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e";
  const nftContract = "0x18bf3ba9d8b067cc04d4ff500fe7100d452da9ff";
  const tokenId = 2889;
  const factoryAddress = "0x152bAe0F11616F0e28cA2c675e1d784e60af43d3";
  
  console.log("🎯 Transaction Details:");
  console.log("- User:", userAddress);
  console.log("- NFT:", nftContract, "#" + tokenId);
  console.log("- Factory:", factoryAddress);
  
  try {
    // Check NFT approval first
    const erc721ABI = [
      "function isApprovedForAll(address owner, address operator) view returns (bool)"
    ];
    const nft = new ethers.Contract(nftContract, erc721ABI, ethers.provider);
    const isApproved = await nft.isApprovedForAll(userAddress, factoryAddress);
    
    console.log("\n✅ NFT Approval Status:", isApproved ? "APPROVED" : "NOT APPROVED");
    
    if (!isApproved) {
      console.log("❌ NFT must be approved first!");
      return;
    }
    
    // Get factory contract
    const RaffleFactory = await ethers.getContractFactory("RaffleFactorySecureV4");
    const factory = RaffleFactory.attach(factoryAddress);
    
    // Test parameters (matching frontend)
    const ticketPrice = ethers.utils.parseEther("0.01");
    const maxTickets = 10;
    const duration = 86400; // 24 hours
    
    console.log("\n🔍 Testing Transaction Parameters:");
    console.log("- Ticket Price:", ethers.utils.formatEther(ticketPrice), "ETH");
    console.log("- Max Tickets:", maxTickets);
    console.log("- Duration:", duration, "seconds");
    
    // Check rate limit
    const lastRaffleTime = await factory.lastRaffleTime(userAddress);
    const rateLimit = await factory.RATE_LIMIT();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastRaffle = currentTime - lastRaffleTime.toNumber();
    
    console.log("\n⏰ Rate Limit Check:");
    console.log("- Last Raffle Time:", lastRaffleTime.toString());
    console.log("- Rate Limit:", rateLimit.toString(), "seconds");
    console.log("- Time Since Last:", timeSinceLastRaffle, "seconds");
    console.log("- Can Create:", timeSinceLastRaffle >= rateLimit.toNumber() ? "YES" : "NO");
    
    if (timeSinceLastRaffle < rateLimit.toNumber()) {
      console.log("❌ Rate limit not met! Wait", rateLimit.toNumber() - timeSinceLastRaffle, "more seconds");
      return;
    }
    
    // Test static call
    console.log("\n🔍 Testing Static Call...");
    await factory.callStatic.createRaffle(
      nftContract,
      tokenId,
      ticketPrice,
      maxTickets,
      duration
    );
    console.log("✅ Static call succeeded");
    
    // Test gas estimation
    console.log("\n🔍 Testing Gas Estimation...");
    const gasEstimate = await factory.estimateGas.createRaffle(
      nftContract,
      tokenId,
      ticketPrice,
      maxTickets,
      duration
    );
    console.log("✅ Gas estimate:", gasEstimate.toString());
    
    console.log("\n🎉 TRANSACTION SHOULD WORK!");
    console.log("The issue might be in the frontend confirmation logic.");
    
  } catch (error) {
    console.log("\n❌ Transaction Test Failed:");
    console.log("- Message:", error.message);
    console.log("- Code:", error.code);
    console.log("- Data:", error.data);
    
    if (error.data) {
      try {
        const decoded = factory.interface.parseError(error.data);
        console.log("- Decoded Error:", decoded);
      } catch (decodeError) {
        console.log("- Raw Error Data:", error.data);
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