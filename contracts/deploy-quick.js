const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Quick deployment with explicit settings");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const gasPrice = await ethers.provider.getGasPrice();
    console.log("Network gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
    
    // Use slightly higher gas price for faster inclusion
    const adjustedGasPrice = gasPrice.mul(110).div(100); // 10% higher
    
    console.log("📋 Deploying template with explicit gas...");
    const RaffleContractSecureV3 = await ethers.getContractFactory("RaffleContractSecureV3");
    
    const template = await RaffleContractSecureV3.deploy({
        gasPrice: adjustedGasPrice,
        gasLimit: 2000000 // Explicit gas limit
    });
    
    console.log("Transaction hash:", template.deployTransaction.hash);
    console.log("Waiting for 1 confirmation...");
    
    // Wait with timeout
    const receipt = await template.deployTransaction.wait(1);
    console.log("✅ Template deployed to:", template.address);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\n🏭 Deploying factory...");
    const RaffleFactorySecureV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
    
    const factory = await RaffleFactorySecureV4.deploy(template.address, {
        gasPrice: adjustedGasPrice,
        gasLimit: 3000000
    });
    
    console.log("Factory transaction hash:", factory.deployTransaction.hash);
    const factoryReceipt = await factory.deployTransaction.wait(1);
    console.log("✅ Factory deployed to:", factory.address);
    console.log("Gas used:", factoryReceipt.gasUsed.toString());
    
    console.log("\n🎯 UPDATE CONFIG:");
    console.log(`Factory: ${factory.address}`);
    console.log(`Template: ${template.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error.message);
        process.exit(1);
    });