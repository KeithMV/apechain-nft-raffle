const { ethers } = require("hardhat");

async function main() {
  const targetNftContract = "0xDe970C730cD7056B654b12366ADEE48d21ea2c23";
  const targetTokenId = "2406";
  const apeScanOwner = "0x59c45F1e6bCa9c9C8E23FA2D4133da05bA6a50E1";
  const raffleCreator = "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e";
  
  console.log(`🔍 DEEP INVESTIGATION - NFT OWNERSHIP TRAIL`);
  console.log(`NFT: ${targetNftContract} #${targetTokenId}\n`);
  
  try {
    const nftContract = await ethers.getContractAt("IERC721", targetNftContract);
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    
    // Search much further back - last 100k blocks
    const fromBlock = Math.max(0, currentBlock - 100000);
    console.log(`Scanning blocks ${fromBlock} to ${currentBlock} (${currentBlock - fromBlock} blocks)...\n`);
    
    // Get ALL transfer events for this token
    console.log("📋 COMPLETE TRANSFER HISTORY:");
    const transferFilter = nftContract.filters.Transfer(null, null, targetTokenId);
    const transferEvents = await nftContract.queryFilter(transferFilter, fromBlock);
    
    console.log(`Found ${transferEvents.length} transfer events:\n`);
    
    for (let i = 0; i < transferEvents.length; i++) {
      const event = transferEvents[i];
      const block = await provider.getBlock(event.blockNumber);
      const timestamp = new Date(block.timestamp * 1000).toISOString();
      
      console.log(`${i + 1}. Block ${event.blockNumber} (${timestamp})`);
      console.log(`   From: ${event.args.from}`);
      console.log(`   To:   ${event.args.to}`);
      console.log(`   Tx:   ${event.transactionHash}\n`);
    }
    
    // Check all factory contracts (current and legacy)
    console.log("🏭 CHECKING ALL FACTORY CONTRACTS:");
    const factories = [
      { name: "Current Secure V2", address: "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900" },
      { name: "Legacy V2", address: "0x05139110Db8FF9cF82A836Af95eff4530011c705" },
    ];
    
    for (const factory of factories) {
      try {
        console.log(`\n📍 ${factory.name}: ${factory.address}`);
        const factoryContract = await ethers.getContractAt("RaffleFactorySecureV2", factory.address);
        const raffleCounter = await factoryContract.raffleCounter();
        console.log(`   Total raffles: ${raffleCounter}`);
        
        // Check if this NFT appears in any raffle
        for (let i = 0; i < raffleCounter; i++) {
          try {
            const raffleAddress = await factoryContract.getRaffleContract(i);
            const raffle = await ethers.getContractAt("RaffleContractSecureV2", raffleAddress);
            const raffleInfo = await raffle.getRaffleInfo();
            
            if (raffleInfo.nftContract.toLowerCase() === targetNftContract.toLowerCase() && 
                raffleInfo.tokenId.toString() === targetTokenId) {
              console.log(`   ✅ Found in Raffle ${i}: ${raffleAddress}`);
              console.log(`      Creator: ${raffleInfo.creator}`);
              console.log(`      Completed: ${raffleInfo.completed}`);
              console.log(`      Winner: ${raffleInfo.winner}`);
              console.log(`      Tickets: ${raffleInfo.ticketsSold}/${raffleInfo.maxTickets}`);
            }
          } catch (error) {
            // Skip errors for individual raffles
          }
        }
      } catch (error) {
        console.log(`   ❌ Error checking factory: ${error.message}`);
      }
    }
    
    // Check if current owner matches any known addresses
    console.log(`\n🔍 ANALYZING CURRENT OWNER: ${apeScanOwner}`);
    console.log(`Is raffle creator: ${apeScanOwner.toLowerCase() === raffleCreator.toLowerCase()}`);
    
    // Check if it's a contract
    const code = await provider.getCode(apeScanOwner);
    console.log(`Is contract: ${code !== '0x'}`);
    if (code !== '0x') {
      console.log(`Contract code length: ${code.length} bytes`);
    }
    
    // Final analysis
    console.log(`\n📊 FINAL ANALYSIS:`);
    console.log(`==================`);
    
    if (transferEvents.length === 0) {
      console.log(`❌ NO TRANSFER EVENTS FOUND in last ${currentBlock - fromBlock} blocks`);
      console.log(`   This suggests the NFT transfer happened earlier`);
      console.log(`   OR there might be an issue with event indexing`);
    } else {
      const lastTransfer = transferEvents[transferEvents.length - 1];
      console.log(`✅ Last transfer was to: ${lastTransfer.args.to}`);
      console.log(`   Matches current owner: ${lastTransfer.args.to.toLowerCase() === apeScanOwner.toLowerCase()}`);
    }
    
    console.log(`\n🎯 CONCLUSION:`);
    if (apeScanOwner.toLowerCase() === raffleCreator.toLowerCase()) {
      console.log(`✅ NFT is with the original raffle creator - this is EXPECTED for a cancelled raffle`);
    } else {
      console.log(`⚠️  NFT is NOT with the original raffle creator`);
      console.log(`   Expected: ${raffleCreator}`);
      console.log(`   Actual:   ${apeScanOwner}`);
      console.log(`   This needs further investigation`);
    }
    
  } catch (error) {
    console.error("Deep investigation failed:", error);
  }
}

main().catch(console.error);