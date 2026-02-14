const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Base Factory with ApeChain Template...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy the template contract first (same as ApeChain)
  console.log("\n📋 Deploying Template Contract...");
  const RaffleTemplate = await ethers.getContractFactory("RaffleContractSecureV3");
  const template = await RaffleTemplate.deploy();
  await template.deployed();
  
  console.log("Template deployed to:", template.address);

  // Deploy factory with the template
  console.log("\n🏭 Deploying Factory...");
  const RaffleFactory = await ethers.getContractFactory("RaffleFactorySecureV4");
  const factory = await RaffleFactory.deploy();
  await factory.deployed();

  console.log("Factory deployed to:", factory.address);

  // Verify deployment
  const owner = await factory.owner();
  const platformFee = await factory.platformFee();
  const rateLimit = await factory.RATE_LIMIT();
  const templateAddress = await factory.raffleTemplate();

  console.log("\n✅ Deployment Verification:");
  console.log("Factory owner:", owner);
  console.log("Platform fee:", platformFee.toString(), "(5%)");
  console.log("Rate limit:", rateLimit.toString(), "seconds");
  console.log("Template address:", templateAddress);

  console.log("\n🔧 Update frontend config:");
  console.log("RAFFLE_FACTORY:", factory.address);
  console.log("RAFFLE_TEMPLATE:", templateAddress);
  
  // Test basic functionality
  console.log("\n🧪 Testing basic functions...");
  try {
    const counter = await factory.raffleCounter();
    const paused = await factory.paused();
    console.log("✅ Raffle counter:", counter.toString());
    console.log("✅ Paused:", paused);
    console.log("✅ Factory is functional!");
  } catch (error) {
    console.log("❌ Factory test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });