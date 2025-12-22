const { ethers } = require("hardhat");

/**
 * Professional Fee Management System
 * Supports tiered fee structure: 1%, 5%, 10%, 20%
 */

const FACTORY_ADDRESS = "0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff";

// Professional fee tiers (basis points)
const FEE_TIERS = {
  PROMOTIONAL: 100,    // 1% - Launch promotions, high-value NFTs
  COMPETITIVE: 500,    // 5% - Standard competitive rate
  STANDARD: 1000,      // 10% - Current rate
  PREMIUM: 2000        // 20% - Maximum allowed, special events
};

async function getCurrentFee() {
  const [deployer] = await ethers.getSigners();
  const RaffleFactorySecure = await ethers.getContractFactory("RaffleFactorySecureV3");
  const factory = RaffleFactorySecure.attach(FACTORY_ADDRESS);
  
  const currentFee = await factory.platformFee();
  const percentage = (currentFee / 100).toString();
  
  console.log("📊 Current Platform Fee Status:");
  console.log("Basis Points:", currentFee.toString());
  console.log("Percentage:", percentage + "%");
  console.log("Deployer:", deployer.address);
  
  return currentFee;
}

async function updateFee(feeType) {
  console.log(`🔧 Updating platform fee to ${feeType}...\n`);
  
  const [deployer] = await ethers.getSigners();
  console.log("Updating with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "APE\n");
  
  const RaffleFactorySecure = await ethers.getContractFactory("RaffleFactorySecureV3");
  const factory = RaffleFactorySecure.attach(FACTORY_ADDRESS);
  
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
  console.log("\n✅ Fee update successful!");
  console.log("New fee:", updatedFee.toString(), "basis points");
  console.log("New percentage:", (updatedFee / 100).toString() + "%");
  
  return updatedFee;
}

async function showFeeOptions() {
  console.log("🎯 Available Fee Tiers:\n");
  
  Object.entries(FEE_TIERS).forEach(([name, basisPoints]) => {
    const percentage = basisPoints / 100;
    const useCase = getUseCase(name);
    console.log(`${name.padEnd(12)} | ${percentage.toString().padEnd(3)}% | ${basisPoints.toString().padEnd(4)} bp | ${useCase}`);
  });
  
  console.log("\nUsage: npx hardhat run scripts/fee-management.js --network apechain -- <tier>");
  console.log("Example: npx hardhat run scripts/fee-management.js --network apechain -- competitive");
}

function getUseCase(feeType) {
  const useCases = {
    PROMOTIONAL: "Launch campaigns, high-value NFTs, market penetration",
    COMPETITIVE: "Standard operations, competitive with OpenSea",
    STANDARD: "Current rate, balanced revenue/adoption",
    PREMIUM: "Special events, exclusive collections, maximum revenue"
  };
  return useCases[feeType] || "Unknown";
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await showFeeOptions();
    await getCurrentFee();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'status':
    case 'current':
      await getCurrentFee();
      break;
      
    case 'options':
    case 'tiers':
      await showFeeOptions();
      break;
      
    case 'promotional':
    case 'competitive':
    case 'standard':
    case 'premium':
      await updateFee(command);
      break;
      
    default:
      console.log("❌ Invalid command. Available options:");
      await showFeeOptions();
      process.exit(1);
  }
}

// Business strategy recommendations
async function getRecommendation() {
  console.log("\n💡 Business Strategy Recommendations:\n");
  
  console.log("🚀 LAUNCH PHASE (0-3 months):");
  console.log("   Use PROMOTIONAL (1%) to attract early adopters");
  console.log("   Focus on volume and user acquisition");
  
  console.log("\n📈 GROWTH PHASE (3-12 months):");
  console.log("   Use COMPETITIVE (5%) for sustainable growth");
  console.log("   Balance revenue with market competitiveness");
  
  console.log("\n💰 MATURE PHASE (12+ months):");
  console.log("   Use STANDARD (10%) for established platform");
  console.log("   Optimize for revenue with loyal user base");
  
  console.log("\n🎪 SPECIAL EVENTS:");
  console.log("   Use PREMIUM (20%) for exclusive/high-demand collections");
  console.log("   Limited time, premium positioning");
}

main()
  .then(() => {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      getRecommendation();
    }
    console.log("\n✅ Fee management completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fee management failed:", error);
    process.exit(1);
  });