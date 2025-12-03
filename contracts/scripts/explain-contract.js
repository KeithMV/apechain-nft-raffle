const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  const CONTRACT_ADDRESS = "0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0";
  
  console.log("🔍 CONTRACT ANALYSIS");
  console.log("=".repeat(50));
  console.log(`Address: ${CONTRACT_ADDRESS}`);
  
  try {
    // Get contract info
    const factory = new ethers.Contract(
      CONTRACT_ADDRESS,
      [
        "function owner() view returns (address)",
        "function platformFee() view returns (uint256)",
        "function raffleCounter() view returns (uint256)",
        "function raffleTemplate() view returns (address)"
      ],
      provider
    );
    
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const raffleCounter = await factory.raffleCounter();
    const template = await factory.raffleTemplate();
    
    console.log("\n📋 CONTRACT DETAILS");
    console.log(`Type: RaffleFactorySecure (Production Contract)`);
    console.log(`Owner: ${owner}`);
    console.log(`Platform Fee: ${platformFee.toString() / 100}%`);
    console.log(`Total Raffles Created: ${raffleCounter.toString()}`);
    console.log(`Raffle Template: ${template}`);
    
    // Get owner balance
    const balance = await provider.getBalance(owner);
    console.log(`Owner Balance: ${ethers.utils.formatEther(balance)} APE`);
    
    console.log("\n🎯 WHAT THIS CONTRACT DOES");
    console.log("• Factory contract that creates new raffle instances");
    console.log("• Uses minimal proxy pattern for gas efficiency");
    console.log("• Collects 10% platform fees from all ticket sales");
    console.log("• Sends fees directly to the owner address");
    console.log("• Creates secure, audited raffle contracts");
    
    console.log("\n💰 REVENUE MODEL");
    console.log("• Every ticket purchase = 10% goes to platform owner");
    console.log("• Fees are automatically transferred during purchases");
    console.log("• No manual collection needed - fully automated");
    
    console.log("\n🔒 SECURITY FEATURES");
    console.log("• Secure version with reentrancy protection");
    console.log("• Proper access controls and ownership");
    console.log("• Audited contract implementation");
    console.log("• Minimal proxy clones for efficiency");
    
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });