const { ethers } = require("hardhat");

async function main() {
  console.log("\n🧪 Deploying Minimal Test Factory...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy MinimalTestFactory
  const MinimalTest = await ethers.getContractFactory("MinimalTestFactory");
  const testFactory = await MinimalTest.deploy({
    gasPrice: ethers.utils.parseUnits('0.01', 'gwei')
  });
  await testFactory.deployed();

  console.log("✅ Minimal Test Factory deployed to:", testFactory.address);

  // Test simple function first
  console.log("\n🧪 Testing Simple Function:");
  try {
    const result = await testFactory.simpleTest();
    console.log("✅ Simple test result:", result);
  } catch (error) {
    console.log("❌ Simple test failed:", error.message);
  }

  // Test the problematic operation
  console.log("\n🧪 Testing Problematic Operation:");
  
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
  const tokenId = '4208';
  const ticketPrice = ethers.utils.parseEther('0.001');
  const maxTickets = 100;
  const duration = 3600;
  
  try {
    const result = await testFactory.provider.call({
      to: testFactory.address,
      data: testFactory.interface.encodeFunctionData('testCreateRaffle', [
        nftContract, tokenId, ticketPrice, maxTickets, duration
      ]),
      from: userAddress
    });
    
    console.log("✅ Test result:", result);
    
    if (result === '0xe1f1d02e') {
      console.log("❌ Same error with minimal factory");
      console.log("The issue is fundamental to Base network");
    } else {
      console.log("✅ Minimal factory works - issue is in complex logic");
    }
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }

  console.log("\n📋 Test Factory Address:", testFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });