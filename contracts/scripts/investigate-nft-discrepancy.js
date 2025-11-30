const { ethers } = require("hardhat");

async function main() {
  const factoryAddress = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900";
  const targetNftContract = "0xDe970C730cD7056B654b12366ADEE48d21ea2c23";
  const targetTokenId = "2406";
  const apeScanOwner = "0x59c45F1e6bCa9c9C8E23FA2D4133da05bA6a50E1";
  const raffleContract = "0x8d5332A3484c2FA474801e1a4615b73b28940b4f";
  
  console.log(`🔍 INVESTIGATING NFT OWNERSHIP DISCREPANCY`);
  console.log(`NFT: ${targetNftContract} #${targetTokenId}`);
  console.log(`ApeScan Owner: ${apeScanOwner}`);
  console.log(`Raffle Contract: ${raffleContract}\n`);
  
  try {
    // 1. Check current NFT owner directly from contract
    console.log("1️⃣ CHECKING CURRENT NFT OWNER...");
    const nftContract = await ethers.getContractAt("IERC721", targetNftContract);
    const currentOwner = await nftContract.ownerOf(targetTokenId);
    console.log(`Current Owner: ${currentOwner}`);
    console.log(`Matches ApeScan: ${currentOwner.toLowerCase() === apeScanOwner.toLowerCase()}\n`);
    
    // 2. Check raffle contract state
    console.log("2️⃣ CHECKING RAFFLE CONTRACT STATE...");
    const raffle = await ethers.getContractAt("RaffleContractSecureV2", raffleContract);
    const raffleInfo = await raffle.getRaffleInfo();
    const isActive = await raffle.isActive();
    const totalTickets = await raffle.getTotalTickets();
    
    console.log(`Raffle Creator: ${raffleInfo.creator}`);
    console.log(`Raffle Completed: ${raffleInfo.completed}`);
    console.log(`Raffle Active: ${isActive}`);
    console.log(`Tickets Sold: ${raffleInfo.ticketsSold}`);
    console.log(`Total Tickets: ${totalTickets}`);
    console.log(`Winner: ${raffleInfo.winner}\n`);
    
    // 3. Check if NFT is still in raffle contract
    console.log("3️⃣ CHECKING IF NFT IS IN RAFFLE CONTRACT...");
    try {
      const raffleOwnsNft = await nftContract.ownerOf(targetTokenId);
      console.log(`NFT is owned by: ${raffleOwnsNft}`);
      console.log(`Is in raffle contract: ${raffleOwnsNft.toLowerCase() === raffleContract.toLowerCase()}\n`);
    } catch (error) {
      console.log(`Error checking NFT ownership: ${error.message}\n`);
    }
    
    // 4. Check factory records
    console.log("4️⃣ CHECKING FACTORY RECORDS...");
    const factory = await ethers.getContractAt("RaffleFactorySecureV2", factoryAddress);
    const isValidRaffle = await factory.isValidRaffle(raffleContract);
    console.log(`Is valid raffle: ${isValidRaffle}\n`);
    
    // 5. Check transaction history (recent blocks)
    console.log("5️⃣ CHECKING RECENT TRANSACTION HISTORY...");
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks
    
    console.log(`Scanning blocks ${fromBlock} to ${currentBlock}...`);
    
    // Check for Transfer events
    const transferFilter = nftContract.filters.Transfer(null, null, targetTokenId);
    const transferEvents = await nftContract.queryFilter(transferFilter, fromBlock);
    
    console.log(`Found ${transferEvents.length} transfer events:`);
    for (const event of transferEvents) {
      console.log(`  Block ${event.blockNumber}: ${event.args.from} → ${event.args.to}`);
    }
    
    // Check for raffle events
    console.log("\n6️⃣ CHECKING RAFFLE EVENTS...");
    try {
      const raffleCompletedFilter = raffle.filters.RaffleCompleted();
      const completedEvents = await raffle.queryFilter(raffleCompletedFilter, fromBlock);
      console.log(`Raffle completed events: ${completedEvents.length}`);
      
      const raffleCancelledFilter = raffle.filters.RaffleCancelled();
      const cancelledEvents = await raffle.queryFilter(raffleCancelledFilter, fromBlock);
      console.log(`Raffle cancelled events: ${cancelledEvents.length}`);
      
      for (const event of cancelledEvents) {
        console.log(`  Cancelled at block ${event.blockNumber}, tokenId: ${event.args.tokenId}`);
      }
    } catch (error) {
      console.log(`Error checking raffle events: ${error.message}`);
    }
    
    // 7. Summary and analysis
    console.log("\n🔍 ANALYSIS SUMMARY:");
    console.log("==================");
    
    if (currentOwner.toLowerCase() === apeScanOwner.toLowerCase()) {
      console.log("✅ ApeScan data is CORRECT");
      
      if (raffleInfo.completed && raffleInfo.ticketsSold === 0n) {
        console.log("✅ Raffle was properly cancelled (0 tickets sold)");
        console.log("✅ NFT should have been returned to creator");
        
        if (currentOwner.toLowerCase() === raffleInfo.creator.toLowerCase()) {
          console.log("✅ NFT correctly returned to original creator");
        } else {
          console.log("⚠️  NFT is NOT with original creator");
          console.log(`   Creator: ${raffleInfo.creator}`);
          console.log(`   Current: ${currentOwner}`);
        }
      } else {
        console.log("❓ Need to investigate why NFT moved");
      }
    } else {
      console.log("❌ DISCREPANCY DETECTED!");
      console.log(`   Contract says: ${currentOwner}`);
      console.log(`   ApeScan says: ${apeScanOwner}`);
    }
    
  } catch (error) {
    console.error("Investigation failed:", error);
  }
}

main().catch(console.error);