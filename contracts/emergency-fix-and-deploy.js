const { ethers } = require('ethers');
const fs = require('fs');

async function fixAndDeploy() {
    console.log("🚨 EMERGENCY FIX: Clearing stuck transactions and deploying V4");
    
    const provider = new ethers.providers.JsonRpcProvider(
        "https://polygon-mainnet.g.alchemy.com/v2/AyuLQ-1xvN148vswTZxHo"
    );
    
    const wallet = new ethers.Wallet(
        "0xeae609bbc4e723f64ce016d0ca24dd8997fd41435f5c90a9f1aff41d48ea91c4",
        provider
    );
    
    console.log("Wallet:", wallet.address);
    const balance = await wallet.getBalance();
    console.log("Balance:", ethers.utils.formatEther(balance), "MATIC");
    
    // Get current gas price and use PREMIUM pricing
    const gasPrice = await provider.getGasPrice();
    const premiumGasPrice = gasPrice.mul(200).div(100); // 2x current gas price
    console.log("Using PREMIUM gas price:", ethers.utils.formatUnits(premiumGasPrice, "gwei"), "gwei");
    
    const currentNonce = await wallet.getTransactionCount();
    const pendingNonce = await wallet.getTransactionCount('pending');
    const stuckCount = pendingNonce - currentNonce;
    
    console.log(`Found ${stuckCount} stuck transactions (nonces ${currentNonce} to ${pendingNonce - 1})`);
    
    // STEP 1: Clear stuck transactions by replacing them with high-gas self-transfers
    console.log("\n🧹 CLEARING STUCK TRANSACTIONS...");
    for (let i = 0; i < stuckCount; i++) {
        const nonce = currentNonce + i;
        console.log(`Replacing stuck transaction at nonce ${nonce}...`);
        
        const tx = await wallet.sendTransaction({
            to: wallet.address, // Send to self
            value: ethers.utils.parseEther("0.001"), // Small amount
            gasPrice: premiumGasPrice,
            gasLimit: 21000,
            nonce: nonce
        });
        
        console.log(`✅ Replacement tx ${i + 1}/${stuckCount}: ${tx.hash}`);
    }
    
    console.log("\n⏳ Waiting for stuck transactions to clear...");
    // Wait for all replacement transactions to be mined
    let cleared = false;
    for (let attempt = 0; attempt < 30; attempt++) {
        const newPendingNonce = await wallet.getTransactionCount('pending');
        const newCurrentNonce = await wallet.getTransactionCount();
        
        if (newPendingNonce === newCurrentNonce) {
            console.log("✅ All stuck transactions cleared!");
            cleared = true;
            break;
        }
        
        console.log(`Attempt ${attempt + 1}/30: Still ${newPendingNonce - newCurrentNonce} pending...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    
    if (!cleared) {
        throw new Error("Stuck transactions still not cleared after 1 minute");
    }
    
    // STEP 2: Deploy contracts with premium gas
    console.log("\n🚀 DEPLOYING V4 CONTRACTS WITH PREMIUM GAS...");
    
    // Load contracts
    const templateArtifact = JSON.parse(
        fs.readFileSync("./artifacts/contracts/RaffleContractSecureV3.sol/RaffleContractSecureV3.json")
    );
    const factoryArtifact = JSON.parse(
        fs.readFileSync("./artifacts/contracts/RaffleFactorySecureV4.sol/RaffleFactorySecureV4.json")
    );
    
    // Deploy template
    console.log("📋 Deploying RaffleContractSecureV3 template...");
    const TemplateFactory = new ethers.ContractFactory(
        templateArtifact.abi,
        templateArtifact.bytecode,
        wallet
    );
    
    const template = await TemplateFactory.deploy({
        gasPrice: premiumGasPrice,
        gasLimit: 2500000
    });
    
    console.log("Template tx:", template.deployTransaction.hash);
    console.log("Waiting for template deployment...");
    await template.deployed();
    console.log("✅ Template deployed:", template.address);
    
    // Deploy factory
    console.log("\n🏭 Deploying RaffleFactorySecureV4...");
    const FactoryFactory = new ethers.ContractFactory(
        factoryArtifact.abi,
        factoryArtifact.bytecode,
        wallet
    );
    
    const factory = await FactoryFactory.deploy(template.address, {
        gasPrice: premiumGasPrice,
        gasLimit: 3500000
    });
    
    console.log("Factory tx:", factory.deployTransaction.hash);
    console.log("Waiting for factory deployment...");
    await factory.deployed();
    console.log("✅ Factory deployed:", factory.address);
    
    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await factory.owner();
    const platformFee = await factory.platformFee();
    const rateLimit = await factory.RATE_LIMIT();
    const storedTemplate = await factory.raffleTemplate();
    
    console.log("✅ DEPLOYMENT SUCCESSFUL!");
    console.log("Factory owner:", owner);
    console.log("Platform fee:", platformFee.toString(), "basis points");
    console.log("Rate limit:", rateLimit.toString(), "seconds");
    console.log("Template address:", storedTemplate);
    
    console.log("\n🎯 UPDATE YOUR FRONTEND CONFIG:");
    console.log("Replace in frontend/src/config/unified.ts:");
    console.log("```");
    console.log("const POLYGON_CONFIG: ChainConfig = {");
    console.log("  // ... other config ...");
    console.log("  contracts: {");
    console.log(`    factory: '${factory.address}',`);
    console.log(`    template: '${template.address}',`);
    console.log("  },");
    console.log("};");
    console.log("```");
    
    console.log("\n🔗 VERIFY ON POLYGONSCAN:");
    console.log(`Factory: https://polygonscan.com/address/${factory.address}`);
    console.log(`Template: https://polygonscan.com/address/${template.address}`);
    
    console.log("\n🎉 YOUR V4 CONTRACT IS DEPLOYED AND READY!");
}

fixAndDeploy()
    .then(() => {
        console.log("\n✅ MISSION ACCOMPLISHED!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error(error.message);
        console.error("\nFull error:", error);
        process.exit(1);
    });