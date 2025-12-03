const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  console.log("🔍 PLATFORM FEE FLOW INVESTIGATION");
  console.log("=".repeat(60));
  
  const FACTORY_ADDRESS = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900";
  const OLD_OWNER = "0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee";
  const NEW_OWNER = "0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4";
  
  try {
    // 1. Verify current factory owner
    console.log("\n📋 FACTORY OWNERSHIP CHECK");
    console.log("-".repeat(40));
    
    const factory = new ethers.Contract(
      FACTORY_ADDRESS,
      [
        "function owner() view returns (address)",
        "function platformFee() view returns (uint256)",
        "function raffleCounter() view returns (uint256)"
      ],
      provider
    );
    
    const currentOwner = await factory.owner();
    const platformFee = await factory.platformFee();
    const raffleCounter = await factory.raffleCounter();
    
    console.log(`Current Factory Owner: ${currentOwner}`);
    console.log(`Expected New Owner: ${NEW_OWNER}`);
    console.log(`Platform Fee: ${platformFee.toString() / 100}%`);
    console.log(`Total Raffles: ${raffleCounter.toString()}`);
    
    if (currentOwner.toLowerCase() === NEW_OWNER.toLowerCase()) {
      console.log("✅ Factory ownership transfer successful");
    } else {
      console.log("❌ Factory ownership transfer failed or reverted");
      return;
    }
    
    // 2. Check recent raffle creations
    console.log("\n🎲 RECENT RAFFLE ANALYSIS");
    console.log("-".repeat(40));
    
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 5000); // Last 5000 blocks
    
    const raffleCreatedFilter = {
      address: FACTORY_ADDRESS,
      topics: [ethers.utils.id("RaffleCreated(uint256,address,address,uint256,address,uint256,uint256)")]
    };
    
    const raffleCreatedEvents = await provider.getLogs({
      ...raffleCreatedFilter,
      fromBlock,
      toBlock: currentBlock
    });
    
    console.log(`Found ${raffleCreatedEvents.length} recent raffles (last 5000 blocks)`);
    
    if (raffleCreatedEvents.length === 0) {
      console.log("No recent raffles found. Checking older raffles...");
      
      // Check last 10 raffles regardless of time
      const allEvents = await provider.getLogs({
        ...raffleCreatedFilter,
        fromBlock: 0,
        toBlock: currentBlock
      });
      
      const recentEvents = allEvents.slice(-10); // Last 10 raffles
      console.log(`Analyzing last ${recentEvents.length} raffles created`);
      raffleCreatedEvents.push(...recentEvents);
    }
    
    // 3. Analyze each recent raffle
    for (let i = 0; i < Math.min(5, raffleCreatedEvents.length); i++) {
      const event = raffleCreatedEvents[raffleCreatedEvents.length - 1 - i]; // Start from most recent
      
      // Decode the event data
      const iface = new ethers.utils.Interface([
        "event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)"
      ]);
      const decoded = iface.parseLog(event);
      
      const raffleContract = decoded.args.raffleContract;
      const raffleId = decoded.args.raffleId;
      const blockNumber = event.blockNumber;
      
      console.log(`\n🎯 RAFFLE #${raffleId.toString()} (Block ${blockNumber})`);
      console.log(`Contract: ${raffleContract}`);
      
      // Check raffle contract owner configuration
      const raffle = new ethers.Contract(
        raffleContract,
        [
          "function getRaffleInfo() view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))",
          "function factory() view returns (address)",
          "event TicketsPurchased(address indexed buyer, uint256 quantity, uint256 totalAmount)"
        ],
        provider
      );
      
      try {
        const raffleInfo = await raffle.getRaffleInfo();
        const raffleFactory = await raffle.factory();
        
        console.log(`  Factory: ${raffleFactory}`);
        console.log(`  Creator: ${raffleInfo.creator}`);
        console.log(`  Tickets Sold: ${raffleInfo.ticketsSold.toString()}`);
        console.log(`  Platform Fee Rate: ${raffleInfo.platformFee.toString() / 100}%`);
        
        // Check for ticket purchases
        const ticketEvents = await raffle.queryFilter(
          raffle.filters.TicketsPurchased(),
          blockNumber,
          currentBlock
        );
        
        console.log(`  Ticket Purchases: ${ticketEvents.length}`);
        
        if (ticketEvents.length > 0) {
          console.log(`  🎫 ANALYZING TICKET PURCHASES:`);
          
          for (const ticketEvent of ticketEvents.slice(-3)) { // Last 3 purchases
            const txHash = ticketEvent.transactionHash;
            const receipt = await provider.getTransactionReceipt(txHash);
            
            console.log(`\n    Transaction: ${txHash}`);
            console.log(`    Buyer: ${ticketEvent.args.buyer}`);
            console.log(`    Amount: ${ethers.utils.formatEther(ticketEvent.args.totalAmount)} APE`);
            
            // Calculate expected platform fee
            const expectedFee = ticketEvent.args.totalAmount.mul(raffleInfo.platformFee).div(10000);
            console.log(`    Expected Platform Fee: ${ethers.utils.formatEther(expectedFee)} APE`);
            
            // Check where the fee actually went by looking at internal transactions
            // This requires checking the transaction receipt for internal transfers
            console.log(`    Block: ${receipt.blockNumber}`);
            
            // Check balance changes for both old and new owner in this block
            const oldOwnerBefore = await provider.getBalance(OLD_OWNER, receipt.blockNumber - 1);
            const oldOwnerAfter = await provider.getBalance(OLD_OWNER, receipt.blockNumber);
            const oldOwnerChange = oldOwnerAfter.sub(oldOwnerBefore);
            
            const newOwnerBefore = await provider.getBalance(NEW_OWNER, receipt.blockNumber - 1);
            const newOwnerAfter = await provider.getBalance(NEW_OWNER, receipt.blockNumber);
            const newOwnerChange = newOwnerAfter.sub(newOwnerBefore);
            
            console.log(`    Old Owner Balance Change: ${ethers.utils.formatEther(oldOwnerChange)} APE`);
            console.log(`    New Owner Balance Change: ${ethers.utils.formatEther(newOwnerChange)} APE`);
            
            // Determine where the fee went
            if (newOwnerChange.gt(0) && newOwnerChange.gte(expectedFee.mul(90).div(100))) {
              console.log(`    ✅ Fee went to NEW owner (correct)`);
            } else if (oldOwnerChange.gt(0) && oldOwnerChange.gte(expectedFee.mul(90).div(100))) {
              console.log(`    ❌ Fee went to OLD owner (problem!)`);
            } else {
              console.log(`    ❓ Fee destination unclear`);
            }
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error analyzing raffle: ${error.message}`);
      }
    }
    
    // 4. Check current balances
    console.log("\n💰 CURRENT WALLET BALANCES");
    console.log("-".repeat(40));
    
    const oldOwnerBalance = await provider.getBalance(OLD_OWNER);
    const newOwnerBalance = await provider.getBalance(NEW_OWNER);
    
    console.log(`Old Owner (${OLD_OWNER}): ${ethers.utils.formatEther(oldOwnerBalance)} APE`);
    console.log(`New Owner (${NEW_OWNER}): ${ethers.utils.formatEther(newOwnerBalance)} APE`);
    
    // 5. Summary and recommendations
    console.log("\n📊 INVESTIGATION SUMMARY");
    console.log("=".repeat(40));
    console.log(`Factory Owner: ${currentOwner === NEW_OWNER.toLowerCase() ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`Recent Raffles Analyzed: ${Math.min(5, raffleCreatedEvents.length)}`);
    
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Check if recent ticket purchases are going to new owner");
    console.log("2. Verify old raffles vs new raffles fee destination");
    console.log("3. Test with a new raffle creation and ticket purchase");
    
  } catch (error) {
    console.error("❌ Investigation failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });