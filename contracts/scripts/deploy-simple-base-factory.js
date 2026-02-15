const { ethers } = require("hardhat");

async function main() {
  console.log("\n🧪 Deploying Simple Base Factory for Testing...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy SimpleBaseFactory
  console.log("\n🏭 Deploying SimpleBaseFactory...");
  const SimpleBaseFactory = await ethers.getContractFactory("SimpleBaseFactory");
  const factory = await SimpleBaseFactory.deploy();
  await factory.deployed();

  console.log("✅ Simple Factory deployed to:", factory.address);

  // Test the factory
  console.log("\n🧪 Testing Simple Factory...");
  
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
  const tokenId = '1064';
  const ticketPrice = ethers.utils.parseEther('0.001');
  const maxTickets = 1;
  const duration = 3600;
  
  try {
    // Test static call
    const result = await factory.provider.call({
      to: factory.address,
      data: factory.interface.encodeFunctionData('createRaffle', [
        nftContract, tokenId, ticketPrice, maxTickets, duration
      ]),
      from: userAddress
    });
    
    console.log("✅ Simple factory test result:", result);
    
    if (result === '0xe1f1d02e') {
      console.log("❌ Still getting 0xe1f1d02e - issue is in validation logic");
    } else {
      console.log("✅ Simple factory works - issue is in contract creation");
    }
    
  } catch (error) {
    console.log("❌ Simple factory test failed:", error.message);
  }

  console.log("\n📋 Simple Factory Info:");
  console.log("- Address:", factory.address);
  console.log("- Platform Fee:", (await factory.platformFee()).toString());
  console.log("- Rate Limit:", (await factory.RATE_LIMIT()).toString());
  console.log("- Raffle Counter:", (await factory.raffleCounter()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });