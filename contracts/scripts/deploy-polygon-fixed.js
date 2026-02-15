const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying to Polygon...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance with timeout
    try {
        const balance = await Promise.race([
            deployer.getBalance(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Balance check timeout')), 10000))
        ]);
        console.log("MATIC balance:", ethers.utils.formatEther(balance));
        
        if (balance.eq(0)) {
            console.log("❌ No MATIC balance - deployment will fail");
            process.exit(1);
        }
    } catch (error) {
        console.log("⚠️ Could not check balance:", error.message);
        console.log("Proceeding with deployment...");
    }
    
    // Deploy template first
    console.log("Deploying RaffleContractSecureV3 template...");
    const RaffleContractSecureV3 = await ethers.getContractFactory("RaffleContractSecureV3");
    
    const template = await RaffleContractSecureV3.deploy({
        gasLimit: 2500000,
        gasPrice: ethers.utils.parseUnits("50", "gwei") // Higher gas price
    });
    
    console.log("Waiting for template deployment...");
    await template.deployed();
    const templateAddress = template.address;
    console.log("✅ Template deployed to:", templateAddress);
    
    // Deploy factory with template address
    console.log("Deploying RaffleFactorySecureV4...");
    const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
    
    const factory = await RaffleFactorySecureV4.deploy(templateAddress, {
        gasLimit: 2500000,
        gasPrice: ethers.utils.parseUnits("50", "gwei") // Higher gas price
    });
    
    console.log("Waiting for factory deployment...");
    await factory.deployed();
    const factoryAddress = factory.address;
    console.log("✅ Factory deployed to:", factoryAddress);
    
    // Verify deployment
    try {
        const owner = await factory.owner();
        const platformFee = await factory.platformFee();
        const rateLimit = await factory.RATE_LIMIT();
        const storedTemplate = await factory.raffleTemplate();
        
        console.log("✅ Deployment verified:");
        console.log("Factory owner:", owner);
        console.log("Platform fee:", platformFee.toString(), "basis points");
        console.log("Rate limit:", rateLimit.toString(), "seconds");
        console.log("Template address:", storedTemplate);
        
        if (storedTemplate.toLowerCase() !== templateAddress.toLowerCase()) {
            console.log("❌ Template address mismatch!");
            process.exit(1);
        }
    } catch (error) {
        console.log("⚠️ Could not verify deployment:", error.message);
    }
    
    console.log("\n🎯 Update frontend config:");
    console.log(`137: {`);
    console.log(`  RAFFLE_FACTORY: "${factoryAddress}",`);
    console.log(`  RAFFLE_FACTORY_V4: "${factoryAddress}",`);
    console.log(`  RAFFLE_TEMPLATE: "${templateAddress}"`);
    console.log(`},`);
    
    console.log("\n✅ Polygon deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error.message);
        if (error.code) console.error("Error code:", error.code);
        if (error.reason) console.error("Reason:", error.reason);
        process.exit(1);
    });