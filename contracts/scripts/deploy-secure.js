const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Secure NFT Raffle Contracts...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "APE\n");
  
  // Deploy secure factory
  console.log("📦 Deploying RaffleFactorySecure...");
  const RaffleFactorySecure = await ethers.getContractFactory("RaffleFactorySecure");
  const factory = await RaffleFactorySecure.deploy();
  await factory.deployed();
  
  console.log("✅ RaffleFactorySecure deployed to:", factory.address);
  
  // Get template address
  const templateAddress = await factory.raffleTemplate();
  console.log("✅ RaffleContractSecure template:", templateAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const platformFee = await factory.platformFee();
  const raffleCounter = await factory.raffleCounter();
  
  console.log("Platform fee:", platformFee.toString(), "basis points");
  console.log("Raffle counter:", raffleCounter.toString());
  
  // Save addresses
  const addresses = {
    RAFFLE_FACTORY_SECURE: factory.address,
    RAFFLE_TEMPLATE_SECURE: templateAddress,
    DEPLOYER: deployer.address,
    NETWORK: 'apechain',
    DEPLOYED_AT: new Date().toISOString(),
    PLATFORM_FEE: platformFee.toString(),
    VERSION: 'v3-secure'
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("Factory Address:", factory.address);
  console.log("Template Address:", templateAddress);
  console.log("Platform Fee:", platformFee.toString(), "basis points (10%)");
  console.log("Version: v3-secure");
  
  console.log("\n✅ Secure contracts deployed successfully!");
  console.log("\n⚠️  IMPORTANT: Update frontend to use new factory address");
  console.log("Old Factory:", "0x05139110Db8FF9cF82A836Af95eff4530011c705");
  console.log("New Factory:", factory.address);
  
  return addresses;
}

main()
  .then((addresses) => {
    console.log("\n🎉 Deployment completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });