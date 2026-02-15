const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying to Polygon...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log("MATIC balance:", ethers.utils.formatEther(balance));
    
    if (balance.eq(0)) {
        console.log("❌ No MATIC balance - deployment will fail");
        process.exit(1);
    }
    
    console.log("Deploying RaffleFactorySecureV4...");
    
    // Deploy factory with explicit gas settings
    const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
    const factory = await RaffleFactorySecureV4.deploy({
        gasLimit: 5000000,
        gasPrice: ethers.utils.parseUnits("30", "gwei")
    });
    
    console.log("Waiting for deployment...");
    await factory.deployed();
    
    const factoryAddress = factory.address;
    console.log("✅ RaffleFactorySecureV4 deployed to:", factoryAddress);
    
    // Get template address (it's a public immutable variable)
    const templateAddress = await factory.raffleTemplate();
    console.log("✅ RaffleContractSecureV3 template at:", templateAddress);
    
    // Verify basic functionality
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const rateLimit = await factory.RATE_LIMIT();
    
    console.log("Factory owner:", owner);
    console.log("Platform fee:", platformFee.toString(), "basis points (5%)");
    console.log("Rate limit:", rateLimit.toString(), "seconds");
    
    console.log("\n🎯 Update frontend config:");
    console.log(`RAFFLE_FACTORY: "${factoryAddress}",`);
    console.log(`RAFFLE_FACTORY_V4: "${factoryAddress}",`);
    console.log(`RAFFLE_TEMPLATE: "${templateAddress}",`);
    
    console.log("\n✅ Polygon deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });