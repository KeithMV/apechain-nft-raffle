const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting Polygon V4 Deployment with High Gas Settings");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("Balance:", ethers.utils.formatEther(balance), "MATIC");
    
    if (balance.lt(ethers.utils.parseEther("0.5"))) {
        throw new Error("Insufficient MATIC balance for deployment");
    }
    
    // High gas settings for reliable deployment
    const gasSettings = {
        gasLimit: 8000000,
        gasPrice: ethers.utils.parseUnits("100", "gwei"), // 100 gwei
    };
    
    console.log("Gas settings:", gasSettings);
    
    // Deploy template first
    console.log("\n📋 Step 1: Deploying RaffleContractSecureV3 template...");
    const RaffleContractSecureV3 = await ethers.getContractFactory("RaffleContractSecureV3");
    
    console.log("Sending template deployment transaction...");
    const template = await RaffleContractSecureV3.deploy(gasSettings);
    console.log("Template tx hash:", template.deployTransaction.hash);
    
    console.log("Waiting for template deployment confirmation...");
    const templateReceipt = await template.deployTransaction.wait(2); // Wait for 2 confirmations
    console.log("✅ Template deployed at:", template.address);
    console.log("Gas used:", templateReceipt.gasUsed.toString());
    
    // Deploy factory
    console.log("\n🏭 Step 2: Deploying RaffleFactorySecureV4...");
    const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
    
    console.log("Sending factory deployment transaction...");
    const factory = await RaffleFactorySecureV4.deploy(template.address, gasSettings);
    console.log("Factory tx hash:", factory.deployTransaction.hash);
    
    console.log("Waiting for factory deployment confirmation...");
    const factoryReceipt = await factory.deployTransaction.wait(2); // Wait for 2 confirmations
    console.log("✅ Factory deployed at:", factory.address);
    console.log("Gas used:", factoryReceipt.gasUsed.toString());
    
    // Verify deployment
    console.log("\n🔍 Step 3: Verifying deployment...");
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const rateLimit = await factory.RATE_LIMIT();
    const storedTemplate = await factory.raffleTemplate();
    
    console.log("✅ Verification complete:");
    console.log("- Owner:", owner);
    console.log("- Platform fee:", platformFee.toString(), "basis points");
    console.log("- Rate limit:", rateLimit.toString(), "seconds");
    console.log("- Template:", storedTemplate);
    
    // Output configuration
    console.log("\n🎯 UPDATE FRONTEND CONFIG:");
    console.log("Copy this to frontend/src/config/unified.ts:");
    console.log("```");
    console.log("const POLYGON_CONFIG: ChainConfig = {");
    console.log("  // ... other config ...");
    console.log("  contracts: {");
    console.log(`    factory: '${factory.address}',`);
    console.log(`    template: '${template.address}',`);
    console.log("  },");
    console.log("};");
    console.log("```");
    
    console.log("\n✅ DEPLOYMENT SUCCESSFUL!");
    console.log(`🔗 Factory: https://polygonscan.com/address/${factory.address}`);
    console.log(`🔗 Template: https://polygonscan.com/address/${template.address}`);
}

main()
    .then(() => {
        console.log("\n🎉 Deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error("Error:", error.message);
        if (error.transaction) {
            console.error("Transaction:", error.transaction);
        }
        if (error.receipt) {
            console.error("Receipt:", error.receipt);
        }
        process.exit(1);
    });