const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying V3 Factory (No Template Cloning)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.log("❌ Insufficient ETH for deployment");
    return;
  }

  try {
    // Deploy V3 factory (creates contracts directly, no cloning)
    console.log("\n🏭 Deploying RaffleFactorySecureV3...");
    const RaffleFactory = await ethers.getContractFactory("RaffleFactorySecureV3");
    const factory = await RaffleFactory.deploy();
    await factory.deployed();

    console.log("✅ V3 Factory deployed to:", factory.address);

    // Verify deployment
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const counter = await factory.raffleCounter();
    const paused = await factory.paused();

    console.log("\n📊 Factory Info:");
    console.log("- Owner:", owner);
    console.log("- Platform Fee:", platformFee.toString(), "basis points");
    console.log("- Raffle Counter:", counter.toString());
    console.log("- Paused:", paused);

    console.log("\n🔧 Update frontend config:");
    console.log("RAFFLE_FACTORY:", factory.address);
    console.log("RAFFLE_FACTORY_V4:", factory.address);
    console.log("RAFFLE_TEMPLATE: 'N/A' // V3 creates directly");

    console.log("\n✅ V3 Factory ready for Base network!");
    console.log("This bypasses the template cloning issue causing 0xe1f1d02e");

  } catch (error) {
    console.log("❌ Deployment failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });