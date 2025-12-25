const { ethers } = require("hardhat");

/**
 * V4 Fee Management System
 * Supports tiered fee structure: 1%, 5%, 10%, 20%
 */

const FACTORY_V4_ADDRESS = "0x1627E7e63b63878E61f91D336385a59B1747934a"; // V4 deployed address

// Professional fee tiers (basis points)
const FEE_TIERS = {
  PROMOTIONAL: 100,    // 1% - Launch promotions, high-value NFTs
  COMPETITIVE: 500,    // 5% - Standard competitive rate (V4 default)
  STANDARD: 1000,      // 10% - Higher rate
  PREMIUM: 2000        // 20% - Maximum allowed, special events
};

async function getCurrentFee() {
  const [deployer] = await ethers.getSigners();
  const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
  const factory = RaffleFactorySecureV4.attach(FACTORY_V4_ADDRESS);
  
  const currentFee = await factory.platformFee();
  const rateLimit = await factory.RATE_LIMIT();
  const percentage = (currentFee / 100).toString();
  
  console.log("📊 V4 Platform Status:");
  console.log("Fee (basis points):", currentFee.toString());
  console.log("Fee (percentage):", percentage + "%");
  console.log("Rate limit:", rateLimit.toString(), "seconds");
  console.log("Deployer:", deployer.address);
  
  return currentFee;
}

async function updateFee(feeType) {
  console.log(`🔧 Updating V4 platform fee to ${feeType}...\n`);
  
  const [deployer] = await ethers.getSigners();
  console.log("Updating with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "APE\n");
  
  const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
  const factory = RaffleFactorySecureV4.attach(FACTORY_V4_ADDRESS);
  
  const newFee = FEE_TIERS[feeType.toUpperCase()];
  if (!newFee) {
    throw new Error(`Invalid fee type. Use: ${Object.keys(FEE_TIERS).join(', ')}`);
  }
  
  console.log(`🎯 Setting ${feeType} fee: ${newFee} basis points (${newFee/100}%)`);
  
  const tx = await factory.updatePlatformFee(newFee);
  console.log("Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  
  // Verify update
  const updatedFee = await factory.platformFee();
  console.log("\n✅ V4 fee update successful!");
  console.log("New fee:", updatedFee.toString(), "basis points");
  console.log("New percentage:", (updatedFee / 100).toString() + "%");
  
  return updatedFee;
}

async function showV4Features() {
  console.log("🚀 V4 Improvements:\n");
  console.log("⚡ Rate Limit: 10 seconds (vs 5 minutes in V3)");
  console.log("💰 Default Fee: 5% (competitive market rate)");
  console.log("🔒 Security: All V3 protections maintained");
  console.log("📈 UX: Faster raffle creation for active users");
}

async function main() {
  const args = process.argv.slice(2);
  
  if (FACTORY_V4_ADDRESS === "REPLACE_WITH_V4_ADDRESS") {
    console.log("❌ Please update FACTORY_V4_ADDRESS with deployed V4 contract address");
    process.exit(1);
  }
  
  if (args.length === 0) {
    await showV4Features();
    await getCurrentFee();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'status':
    case 'current':
      await getCurrentFee();
      break;
      
    case 'features':
      await showV4Features();
      break;
      
    case 'promotional':
    case 'competitive':
    case 'standard':
    case 'premium':
      await updateFee(command);
      break;
      
    default:
      console.log("❌ Invalid command. Available: status, features, promotional, competitive, standard, premium");
      process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ V4 fee management completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ V4 fee management failed:", error);
    process.exit(1);
  });