const { ethers } = require("hardhat");

/**
 * Investigate Latest V4 Raffle Transaction
 */

const FACTORY_V4_ADDRESS = "0x1627E7e63b63878E61f91D336385a59B1747934a";

async function investigateLatestRaffle() {
  console.log("🔍 Investigating Latest V4 Raffle Transaction\n");
  
  const [deployer] = await ethers.getSigners();
  const RaffleFactoryV4 = await ethers.getContractFactory("RaffleFactorySecureV4");
  const factory = RaffleFactoryV4.attach(FACTORY_V4_ADDRESS);
  
  // Get total raffle count
  const raffleCount = await factory.raffleCounter();
  const latestRaffleId = raffleCount - 1; // Latest raffle ID (0-indexed)
  
  console.log("📊 V4 Factory Status:");
  console.log("Total Raffles:", raffleCount.toString());
  console.log("Latest Raffle ID:", latestRaffleId.toString());
  console.log("Factory Address:", FACTORY_V4_ADDRESS);
  
  if (raffleCount.toString() === "0") {
    console.log("❌ No raffles found in V4 contract");
    return;
  }
  
  // Get latest raffle contract address
  const latestRaffleContract = await factory.getRaffleContract(latestRaffleId);
  console.log("\n🎯 Latest Raffle Contract:", latestRaffleContract);
  
  // Get raffle info
  const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
  const raffle = RaffleContract.attach(latestRaffleContract);
  
  const raffleInfo = await raffle.getRaffleInfo();
  
  console.log("\n📋 Latest Raffle Details:");
  console.log("NFT Contract:", raffleInfo.nftContract);
  console.log("Token ID:", raffleInfo.tokenId.toString());
  console.log("Creator:", raffleInfo.creator);
  console.log("Ticket Price:", ethers.utils.formatEther(raffleInfo.ticketPrice), "APE");
  console.log("Max Tickets:", raffleInfo.maxTickets.toString());
  console.log("Tickets Sold:", raffleInfo.ticketsSold.toString());
  console.log("Platform Fee:", (raffleInfo.platformFee / 100).toString() + "%");
  console.log("Completed:", raffleInfo.completed);
  
  const endTime = new Date(raffleInfo.endTime * 1000);
  console.log("End Time:", endTime.toLocaleString());
  
  if (raffleInfo.winner && raffleInfo.winner !== "0x0000000000000000000000000000000000000000") {
    console.log("Winner:", raffleInfo.winner);
  }
  
  // Check if raffle is active
  const isActive = await raffle.isActive();
  console.log("Is Active:", isActive);
  
  // Get recent events from the factory
  console.log("\n🔍 Recent V4 Factory Events:");
  try {
    const filter = factory.filters.RaffleCreated();
    const events = await factory.queryFilter(filter, -1000); // Last 1000 blocks
    
    console.log(`Found ${events.length} RaffleCreated events:`);
    
    // Show last 3 events
    const recentEvents = events.slice(-3);
    for (const event of recentEvents) {
      console.log(`\n📅 Block ${event.blockNumber}:`);
      console.log("  Raffle ID:", event.args.raffleId.toString());
      console.log("  Creator:", event.args.creator);
      console.log("  NFT Contract:", event.args.nftContract);
      console.log("  Token ID:", event.args.tokenId.toString());
      console.log("  Raffle Contract:", event.args.raffleContract);
      console.log("  Ticket Price:", ethers.utils.formatEther(event.args.ticketPrice), "APE");
      console.log("  Max Tickets:", event.args.maxTickets.toString());
      console.log("  Transaction Hash:", event.transactionHash);
    }
  } catch (error) {
    console.log("Could not fetch events:", error.message);
  }
  
  console.log("\n✅ Investigation complete!");
  console.log("🔗 View on ApeChain Explorer:");
  console.log(`https://apescan.io/address/${FACTORY_V4_ADDRESS}`);
  console.log(`https://apescan.io/address/${latestRaffleContract}`);
}

investigateLatestRaffle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Investigation failed:", error);
    process.exit(1);
  });