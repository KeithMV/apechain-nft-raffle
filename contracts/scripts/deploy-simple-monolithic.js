const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Simple Monolithic Factory...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const SimpleFactory = await ethers.getContractFactory("SimpleMonolithicFactory");
  const factory = await SimpleFactory.deploy({
    gasPrice: ethers.utils.parseUnits('0.01', 'gwei')
  });
  await factory.deployed();

  console.log("✅ Simple Monolithic Factory deployed to:", factory.address);

  // Test it
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
  const tokenId = '4208';
  const ticketPrice = ethers.utils.parseEther('0.001');
  const maxTickets = 100;
  const duration = 3600;
  
  console.log("\n🧪 Testing Simple Factory:");
  try {
    const result = await factory.provider.call({
      to: factory.address,
      data: factory.interface.encodeFunctionData('createRaffle', [
        nftContract, tokenId, ticketPrice, maxTickets, duration
      ]),
      from: userAddress
    });
    
    console.log("Result:", result);
    
    if (result === '0xe1f1d02e') {
      console.log("❌ Still getting 0xe1f1d02e - issue is deeper");
    } else if (result === '0x') {
      console.log("🎉 SUCCESS! Simple factory works!");
    } else {
      console.log("⚠️ Different result - check error message");
    }
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }

  console.log("\n🔧 Update frontend to use:", factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });