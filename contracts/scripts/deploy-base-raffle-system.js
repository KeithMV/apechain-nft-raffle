const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BaseRaffleSystem to Base network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy BaseRaffleSystem
  const BaseRaffleSystem = await ethers.getContractFactory("BaseRaffleSystem");
  
  console.log("Deploying BaseRaffleSystem...");
  const baseRaffleSystem = await BaseRaffleSystem.deploy({
    gasLimit: 3000000,
    gasPrice: ethers.utils.parseUnits("1", "gwei")
  });

  await baseRaffleSystem.deployed();

  console.log("✅ BaseRaffleSystem deployed to:", baseRaffleSystem.address);
  console.log("📊 Deployment details:");
  console.log("  - Contract Address:", baseRaffleSystem.address);
  console.log("  - Transaction Hash:", baseRaffleSystem.deployTransaction.hash);
  console.log("  - Block Number:", baseRaffleSystem.deployTransaction.blockNumber);
  console.log("  - Gas Used:", baseRaffleSystem.deployTransaction.gasLimit.toString());

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await baseRaffleSystem.owner();
  const platformFee = await baseRaffleSystem.platformFee();
  const raffleCounter = await baseRaffleSystem.raffleCounter();
  
  console.log("  - Owner:", owner);
  console.log("  - Platform Fee:", platformFee.toString(), "basis points");
  console.log("  - Raffle Counter:", raffleCounter.toString());
  console.log("  - Emergency Paused:", await baseRaffleSystem.emergencyPaused());

  console.log("\n🎯 Update your frontend config:");
  console.log(`BASE_RAFFLE_SYSTEM: "${baseRaffleSystem.address}",`);
  
  console.log("\n✨ Deployment complete! Your Base network is ready for raffles.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });