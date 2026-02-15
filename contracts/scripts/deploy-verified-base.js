const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying VERIFIED BaseRaffleSystem...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  
  // Get the contract factory
  const BaseRaffleSystem = await ethers.getContractFactory("BaseRaffleSystem");
  
  // Get the compiled artifact to verify
  const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/BaseRaffleSystem.sol/BaseRaffleSystem.json'));
  console.log("Expected bytecode length:", artifact.bytecode.length);
  
  // Deploy
  console.log("Deploying BaseRaffleSystem...");
  const contract = await BaseRaffleSystem.deploy({
    gasLimit: 3000000
  });
  
  await contract.deployed();
  console.log("✅ Deployed to:", contract.address);
  
  // VERIFY the deployment immediately
  console.log("\n🔍 VERIFYING deployment...");
  
  // Check basic functions
  const platformFee = await contract.platformFee();
  const maxRaffleValue = await contract.MAX_RAFFLE_VALUE();
  const rateLimit = await contract.RATE_LIMIT();
  
  console.log("Platform fee:", platformFee.toString(), "(should be 500)");
  console.log("Max raffle value:", ethers.utils.formatEther(maxRaffleValue), "ETH (should be 10)");
  console.log("Rate limit:", rateLimit.toString(), "seconds (should be 10)");
  
  // Verify these match expected values
  if (platformFee.toString() === "500" && 
      maxRaffleValue.eq(ethers.utils.parseEther("10")) &&
      rateLimit.toString() === "10") {
    console.log("✅ CONTRACT VERIFICATION PASSED");
    console.log("\n🎯 Update frontend config:");
    console.log(`BASE_RAFFLE_SYSTEM: "${contract.address}",`);
  } else {
    console.log("❌ CONTRACT VERIFICATION FAILED - WRONG CONTRACT DEPLOYED");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });