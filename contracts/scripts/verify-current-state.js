const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  console.log("🔍 COMPREHENSIVE PLATFORM STATE VERIFICATION");
  console.log("=".repeat(60));
  
  const FACTORY_ADDRESS = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900";
  const OLD_OWNER = "0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee";
  const NEW_OWNER = "0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4";
  
  try {
    // 1. Factory State Check
    console.log("\n📋 FACTORY CONTRACT STATE");
    console.log("-".repeat(40));
    
    const factory = new ethers.Contract(
      FACTORY_ADDRESS,
      [
        "function owner() view returns (address)",
        "function platformFee() view returns (uint256)",
        "function raffleCounter() view returns (uint256)",
        "function raffleTemplate() view returns (address)"
      ],
      provider
    );
    
    const factoryOwner = await factory.owner();
    const platformFee = await factory.platformFee();
    const raffleCounter = await factory.raffleCounter();
    const template = await factory.raffleTemplate();
    
    console.log(`Factory Owner: ${factoryOwner}`);
    console.log(`Platform Fee: ${platformFee.toString() / 100}%`);
    console.log(`Total Raffles: ${raffleCounter.toString()}`);
    console.log(`Template: ${template}`);
    
    const ownershipCorrect = factoryOwner.toLowerCase() === NEW_OWNER.toLowerCase();
    console.log(`Ownership Status: ${ownershipCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    // 2. Get Recent Raffles (last 10)
    console.log("\n🎲 RECENT RAFFLES ANALYSIS");
    console.log("-".repeat(40));
    
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    // Get raffle creation events
    const raffleCreatedFilter = {
      address: FACTORY_ADDRESS,
      topics: [ethers.utils.id("RaffleCreated(uint256,address,address,uint256,address,uint256,uint256)")]
    };
    
    const allEvents = await provider.getLogs({
      ...raffleCreatedFilter,
      fromBlock: 0,
      toBlock: currentBlock
    });
    
    console.log(`Total Raffles Found: ${allEvents.length}`);
    
    // Analyze last 5 raffles
    const recentEvents = allEvents.slice(-5);
    console.log(`Analyzing last ${recentEvents.length} raffles:`);
    
    const iface = new ethers.utils.Interface([
      "event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)"
    ]);
    
    for (const event of recentEvents) {
      const decoded = iface.parseLog(event);
      const raffleId = decoded.args.raffleId.toString();
      const raffleContract = decoded.args.raffleContract;
      const blockNumber = event.blockNumber;
      
      console.log(`\n  Raffle #${raffleId} (Block ${blockNumber})`);
      console.log(`  Contract: ${raffleContract}`);
      
      // Check raffle contract details
      const raffle = new ethers.Contract(
        raffleContract,
        [
          "function getRaffleInfo() view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))",
          "function factory() view returns (address)"
        ],
        provider
      );
      
      try {
        const raffleInfo = await raffle.getRaffleInfo();
        const raffleFactory = await raffle.factory();
        
        console.log(`  Creator: ${raffleInfo.creator}`);
        console.log(`  Tickets Sold: ${raffleInfo.ticketsSold.toString()}`);
        console.log(`  Factory: ${raffleFactory}`);
        console.log(`  Platform Fee: ${raffleInfo.platformFee.toString() / 100}%`);
        
        // Check if this raffle has had ticket purchases
        if (raffleInfo.ticketsSold.gt(0)) {
          console.log(`  💰 HAS TICKET SALES - Checking fee destination...`);
          
          // Look for ticket purchase events on this raffle
          const ticketFilter = {
            address: raffleContract,
            topics: [ethers.utils.id("TicketsPurchased(address,uint256,uint256)")]
          };
          
          const ticketEvents = await provider.getLogs({
            ...ticketFilter,
            fromBlock: blockNumber,
            toBlock: currentBlock
          });
          
          console.log(`  Ticket Purchase Events: ${ticketEvents.length}`);
          
          if (ticketEvents.length > 0) {
            // Check the most recent ticket purchase
            const lastTicketEvent = ticketEvents[ticketEvents.length - 1];
            const txHash = lastTicketEvent.transactionHash;
            
            console.log(`  Last Purchase TX: ${txHash}`);
            
            // Check balance changes in that transaction
            const receipt = await provider.getTransactionReceipt(txHash);
            const blockNum = receipt.blockNumber;
            
            // Check old owner balance change
            const oldOwnerBefore = await provider.getBalance(OLD_OWNER, blockNum - 1);
            const oldOwnerAfter = await provider.getBalance(OLD_OWNER, blockNum);
            const oldOwnerChange = oldOwnerAfter.sub(oldOwnerBefore);
            
            // Check new owner balance change
            const newOwnerBefore = await provider.getBalance(NEW_OWNER, blockNum - 1);
            const newOwnerAfter = await provider.getBalance(NEW_OWNER, blockNum);
            const newOwnerChange = newOwnerAfter.sub(newOwnerBefore);
            
            console.log(`  Old Owner Change: ${ethers.utils.formatEther(oldOwnerChange)} APE`);
            console.log(`  New Owner Change: ${ethers.utils.formatEther(newOwnerChange)} APE`);
            
            if (newOwnerChange.gt(0)) {
              console.log(`  ✅ Fee went to NEW owner`);
            } else if (oldOwnerChange.gt(0)) {
              console.log(`  ❌ Fee went to OLD owner`);
            } else {
              console.log(`  ❓ Fee destination unclear`);
            }
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    // 3. Check wallet balances
    console.log("\n💰 WALLET BALANCES");
    console.log("-".repeat(40));
    
    const oldOwnerBalance = await provider.getBalance(OLD_OWNER);
    const newOwnerBalance = await provider.getBalance(NEW_OWNER);
    
    console.log(`Old Owner: ${ethers.utils.formatEther(oldOwnerBalance)} APE`);
    console.log(`New Owner: ${ethers.utils.formatEther(newOwnerBalance)} APE`);
    
    // 4. Check if there are any very recent transactions
    console.log("\n🔍 RECENT ACTIVITY CHECK");
    console.log("-".repeat(40));
    
    const recentFromBlock = Math.max(0, currentBlock - 1000);
    const veryRecentEvents = await provider.getLogs({
      ...raffleCreatedFilter,
      fromBlock: recentFromBlock,
      toBlock: currentBlock
    });
    
    console.log(`Raffles created in last 1000 blocks: ${veryRecentEvents.length}`);
    
    if (veryRecentEvents.length > 0) {
      console.log("Recent raffle creation detected - these should use new owner!");
      
      for (const event of veryRecentEvents) {
        const decoded = iface.parseLog(event);
        const raffleId = decoded.args.raffleId.toString();
        const raffleContract = decoded.args.raffleContract;
        
        console.log(`  New Raffle #${raffleId}: ${raffleContract}`);
      }
    }
    
    // 5. Summary and recommendations
    console.log("\n📊 DIAGNOSIS SUMMARY");
    console.log("=".repeat(40));
    
    if (ownershipCorrect) {
      console.log("✅ Factory ownership is correct");
      console.log("✅ New raffles will send fees to new owner");
      
      if (veryRecentEvents.length > 0) {
        console.log("🎯 TEST RECOMMENDATION:");
        console.log("1. Buy tickets on the newest raffle");
        console.log("2. Check if fees go to new owner immediately");
        console.log("3. Old raffles may still send to old owner");
      } else {
        console.log("💡 CREATE A NEW RAFFLE:");
        console.log("1. Create a fresh raffle to test");
        console.log("2. Buy tickets on it");
        console.log("3. Verify fees go to new owner");
      }
    } else {
      console.log("❌ Factory ownership transfer failed");
      console.log("🔧 Need to retry ownership transfer");
    }
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });