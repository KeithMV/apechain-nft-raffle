const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Base Factory V4 (Same as ApeChain)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy the exact same V4 factory that works on ApeChain
  console.log("\n🏗️ Deploying RaffleFactorySecureV4...");
  const RaffleFactoryV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
  
  const factory = await RaffleFactoryV4.deploy({
    gasPrice: ethers.utils.parseUnits('0.01', 'gwei'),
    gasLimit: 3000000
  });
  
  await factory.deployed();
  console.log("✅ RaffleFactorySecureV4 deployed to:", factory.address);

  // Deploy the template contract
  console.log("\n🏗️ Deploying RaffleContractSecureV3 template...");
  const RaffleTemplate = await ethers.getContractFactory("RaffleContractSecureV3");
  
  const template = await RaffleTemplate.deploy({
    gasPrice: ethers.utils.parseUnits('0.01', 'gwei'),
    gasLimit: 3000000
  });
  
  await template.deployed();
  console.log("✅ Template deployed to:", template.address);

  // Set the template in the factory
  console.log("\n🔧 Setting template in factory...");
  const setTemplateTx = await factory.setRaffleTemplate(template.address, {
    gasPrice: ethers.utils.parseUnits('0.01', 'gwei')
  });
  await setTemplateTx.wait();
  console.log("✅ Template set successfully");

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await factory.owner();
  const platformFee = await factory.platformFee();
  const raffleCounter = await factory.raffleCounter();
  const templateAddress = await factory.raffleTemplate();
  
  console.log("✅ Deployment verified:");
  console.log("  - Owner:", owner);
  console.log("  - Platform Fee:", platformFee.toString(), "basis points");
  console.log("  - Raffle Counter:", raffleCounter.toString());
  console.log("  - Template:", templateAddress);

  console.log("\n🔧 Update frontend addresses.ts:");
  console.log(`  8453: {`);
  console.log(`    RAFFLE_FACTORY: '${factory.address}',`);
  console.log(`    RAFFLE_FACTORY_V4: '${factory.address}',`);
  console.log(`    RAFFLE_TEMPLATE: '${template.address}'`);
  console.log(`  },`);

  console.log("\n🎉 Base V4 Factory deployed successfully!");
  console.log("This uses the exact same architecture as ApeChain V4");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });