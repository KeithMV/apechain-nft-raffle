const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Comparing Base vs ApeChain Template Contracts...\n");

  // Contract addresses
  const baseFactory = "0x152bAe0F11616F0e28cA2c675e1d784e60af43d3";
  const apeChainFactory = "0x1627E7e63b63878E61f91D336385a59B1747934a";
  
  const baseTemplate = "0xB1BD036a7e96112ba96dE6Ee3A1Fee0b032FB73b";
  const apeChainTemplate = "0x7F5B4a9B5d87213a2861027A0A1fC2F72Bb0b33A";
  
  console.log("📊 Contract Addresses:");
  console.log("Base Factory:", baseFactory);
  console.log("ApeChain Factory:", apeChainFactory);
  console.log("Base Template:", baseTemplate);
  console.log("ApeChain Template:", apeChainTemplate);
  
  try {
    // Get Base provider
    const baseProvider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
    
    // Get contract bytecode
    console.log("\n🔍 Checking Template Contract Bytecode...");
    
    const baseTemplateCode = await baseProvider.getCode(baseTemplate);
    console.log("Base Template Code Length:", baseTemplateCode.length);
    console.log("Base Template Code Hash:", ethers.utils.keccak256(baseTemplateCode));
    
    // Check if template is properly deployed
    if (baseTemplateCode === "0x") {
      console.log("❌ Base template contract not deployed!");
      return;
    }
    
    // Try to interact with Base factory
    console.log("\n🔍 Testing Base Factory...");
    
    const RaffleFactory = await ethers.getContractFactory("RaffleFactorySecureV4");
    const baseFactoryContract = new ethers.Contract(baseFactory, RaffleFactory.interface, baseProvider);
    
    const owner = await baseFactoryContract.owner();
    const platformFee = await baseFactoryContract.platformFee();
    const rateLimit = await baseFactoryContract.RATE_LIMIT();
    const paused = await baseFactoryContract.paused();
    const raffleCounter = await baseFactoryContract.raffleCounter();
    
    console.log("✅ Base Factory Info:");
    console.log("  - Owner:", owner);
    console.log("  - Platform Fee:", platformFee.toString());
    console.log("  - Rate Limit:", rateLimit.toString());
    console.log("  - Paused:", paused);
    console.log("  - Raffle Counter:", raffleCounter.toString());
    
    // Test template creation
    console.log("\n🔍 Testing Template Creation...");
    
    // Try to call the template creation function directly
    try {
      const templateAddress = await baseFactoryContract.raffleTemplate();
      console.log("✅ Template Address from Factory:", templateAddress);
      
      if (templateAddress.toLowerCase() !== baseTemplate.toLowerCase()) {
        console.log("❌ Template address mismatch!");
        console.log("  Expected:", baseTemplate);
        console.log("  Actual:", templateAddress);
      }
      
    } catch (error) {
      console.log("❌ Failed to get template address:", error.message);
    }
    
    // The issue might be in the template contract itself
    console.log("\n💡 Diagnosis:");
    console.log("The 0xe1f1d02e error suggests the template contract");
    console.log("has a different implementation or is missing functions.");
    console.log("\n🔧 Solution: Deploy a fresh factory with correct template");
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });