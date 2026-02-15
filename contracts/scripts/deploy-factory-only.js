const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Factory with Existing Template...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Use existing template
  const existingTemplate = '0xfC8e546D9C6F1b9cEc20cA669D07E8af5aa084bA';
  console.log("Using existing template:", existingTemplate);

  // Deploy factory with existing template
  console.log("\n🏭 Deploying RaffleFactoryBaseFinal...");
  const RaffleFactory = await ethers.getContractFactory("RaffleFactoryBaseFinal");
  const factory = await RaffleFactory.deploy(existingTemplate, {
    gasPrice: ethers.utils.parseUnits('0.01', 'gwei') // Higher gas price
  });
  await factory.deployed();

  console.log("✅ Final Base Factory deployed to:", factory.address);

  console.log("\n🔧 Update frontend config:");
  console.log(`RAFFLE_FACTORY: '${factory.address}'`);
  console.log(`RAFFLE_FACTORY_V4: '${factory.address}'`);
  console.log(`RAFFLE_TEMPLATE: '${existingTemplate}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });