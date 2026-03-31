const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    console.log("🔧 DIRECT DEPLOYMENT - BYPASSING HARDHAT NETWORK ISSUES");
    
    // Direct RPC connection
    const provider = new ethers.providers.JsonRpcProvider(
        "https://polygon-mainnet.g.alchemy.com/v2/AyuLQ-1xvN148vswTZxHo"
    );
    
    // Direct wallet connection
    const wallet = new ethers.Wallet(
        "0xeae609bbc4e723f64ce016d0ca24dd8997fd41435f5c90a9f1aff41d48ea91c4",
        provider
    );
    
    console.log("Wallet:", wallet.address);
    
    const balance = await wallet.getBalance();
    console.log("Balance:", ethers.utils.formatEther(balance), "MATIC");
    
    // Load compiled contracts directly
    const templateArtifact = JSON.parse(
        fs.readFileSync("./artifacts/contracts/RaffleContractSecureV3.sol/RaffleContractSecureV3.json")
    );
    
    const factoryArtifact = JSON.parse(
        fs.readFileSync("./artifacts/contracts/RaffleFactorySecureV4.sol/RaffleFactorySecureV4.json")
    );
    
    console.log("📋 Deploying template...");
    const TemplateFactory = new ethers.ContractFactory(
        templateArtifact.abi,
        templateArtifact.bytecode,
        wallet
    );
    
    const gasPrice = await provider.getGasPrice();
    console.log("Gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
    
    const template = await TemplateFactory.deploy({
        gasPrice: gasPrice.mul(110).div(100), // 10% buffer
        gasLimit: 2000000
    });
    
    console.log("Template tx:", template.deployTransaction.hash);
    await template.deployed();
    console.log("✅ Template:", template.address);
    
    console.log("🏭 Deploying factory...");
    const FactoryFactory = new ethers.ContractFactory(
        factoryArtifact.abi,
        factoryArtifact.bytecode,
        wallet
    );
    
    const factory = await FactoryFactory.deploy(template.address, {
        gasPrice: gasPrice.mul(110).div(100),
        gasLimit: 3000000
    });
    
    console.log("Factory tx:", factory.deployTransaction.hash);
    await factory.deployed();
    console.log("✅ Factory:", factory.address);
    
    console.log("\n🎯 SUCCESS! UPDATE CONFIG:");
    console.log(`Factory: ${factory.address}`);
    console.log(`Template: ${template.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ FAILED:", error.message);
        console.error(error);
        process.exit(1);
    });