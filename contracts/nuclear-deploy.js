const { ethers } = require('ethers');
const fs = require('fs');

async function nuclearOption() {
    console.log("☢️ NUCLEAR OPTION: Using EXTREME gas prices to clear everything");
    
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
    
    // Use EXTREME gas price - 10x current network price
    const gasPrice = await provider.getGasPrice();
    const extremeGasPrice = gasPrice.mul(1000).div(100); // 10x current gas price
    console.log("Current gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
    console.log("Using EXTREME gas price:", ethers.utils.formatUnits(extremeGasPrice, "gwei"), "gwei");
    
    const currentNonce = await wallet.getTransactionCount();
    const pendingNonce = await wallet.getTransactionCount('pending');
    const stuckCount = pendingNonce - currentNonce;
    
    console.log(`Found ${stuckCount} stuck transactions (nonces ${currentNonce} to ${pendingNonce - 1})`);
    
    if (stuckCount === 0) {
        console.log("✅ No stuck transactions! Proceeding to deployment...");
    } else {
        console.log("\n☢️ CLEARING WITH NUCLEAR GAS PRICES...");
        for (let i = 0; i < stuckCount; i++) {
            const nonce = currentNonce + i;
            console.log(`Nuclear replacement for nonce ${nonce}...`);
            
            try {
                const tx = await wallet.sendTransaction({
                    to: wallet.address,
                    value: ethers.utils.parseEther("0.001"),
                    gasPrice: extremeGasPrice,
                    gasLimit: 21000,
                    nonce: nonce
                });
                
                console.log(`✅ Nuclear tx ${i + 1}/${stuckCount}: ${tx.hash}`);
            } catch (error) {
                console.log(`❌ Failed to replace nonce ${nonce}:`, error.message);
            }
        }
        
        console.log("\n⏳ Waiting for nuclear transactions to clear...");
        for (let attempt = 0; attempt < 60; attempt++) {
            const newPendingNonce = await wallet.getTransactionCount('pending');
            const newCurrentNonce = await wallet.getTransactionCount();
            
            if (newPendingNonce === newCurrentNonce) {
                console.log("✅ All transactions cleared with nuclear option!");
                break;
            }
            
            console.log(`Attempt ${attempt + 1}/60: Still ${newPendingNonce - newCurrentNonce} pending...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Deploy with extreme gas prices
    console.log("\n🚀 DEPLOYING WITH NUCLEAR GAS PRICES...");
    
    const templateArtifact = JSON.parse(
        fs.readFileSync("./artifacts/contracts/RaffleContractSecureV3.sol/RaffleContractSecureV3.json")
    );
    const factoryArtifact = JSON.parse(
        fs.readFileSync("./artifacts/contracts/RaffleFactorySecureV4.sol/RaffleFactorySecureV4.json")
    );
    
    // Deploy template
    console.log("📋 Nuclear template deployment...");
    const TemplateFactory = new ethers.ContractFactory(
        templateArtifact.abi,
        templateArtifact.bytecode,
        wallet
    );
    
    const template = await TemplateFactory.deploy({
        gasPrice: extremeGasPrice,
        gasLimit: 3000000
    });
    
    console.log("Template tx:", template.deployTransaction.hash);
    await template.deployed();
    console.log("✅ Template deployed:", template.address);
    
    // Deploy factory
    console.log("\n🏭 Nuclear factory deployment...");
    const FactoryFactory = new ethers.ContractFactory(
        factoryArtifact.abi,
        factoryArtifact.bytecode,
        wallet
    );
    
    const factory = await FactoryFactory.deploy(template.address, {
        gasPrice: extremeGasPrice,
        gasLimit: 4000000
    });
    
    console.log("Factory tx:", factory.deployTransaction.hash);
    await factory.deployed();
    console.log("✅ Factory deployed:", factory.address);
    
    console.log("\n🎯 NUCLEAR SUCCESS! UPDATE CONFIG:");
    console.log(`Factory: ${factory.address}`);
    console.log(`Template: ${template.address}`);
    
    console.log("\n🔗 VERIFY:");
    console.log(`https://polygonscan.com/address/${factory.address}`);
    console.log(`https://polygonscan.com/address/${template.address}`);
}

nuclearOption()
    .then(() => {
        console.log("\n☢️ NUCLEAR DEPLOYMENT SUCCESSFUL!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 NUCLEAR OPTION FAILED:");
        console.error(error.message);
        process.exit(1);
    });