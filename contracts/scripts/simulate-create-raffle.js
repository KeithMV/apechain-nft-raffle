const { ethers } = require("hardhat");

async function simulateCreateRaffle() {
  const factoryAddress = "0xaD3B887a57a9e3a3103De2a372BC3834A7C5023c";
  const nftContract = "0xad08a46cd6f73b15527c16df9dfd2b6d28470321";
  const tokenId = 2384;
  const ticketPrice = ethers.utils.parseEther("0.01"); // Try small amount
  const maxTickets = 10;
  const duration = 3600; // 1 hour
  
  console.log("🧪 Simulating createRaffle call...");
  console.log("Parameters:");
  console.log("  Factory:", factoryAddress);
  console.log("  NFT Contract:", nftContract);
  console.log("  Token ID:", tokenId);
  console.log("  Ticket Price:", ethers.utils.formatEther(ticketPrice), "ETH");
  console.log("  Max Tickets:", maxTickets);
  console.log("  Duration:", duration, "seconds");
  
  try {
    const factoryABI = [
      "function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external"
    ];
    
    const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);
    
    // Try to call the function (this will revert with the actual error)
    await factory.callStatic.createRaffle(
      nftContract,
      tokenId,
      ticketPrice,
      maxTickets,
      duration,
      {
        from: "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e"
      }
    );
    
    console.log("✅ Simulation successful - createRaffle should work!");
    
  } catch (error) {
    console.log("❌ Simulation failed with error:");
    console.log("Error message:", error.message);
    
    // Try to extract the revert reason
    if (error.reason) {
      console.log("🔍 Revert reason:", error.reason);
    }
    
    if (error.data) {
      console.log("🔍 Error data:", error.data);
    }
    
    // Common revert reasons and solutions
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes("rate limit")) {
      console.log("💡 SOLUTION: Wait 10 seconds between raffle creations");
    } else if (errorMsg.includes("not nft owner")) {
      console.log("💡 SOLUTION: Make sure you own the NFT");
    } else if (errorMsg.includes("nft not approved")) {
      console.log("💡 SOLUTION: Approve the NFT contract first");
    } else if (errorMsg.includes("invalid")) {
      console.log("💡 SOLUTION: Check your input parameters");
    } else if (errorMsg.includes("paused")) {
      console.log("💡 SOLUTION: Contract is paused");
    } else {
      console.log("💡 Unknown error - check contract state");
    }
  }
}

simulateCreateRaffle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });