const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying to Polygon with Node.js", process.version);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log("MATIC balance:", ethers.utils.formatEther(balance));
    
    if (balance.eq(0)) {
        throw new Error("No MATIC balance - deployment will fail");
    }
    
    // Deploy template first
    console.log("\n📋 Step 1: Deploying RaffleContractSecureV3 template...");
    const RaffleContractSecureV3 = await ethers.getContractFactory("RaffleContractSecureV3");
    
    const template = await RaffleContractSecureV3.deploy();
    console.log("Template deployment transaction:", template.deployTransaction.hash);
    
    await template.deployed();
    const templateAddress = template.address;
    console.log("✅ Template deployed to:", templateAddress);
    
    // Deploy factory with template address
    console.log("\n🏭 Step 2: Deploying RaffleFactorySecureV4...");
    const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
    
    const factory = await RaffleFactorySecureV4.deploy(templateAddress);
    console.log("Factory deployment transaction:", factory.deployTransaction.hash);
    
    await factory.deployed();
    const factoryAddress = factory.address;
    console.log("✅ Factory deployed to:", factoryAddress);
    
    // Verify deployment
    console.log("\n🔍 Step 3: Verifying deployment...");
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const rateLimit = await factory.RATE_LIMIT();
    const storedTemplate = await factory.raffleTemplate();
    
    console.log("Factory owner:", owner);
    console.log("Platform fee:", platformFee.toString(), "basis points (5%)");
    console.log("Rate limit:", rateLimit.toString(), "seconds");
    console.log("Stored template:", storedTemplate);
    
    // Verify template address matches
    if (storedTemplate.toLowerCase() !== templateAddress.toLowerCase()) {
        throw new Error("Template address mismatch!");
    }
    
    console.log("\n🎯 Frontend Configuration Update:");
    console.log("Copy this to frontend/src/config/addresses.ts:");
    console.log("```");
    console.log("137: { // Polygon Mainnet");
    console.log(`  RAFFLE_FACTORY: "${factoryAddress}",`);
    console.log(`  RAFFLE_FACTORY_V4: "${factoryAddress}",`);
    console.log(`  RAFFLE_TEMPLATE: "${templateAddress}"`);
    console.log("},");
    console.log("```");
    
    console.log("\n✅ Polygon deployment completed successfully!");
    console.log("🔗 View on PolygonScan:");
    console.log(`Factory: https://polygonscan.com/address/${factoryAddress}`);
    console.log(`Template: https://polygonscan.com/address/${templateAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error("Error:", error.message);
        if (error.code) console.error("Code:", error.code);
        if (error.reason) console.error("Reason:", error.reason);
        if (error.transaction) console.error("Transaction:", error.transaction);
        process.exit(1);
    });