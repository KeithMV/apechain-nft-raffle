const { ethers } = require("hardhat");

async function main() {
    console.log("🔒 Deploying Secure V2 Raffle Contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // Deploy RaffleFactorySecureV2
    console.log("\n📦 Deploying RaffleFactorySecureV2...");
    const RaffleFactorySecureV2 = await ethers.getContractFactory("RaffleFactorySecureV2");
    const factory = await RaffleFactorySecureV2.deploy();
    await factory.deployed();
    
    console.log("✅ RaffleFactorySecureV2 deployed to:", factory.address);
    
    // Get the template address
    const templateAddress = await factory.raffleTemplate();
    console.log("✅ RaffleContractSecureV2 template at:", templateAddress);
    
    // Verify initial settings
    const platformFee = await factory.platformFee();
    const maxFee = await factory.MAX_FEE();
    const minDuration = await factory.MIN_DURATION();
    const maxDuration = await factory.MAX_DURATION();
    
    console.log("\n🔧 Contract Configuration:");
    console.log("Platform Fee:", platformFee.toString(), "basis points");
    console.log("Max Fee:", maxFee.toString(), "basis points");
    console.log("Min Duration:", minDuration.toString(), "seconds");
    console.log("Max Duration:", maxDuration.toString(), "seconds");
    
    // Save deployment info
    const deploymentInfo = {
        network: "apechain",
        factoryAddress: factory.address,
        templateAddress: templateAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        version: "v2-secure"
    };
    
    console.log("\n📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    const paused = await factory.paused();
    const owner = await factory.owner();
    
    console.log("Contract paused:", paused);
    console.log("Contract owner:", owner);
    console.log("Deployer is owner:", owner === deployer.address);
    
    console.log("\n✅ Secure V2 deployment completed successfully!");
    console.log("🔒 Enhanced security features:");
    console.log("  - Secure multi-source randomness");
    console.log("  - Rate limiting (5 min between raffles)");
    console.log("  - NFT blacklisting capability");
    console.log("  - Enhanced validation and access controls");
    console.log("  - Comprehensive reentrancy protection");
    
    return {
        factory: factory.address,
        template: templateAddress
    };
}

main()
    .then((addresses) => {
        console.log("\n🎯 Ready for production with addresses:", addresses);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });