const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  // Factory contract addresses
  const SECURE_FACTORY_ADDRESS = "0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0";
  const LEGACY_FACTORY_ADDRESS = "0x05139110Db8FF9cF82A836Af95eff4530011c705";
  
  console.log("💰 PLATFORM FEE VERIFICATION");
  console.log("=".repeat(50));
  
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = 0; // Search from genesis block
    
    console.log(`Current block: ${currentBlock}`);
    
    console.log(`\n🔍 Scanning ALL blocks (${fromBlock} to ${currentBlock}) for raffles...`);
    console.log(`This may take a moment...`);
    
    let allRaffleEvents = [];
    let factoryOwner = null;
    let platformFeeRate = null;
    
    // Check both factories
    const factories = [
      { name: "Secure", address: SECURE_FACTORY_ADDRESS },
      { name: "Legacy", address: LEGACY_FACTORY_ADDRESS }
    ];
    
    for (const factory of factories) {
      console.log(`\n📋 Checking ${factory.name} Factory: ${factory.address}`);
      
      const factoryContract = new ethers.Contract(
        factory.address,
        [
          "function owner() view returns (address)",
          "function platformFee() view returns (uint256)",
          "event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)"
        ],
        provider
      );
      
      try {
        const owner = await factoryContract.owner();
        const feeRate = await factoryContract.platformFee();
        
        console.log(`  Owner: ${owner}`);
        console.log(`  Platform Fee Rate: ${feeRate.toString() / 100}%`);
        
        if (!factoryOwner) {
          factoryOwner = owner;
          platformFeeRate = feeRate;
        }
        
        const events = await factoryContract.queryFilter(
          factoryContract.filters.RaffleCreated(),
          fromBlock,
          currentBlock
        );
        
        console.log(`  Found ${events.length} raffles`);
        
        // Add factory info to events
        events.forEach(event => {
          event.factoryName = factory.name;
          event.factoryAddress = factory.address;
        });
        
        allRaffleEvents = allRaffleEvents.concat(events);
        
      } catch (error) {
        console.log(`  ❌ Error accessing ${factory.name} factory: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Total raffles found: ${allRaffleEvents.length}`);
    
    if (allRaffleEvents.length === 0) {
      console.log("❌ No recent raffles found. Create a raffle first to test fees.");
      return;
    }
    
    // Analyze each raffle for fee collection
    for (let i = 0; i < Math.min(5, allRaffleEvents.length); i++) {
      const event = allRaffleEvents[i];
      const raffleContract = event.args.raffleContract;
      const raffleId = event.args.raffleId;
      
      console.log(`\n🎲 ANALYZING RAFFLE #${raffleId.toString()} (${event.factoryName})`);
      console.log(`Contract: ${raffleContract}`);
      
      // Get raffle info
      const raffle = new ethers.Contract(
        raffleContract,
        [
          "function getRaffleInfo() view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))",
          "event TicketsPurchased(address indexed buyer, uint256 quantity, uint256 totalAmount)",
          "event PlatformFeeTransferred(address indexed recipient, uint256 amount)"
        ],
        provider
      );
      
      const raffleInfo = await raffle.getRaffleInfo();
      
      if (raffleInfo.ticketsSold.eq(0)) {
        console.log("  No tickets sold yet");
        continue;
      }
      
      console.log(`  Creator: ${raffleInfo.creator}`);
      console.log(`  Tickets Sold: ${raffleInfo.ticketsSold.toString()}`);
      console.log(`  Ticket Price: ${ethers.utils.formatEther(raffleInfo.ticketPrice)} APE`);
      
      // Calculate expected fees
      const totalRevenue = raffleInfo.ticketPrice.mul(raffleInfo.ticketsSold);
      const expectedPlatformFee = totalRevenue.mul(platformFeeRate).div(10000);
      const expectedCreatorRevenue = totalRevenue.sub(expectedPlatformFee);
      
      console.log(`  Total Revenue: ${ethers.utils.formatEther(totalRevenue)} APE`);
      console.log(`  Expected Platform Fee: ${ethers.utils.formatEther(expectedPlatformFee)} APE`);
      console.log(`  Expected Creator Revenue: ${ethers.utils.formatEther(expectedCreatorRevenue)} APE`);
      
      // Look for ticket purchase transactions
      const ticketEvents = await raffle.queryFilter(
        raffle.filters.TicketsPurchased(),
        fromBlock,
        currentBlock
      );
      
      console.log(`  Found ${ticketEvents.length} ticket purchase transactions`);
      
      // Check each ticket purchase for fee transfers
      for (const ticketEvent of ticketEvents) {
        const txHash = ticketEvent.transactionHash;
        const receipt = await provider.getTransactionReceipt(txHash);
        
        console.log(`\n    📋 Transaction: ${txHash}`);
        console.log(`    Buyer: ${ticketEvent.args.buyer}`);
        console.log(`    Quantity: ${ticketEvent.args.quantity.toString()}`);
        console.log(`    Amount: ${ethers.utils.formatEther(ticketEvent.args.totalAmount)} APE`);
        
        // Calculate expected fee for this transaction
        const txPlatformFee = ticketEvent.args.totalAmount.mul(platformFeeRate).div(10000);
        console.log(`    Expected Platform Fee: ${ethers.utils.formatEther(txPlatformFee)} APE`);
        
        // Check if platform fee was transferred to factory owner
        let platformFeeTransferred = false;
        let actualFeeAmount = ethers.BigNumber.from(0);
        
        // Look for ETH transfers in the transaction
        for (const log of receipt.logs) {
          // Check for platform fee transfer events
          try {
            const decoded = raffle.interface.parseLog(log);
            if (decoded.name === "PlatformFeeTransferred") {
              if (decoded.args.recipient.toLowerCase() === factoryOwner.toLowerCase()) {
                platformFeeTransferred = true;
                actualFeeAmount = decoded.args.amount;
                console.log(`    ✅ Platform fee transferred: ${ethers.utils.formatEther(actualFeeAmount)} APE`);
              }
            }
          } catch (e) {
            // Not a raffle contract event, skip
          }
        }
        
        // Alternative: Check balance changes (more complex but thorough)
        if (!platformFeeTransferred) {
          // Get factory owner balance before and after this block
          const blockNumber = receipt.blockNumber;
          const prevBalance = await provider.getBalance(factoryOwner, blockNumber - 1);
          const newBalance = await provider.getBalance(factoryOwner, blockNumber);
          const balanceChange = newBalance.sub(prevBalance);
          
          if (balanceChange.gt(0)) {
            console.log(`    💰 Factory owner balance increased by: ${ethers.utils.formatEther(balanceChange)} APE`);
            
            // Check if it matches expected platform fee (within reasonable gas tolerance)
            const difference = balanceChange.sub(txPlatformFee).abs();
            const tolerance = ethers.utils.parseEther("0.001"); // 0.001 APE tolerance
            
            if (difference.lt(tolerance)) {
              console.log(`    ✅ Balance change matches expected platform fee!`);
              platformFeeTransferred = true;
            } else {
              console.log(`    ⚠️  Balance change doesn't match expected fee (diff: ${ethers.utils.formatEther(difference)} APE)`);
            }
          }
        }
        
        if (!platformFeeTransferred) {
          console.log(`    ❌ No platform fee transfer detected`);
        }
      }
    }
    
    // Summary
    console.log("\n📊 VERIFICATION SUMMARY");
    console.log("=".repeat(30));
    console.log(`Factory Owner: ${factoryOwner}`);
    console.log(`Platform Fee Rate: ${platformFeeRate.toString() / 100}%`);
    console.log(`Analyzed ${Math.min(5, allRaffleEvents.length)} recent raffles`);
    console.log(`Total raffles found: ${allRaffleEvents.length}`);
    
    // Get current factory owner balance
    if (factoryOwner) {
      const currentBalance = await provider.getBalance(factoryOwner);
      console.log(`Current Factory Owner Balance: ${ethers.utils.formatEther(currentBalance)} APE`);
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