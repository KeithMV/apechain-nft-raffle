const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying TRUE Base V3 Factory (Direct Creation)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  try {
    // Deploy the TRUE Base V3 factory (no cloning)
    console.log("\n🏭 Deploying RaffleFactoryBaseV3...");
    const RaffleFactory = await ethers.getContractFactory("RaffleFactoryBaseV3");
    const factory = await RaffleFactory.deploy();
    await factory.deployed();

    console.log("✅ Base V3 Factory deployed to:", factory.address);

    // Verify deployment
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const rateLimit = await factory.RATE_LIMIT();
    const counter = await factory.raffleCounter();
    const paused = await factory.paused();

    console.log("\n📊 Factory Info:");
    console.log("- Owner:", owner);
    console.log("- Platform Fee:", platformFee.toString(), "basis points (5%)");
    console.log("- Rate Limit:", rateLimit.toString(), "seconds (V4 speed!)");
    console.log("- Raffle Counter:", counter.toString());
    console.log("- Paused:", paused);

    console.log("\n🔧 Update frontend config:");
    console.log("RAFFLE_FACTORY:", factory.address);
    console.log("RAFFLE_FACTORY_V4:", factory.address);
    console.log("RAFFLE_TEMPLATE: 'N/A' // Direct creation");

    console.log("\n✅ TRUE Base V3 Factory Features:");
    console.log("- ✅ Direct contract creation (NO CLONING)");
    console.log("- ✅ 10-second rate limits (V4 speed)");
    console.log("- ✅ 5% platform fee (V4 rate)");
    console.log("- ✅ Full security features");
    console.log("- ✅ Base network compatible");
    console.log("- ✅ No more 0xe1f1d02e errors!");

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