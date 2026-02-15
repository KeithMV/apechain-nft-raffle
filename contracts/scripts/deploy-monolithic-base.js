const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Monolithic Base Factory...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy MonolithicBaseFactory
  console.log("\n🏭 Deploying MonolithicBaseFactory...");
  const MonolithicFactory = await ethers.getContractFactory("MonolithicBaseFactory");
  const factory = await MonolithicFactory.deploy({
    gasPrice: ethers.utils.parseUnits('0.01', 'gwei')
  });
  await factory.deployed();

  console.log("✅ Monolithic Base Factory deployed to:", factory.address);

  // Test the factory
  console.log("\n🧪 Testing Monolithic Factory...");
  
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
  const tokenId = '1064';
  const ticketPrice = ethers.utils.parseEther('0.001');
  const maxTickets = 1;
  const duration = 3600;
  
  try {
    const result = await factory.provider.call({
      to: factory.address,
      data: factory.interface.encodeFunctionData('createRaffle', [
        nftContract, tokenId, ticketPrice, maxTickets, duration
      ]),
      from: userAddress
    });
    
    console.log("✅ Monolithic factory test result:", result);
    
    if (result === '0xe1f1d02e') {
      console.log("❌ Still getting 0xe1f1d02e");
    } else if (result === '0x') {
      console.log("🎉 SUCCESS! Monolithic factory works!");
    } else {
      console.log("⚠️ Unexpected result");
    }
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }

  console.log("\n📊 Factory Info:");
  console.log("- Address:", factory.address);
  console.log("- Platform Fee:", (await factory.platformFee()).toString());
  console.log("- Rate Limit:", (await factory.RATE_LIMIT()).toString());
  console.log("- Raffle Counter:", (await factory.raffleCounter()).toString());
  console.log("- Owner:", await factory.owner());

  console.log("\n🔧 Update frontend config:");
  console.log(`RAFFLE_FACTORY: '${factory.address}'`);
  console.log(`RAFFLE_FACTORY_V4: '${factory.address}'`);
  console.log(`RAFFLE_TEMPLATE: '${factory.address}' // Same contract`);

  console.log("\n✅ Monolithic Base Factory Features:");
  console.log("- ✅ No contract creation (all logic embedded)");
  console.log("- ✅ No template cloning issues");
  console.log("- ✅ 10-second rate limits");
  console.log("- ✅ 5% platform fee");
  console.log("- ✅ Full raffle functionality");
  console.log("- ✅ Base network compatible");
  console.log("- ✅ Should eliminate 0xe1f1d02e errors!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });