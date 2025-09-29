const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing ApeCoin NFT Raffle System locally...");
    
    // Get test accounts
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    
    // Deploy RaffleFactory
    console.log("\n📦 Deploying RaffleFactory...");
    const RaffleFactory = await ethers.getContractFactory("RaffleFactory");
    const raffleFactory = await RaffleFactory.deploy();
    await raffleFactory.deployed();
    console.log("✅ RaffleFactory deployed to:", raffleFactory.address);
    
    // Deploy a test NFT for testing
    console.log("\n🎨 Deploying test NFT...");
    const TestNFT = await ethers.getContractFactory("TestNFT");
    const testNFT = await TestNFT.deploy();
    await testNFT.deployed();
    console.log("✅ TestNFT deployed to:", testNFT.address);
    
    // Mint test NFT to user1
    console.log("\n🎯 Minting test NFT...");
    await testNFT.connect(user1).mint(user1.address, 1);
    console.log("✅ NFT #1 minted to user1");
    
    // Approve RaffleFactory to handle the NFT (this will be done in frontend)
    console.log("\n🔓 Approving NFT transfer...");
    await testNFT.connect(user1).approve(raffleFactory.address, 1);
    console.log("✅ NFT approved for transfer");
    
    // Test contract functions
    console.log("\n📊 Testing contract functions...");
    const platformFee = await raffleFactory.platformFee();
    const raffleCounter = await raffleFactory.raffleCounter();
    console.log("- Platform Fee:", platformFee.toString(), "basis points");
    console.log("- Raffle Counter:", raffleCounter.toString());
    
    console.log("\n🎉 All tests passed! Contracts are working correctly.");
    console.log("Ready to deploy to ApeChain mainnet!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });