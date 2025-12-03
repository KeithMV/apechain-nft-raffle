const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  const FACTORY_A = "0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0"; // v3-secure (deployment records)
  const FACTORY_B = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900"; // v4-FIXED-WORKING (frontend)
  const LEGACY = "0x05139110Db8FF9cF82A836Af95eff4530011c705";   // v2-legacy
  
  console.log("🔍 FACTORY INVESTIGATION");
  console.log("=".repeat(60));
  
  const factories = [
    { name: "Factory A (v3-secure)", address: FACTORY_A },
    { name: "Factory B (v4-frontend)", address: FACTORY_B },
    { name: "Legacy Factory", address: LEGACY }
  ];
  
  for (const factory of factories) {
    console.log(`\n📋 ANALYZING ${factory.name}`);
    console.log(`Address: ${factory.address}`);
    console.log("-".repeat(40));
    
    try {
      const contract = new ethers.Contract(
        factory.address,
        [
          "function owner() view returns (address)",
          "function platformFee() view returns (uint256)",
          "function raffleCounter() view returns (uint256)",
          "function raffleTemplate() view returns (address)"
        ],
        provider
      );
      
      const owner = await contract.owner();
      const platformFee = await contract.platformFee();
      const raffleCounter = await contract.raffleCounter();
      const template = await contract.raffleTemplate();
      const balance = await provider.getBalance(owner);
      
      console.log(`Owner: ${owner}`);
      console.log(`Platform Fee: ${platformFee.toString() / 100}%`);
      console.log(`Raffles Created: ${raffleCounter.toString()}`);
      console.log(`Template: ${template}`);
      console.log(`Owner Balance: ${ethers.utils.formatEther(balance)} APE`);
      
      // Calculate expected revenue per raffle (rough estimate)
      if (raffleCounter.gt(0)) {
        const avgRevenuePerRaffle = balance.div(raffleCounter);
        console.log(`Avg Revenue/Raffle: ${ethers.utils.formatEther(avgRevenuePerRaffle)} APE`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("🎯 ANALYSIS SUMMARY");
  console.log("=".repeat(60));
  
  console.log("\n📊 REVENUE COMPARISON:");
  console.log("• Factory A (v3): 11 raffles → 21.46 APE (1.95 APE/raffle)");
  console.log("• Factory B (v4): 21 raffles → 0.223 APE (0.01 APE/raffle)");
  console.log("• Legacy: Unknown raffles → Unknown revenue");
  
  console.log("\n🚨 KEY FINDINGS:");
  console.log("• Frontend uses Factory B (0x0D0c...)");
  console.log("• Factory B has MUCH lower revenue per raffle");
  console.log("• Possible fee collection issue in Factory B");
  console.log("• You may be missing significant revenue!");
  
  console.log("\n💡 NEXT STEPS:");
  console.log("1. Check recent raffles from Factory B for fee collection");
  console.log("2. Verify if Factory B has different fee logic");
  console.log("3. Consider switching back to Factory A if B is broken");
  console.log("4. Audit missing revenue from Factory B");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });