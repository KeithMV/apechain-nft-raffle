const { ethers } = require("hardhat");

/**
 * V3 to V4 Migration Detection Script
 * Helps identify when to migrate and validates both versions
 */

const FACTORY_V3_ADDRESS = "0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff";
const FACTORY_V4_ADDRESS = "0x1627E7e63b63878E61f91D336385a59B1747934a"; // V4 deployed address

async function compareVersions() {
  console.log("🔍 Comparing V3 vs V4 Factory Contracts\n");
  
  const [deployer] = await ethers.getSigners();
  
  // V3 Analysis
  const RaffleFactoryV3 = await ethers.getContractFactory("RaffleFactorySecureV3");
  const factoryV3 = RaffleFactoryV3.attach(FACTORY_V3_ADDRESS);
  
  const v3Fee = await factoryV3.platformFee();
  const v3RateLimit = await factoryV3.RATE_LIMIT();
  const v3RaffleCount = await factoryV3.raffleCounter();
  
  console.log("📊 V3 Status:");
  console.log("Address:", FACTORY_V3_ADDRESS);
  console.log("Platform Fee:", (v3Fee / 100).toString() + "%");
  console.log("Rate Limit:", v3RateLimit.toString(), "seconds");
  console.log("Total Raffles:", v3RaffleCount.toString());
  
  if (FACTORY_V4_ADDRESS !== "REPLACE_WITH_V4_ADDRESS") {
    // V4 Analysis
    const RaffleFactoryV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
    const factoryV4 = RaffleFactoryV4.attach(FACTORY_V4_ADDRESS);
    
    const v4Fee = await factoryV4.platformFee();
    const v4RateLimit = await factoryV4.RATE_LIMIT();
    const v4RaffleCount = await factoryV4.raffleCounter();
    
    console.log("\n📊 V4 Status:");
    console.log("Address:", FACTORY_V4_ADDRESS);
    console.log("Platform Fee:", (v4Fee / 100).toString() + "%");
    console.log("Rate Limit:", v4RateLimit.toString(), "seconds");
    console.log("Total Raffles:", v4RaffleCount.toString());
    
    // Migration Recommendations
    console.log("\n🚀 Migration Analysis:");
    console.log("Rate Limit Improvement:", `${v3RateLimit}s → ${v4RateLimit}s (${((v3RateLimit - v4RateLimit) / v3RateLimit * 100).toFixed(1)}% faster)`);
    console.log("Fee Change:", `${v3Fee/100}% → ${v4Fee/100}%`);
    
    if (v4RaffleCount.toString() === "0") {
      console.log("✅ V4 is ready for migration (no active raffles)");
    } else {
      console.log("⚠️  V4 already has active raffles");
    }
  } else {
    console.log("\n❌ V4 not deployed yet. Deploy V4 first.");
  }
}

async function checkActiveRaffles(version = "v3") {
  const factoryAddress = version === "v4" ? FACTORY_V4_ADDRESS : FACTORY_V3_ADDRESS;
  const contractName = version === "v4" ? "RaffleFactorySecureV4" : "RaffleFactorySecureV3";
  
  console.log(`🔍 Checking active raffles in ${version.toUpperCase()}...\n`);
  
  const RaffleFactory = await ethers.getContractFactory(contractName);
  const factory = RaffleFactory.attach(factoryAddress);
  
  const raffleCount = await factory.raffleCounter();
  console.log(`Total raffles created: ${raffleCount.toString()}`);
  
  if (raffleCount.toString() === "0") {
    console.log("✅ No raffles to migrate");
    return [];
  }
  
  // Check last few raffles for activity
  const activeRaffles = [];
  const checkCount = Math.min(5, parseInt(raffleCount.toString()));
  
  for (let i = parseInt(raffleCount.toString()) - checkCount; i < parseInt(raffleCount.toString()); i++) {
    try {
      const raffleAddress = await factory.getRaffleContract(i);
      console.log(`Raffle ${i}: ${raffleAddress}`);
      activeRaffles.push({ id: i, address: raffleAddress });
    } catch (error) {
      console.log(`Raffle ${i}: Error fetching`);
    }
  }
  
  return activeRaffles;
}

async function migrationReadiness() {
  console.log("🎯 Migration Readiness Check\n");
  
  // Check V3 active raffles
  const v3Raffles = await checkActiveRaffles("v3");
  
  console.log("\n📋 Migration Checklist:");
  console.log("✅ V4 contract created");
  console.log(FACTORY_V4_ADDRESS !== "REPLACE_WITH_V4_ADDRESS" ? "✅ V4 deployed" : "❌ V4 not deployed");
  console.log("✅ V4 fee management script ready");
  console.log(v3Raffles.length === 0 ? "✅ No active V3 raffles to migrate" : `⚠️  ${v3Raffles.length} recent V3 raffles`);
  
  console.log("\n🚀 Next Steps:");
  if (FACTORY_V4_ADDRESS === "REPLACE_WITH_V4_ADDRESS") {
    console.log("1. Deploy V4 contract");
    console.log("2. Update V4 address in scripts");
    console.log("3. Update frontend configuration");
  } else {
    console.log("1. Update frontend to use V4 address");
    console.log("2. Test V4 functionality");
    console.log("3. Announce faster raffle creation to users");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "compare";
  
  switch (command.toLowerCase()) {
    case 'compare':
      await compareVersions();
      break;
      
    case 'v3-raffles':
      await checkActiveRaffles("v3");
      break;
      
    case 'v4-raffles':
      if (FACTORY_V4_ADDRESS === "REPLACE_WITH_V4_ADDRESS") {
        console.log("❌ V4 not deployed yet");
        process.exit(1);
      }
      await checkActiveRaffles("v4");
      break;
      
    case 'readiness':
      await migrationReadiness();
      break;
      
    default:
      console.log("Available commands: compare, v3-raffles, v4-raffles, readiness");
      process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Migration analysis completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration analysis failed:", error);
    process.exit(1);
  });