const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying RaffleFactorySecureV4...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)), "APE");
    
    // Deploy factory
    const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
    const factory = await RaffleFactorySecureV4.deploy();
    await factory.deployed();
    
    const factoryAddress = factory.address;
    console.log("RaffleFactorySecureV4 deployed to:", factoryAddress);
    
    // Verify deployment
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const raffleTemplate = await factory.raffleTemplate();
    const rateLimit = await factory.RATE_LIMIT();
    
    console.log("Factory owner:", owner);
    console.log("Platform fee:", platformFee.toString(), "(5%)");
    console.log("Rate limit:", rateLimit.toString(), "seconds");
    console.log("Raffle template:", raffleTemplate);
    
    console.log("\n✅ V4 Deployment complete!");
    console.log("🔧 Update frontend config with new V4 factory address:", factoryAddress);
    console.log("⚡ Rate limit reduced to 10 seconds for faster raffle creation");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });