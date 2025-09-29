const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying ApeCoin NFT Raffle System to ApeChain...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // Deploy RaffleFactory (which automatically deploys RaffleContract template)
    console.log("\nDeploying RaffleFactory...");
    const RaffleFactory = await ethers.getContractFactory("RaffleFactory");
    const raffleFactory = await RaffleFactory.deploy();
    await raffleFactory.deployed();
    
    console.log("✅ RaffleFactory deployed to:", raffleFactory.address);
    
    // Get template address
    const templateAddress = await raffleFactory.raffleTemplate();
    console.log("✅ RaffleContract template deployed to:", templateAddress);
    
    // Verify deployment
    const platformFee = await raffleFactory.platformFee();
    const raffleCounter = await raffleFactory.raffleCounter();
    
    console.log("\n📊 Deployment Summary:");
    console.log("- RaffleFactory:", raffleFactory.address);
    console.log("- RaffleContract Template:", templateAddress);
    console.log("- Platform Fee:", platformFee.toString(), "basis points (10%)");
    console.log("- Initial Raffle Counter:", raffleCounter.toString());
    
    // Save deployment info
    const deploymentInfo = {
        network: "apechain",
        raffleFactory: raffleFactory.address,
        raffleTemplate: templateAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        platformFee: platformFee.toString()
    };
    
    console.log("\n💾 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n🎉 ApeCoin NFT Raffle System deployed successfully!");
    console.log("Ready to create raffles for expensive NFTs!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });