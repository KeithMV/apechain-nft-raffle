const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying RaffleFactorySecureV3...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)), "APE");
    
    // Deploy factory
    const RaffleFactorySecureV3 = await ethers.getContractFactory("RaffleFactorySecureV3");
    const factory = await RaffleFactorySecureV3.deploy();
    await factory.deployed();
    
    const factoryAddress = factory.address;
    console.log("RaffleFactorySecureV3 deployed to:", factoryAddress);
    
    // Verify deployment
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const raffleTemplate = await factory.raffleTemplate();
    
    console.log("Factory owner:", owner);
    console.log("Platform fee:", platformFee.toString(), "(10%)");
    console.log("Raffle template:", raffleTemplate);
    
    console.log("\n✅ Deployment complete!");
    console.log("🔧 Update frontend config with new factory address:", factoryAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });