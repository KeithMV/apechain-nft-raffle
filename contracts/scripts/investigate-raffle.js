const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  const txHash = "0x5c3d0ebc373c8c7e1312b0cec87258f8604ab5cc7032fbc35a1007beaf019780";
  const possibleRaffleContract = "0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97";
  
  console.log("🔍 RAFFLE INVESTIGATION");
  console.log("=".repeat(50));
  
  try {
    // 1. Analyze the transaction
    console.log("\n📋 TRANSACTION ANALYSIS");
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!tx || !receipt) {
      console.log("❌ Transaction not found");
      return;
    }
    
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to}`);
    console.log(`Value: ${ethers.utils.formatEther(tx.value)} APE`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    console.log(`Block: ${receipt.blockNumber}`);
    
    // 2. Check if address is NFT contract or raffle contract
    console.log("\n🎯 CONTRACT TYPE ANALYSIS");
    const code = await provider.getCode(possibleRaffleContract);
    
    if (code === "0x") {
      console.log("❌ No contract found at this address");
      return;
    }
    
    // Try to call getRaffleInfo (raffle contract method)
    try {
      const raffleContract = new ethers.Contract(
        possibleRaffleContract,
        [
          "function getRaffleInfo() view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))"
        ],
        provider
      );
      
      const raffleInfo = await raffleContract.getRaffleInfo();
      
      console.log("✅ This is a RAFFLE CONTRACT");
      console.log("\n🎲 RAFFLE DETAILS");
      console.log(`NFT Contract: ${raffleInfo.nftContract}`);
      console.log(`Token ID: ${raffleInfo.tokenId.toString()}`);
      console.log(`Creator: ${raffleInfo.creator}`);
      console.log(`Ticket Price: ${ethers.utils.formatEther(raffleInfo.ticketPrice)} APE`);
      console.log(`Max Tickets: ${raffleInfo.maxTickets.toString()}`);
      console.log(`Tickets Sold: ${raffleInfo.ticketsSold.toString()}`);
      console.log(`End Time: ${new Date(Number(raffleInfo.endTime) * 1000).toLocaleString()}`);
      console.log(`Winner: ${raffleInfo.winner}`);
      console.log(`Completed: ${raffleInfo.completed}`);
      console.log(`Platform Fee: ${raffleInfo.platformFee.toString() / 100}%`);
      
      // Calculate revenue
      const totalRevenue = raffleInfo.ticketPrice.mul(raffleInfo.ticketsSold);
      const platformFeeAmount = totalRevenue.mul(raffleInfo.platformFee).div(10000);
      const creatorRevenue = totalRevenue.sub(platformFeeAmount);
      
      console.log("\n💰 REVENUE BREAKDOWN");
      console.log(`Total Revenue: ${ethers.utils.formatEther(totalRevenue)} APE`);
      console.log(`Platform Fee: ${ethers.utils.formatEther(platformFeeAmount)} APE`);
      console.log(`Creator Revenue: ${ethers.utils.formatEther(creatorRevenue)} APE`);
      
      // Get participant details
      console.log("\n👥 PARTICIPANT ANALYSIS");
      
      // Check specific addresses for ticket purchases
      const participantContract = new ethers.Contract(
        possibleRaffleContract,
        [
          "function ticketsPurchased(address user) view returns (uint256)"
        ],
        provider
      );
      
      // Check transaction logs for TicketsPurchased events
      const logs = receipt.logs;
      console.log(`Transaction generated ${logs.length} logs`);
      
      // Try to decode TicketsPurchased events
      const ticketsPurchasedTopic = ethers.utils.id("TicketsPurchased(address,uint256,uint256)");
      const ticketEvents = logs.filter(log => log.topics[0] === ticketsPurchasedTopic);
      
      if (ticketEvents.length > 0) {
        console.log(`Found ${ticketEvents.length} ticket purchase events in this transaction`);
        
        for (const event of ticketEvents) {
          const buyer = ethers.utils.getAddress("0x" + event.topics[1].slice(26));
          const quantity = ethers.BigNumber.from(event.data.slice(0, 66));
          const totalSpent = ethers.BigNumber.from("0x" + event.data.slice(66));
          
          console.log(`  Buyer: ${buyer}`);
          console.log(`  Tickets: ${quantity.toString()}`);
          console.log(`  Amount: ${ethers.utils.formatEther(totalSpent)} APE`);
        }
      }
      
    } catch (error) {
      // Not a raffle contract, check if it's an NFT
      console.log("❌ Not a raffle contract, checking if it's an NFT contract...");
      
      try {
        const nftContract = new ethers.Contract(
          possibleRaffleContract,
          [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function ownerOf(uint256 tokenId) view returns (address)"
          ],
          provider
        );
        
        const name = await nftContract.name();
        const symbol = await nftContract.symbol();
        
        console.log("✅ This is an NFT CONTRACT");
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        
        // Look for raffle creation in transaction logs
        console.log("\n🔍 SEARCHING FOR RAFFLE CREATION IN TRANSACTION");
        const raffleCreatedTopic = ethers.utils.id("RaffleCreated(uint256,address,address,uint256,address,uint256,uint256)");
        const raffleEvents = logs.filter(log => log.topics[0] === raffleCreatedTopic);
        
        if (raffleEvents.length > 0) {
          console.log("✅ Found raffle creation event!");
          const event = raffleEvents[0];
          const raffleId = ethers.BigNumber.from(event.topics[1]);
          const creator = ethers.utils.getAddress("0x" + event.topics[2].slice(26));
          const nftContract = ethers.utils.getAddress("0x" + event.topics[3].slice(26));
          
          // Decode data
          const abiCoder = ethers.utils.defaultAbiCoder;
          const decoded = abiCoder.decode(
            ["uint256", "address", "uint256", "uint256"],
            event.data
          );
          
          console.log(`Raffle ID: ${raffleId.toString()}`);
          console.log(`Creator: ${creator}`);
          console.log(`NFT Contract: ${nftContract}`);
          console.log(`Token ID: ${decoded[0].toString()}`);
          console.log(`Raffle Contract: ${decoded[1]}`);
          console.log(`Ticket Price: ${ethers.utils.formatEther(decoded[2])} APE`);
          console.log(`Max Tickets: ${decoded[3].toString()}`);
          
          // Now investigate the actual raffle contract
          const actualRaffleContract = decoded[1];
          console.log(`\n🎯 INVESTIGATING ACTUAL RAFFLE CONTRACT: ${actualRaffleContract}`);
          
          const raffleContract = new ethers.Contract(
            actualRaffleContract,
            [
              "function getRaffleInfo() view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))"
            ],
            provider
          );
          
          const raffleInfo = await raffleContract.getRaffleInfo();
          
          console.log("\n🎲 CURRENT RAFFLE STATUS");
          console.log(`Tickets Sold: ${raffleInfo.ticketsSold.toString()}/${raffleInfo.maxTickets.toString()}`);
          console.log(`End Time: ${new Date(Number(raffleInfo.endTime) * 1000).toLocaleString()}`);
          console.log(`Winner: ${raffleInfo.winner}`);
          console.log(`Completed: ${raffleInfo.completed}`);
          
          const now = Math.floor(Date.now() / 1000);
          const isActive = now < Number(raffleInfo.endTime);
          console.log(`Status: ${isActive ? 'ACTIVE' : 'EXPIRED'}`);
        }
        
      } catch (nftError) {
        console.log("❌ Not an NFT contract either");
        console.log("This might be a different type of contract");
      }
    }
    
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