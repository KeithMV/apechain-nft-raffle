const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  const RAFFLE_CONTRACT = "0xcB46a26776EBD84940242950a908c6bEd82793DC";
  const FACTORY_ADDRESS = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900";
  
  console.log("🔍 INVESTIGATING RAFFLE CONTRACT");
  console.log("=".repeat(50));
  console.log(`Raffle: ${RAFFLE_CONTRACT}`);
  
  try {
    // Check raffle contract details
    const raffle = new ethers.Contract(
      RAFFLE_CONTRACT,
      [
        "function getRaffleInfo() view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))",
        "function factory() view returns (address)",
        "function factoryOwner() view returns (address)"
      ],
      provider
    );
    
    const raffleInfo = await raffle.getRaffleInfo();
    const factoryAddr = await raffle.factory();
    
    console.log("\n📋 RAFFLE CONTRACT INFO");
    console.log(`Factory: ${factoryAddr}`);
    console.log(`Creator: ${raffleInfo.creator}`);
    console.log(`Ticket Price: ${ethers.utils.formatEther(raffleInfo.ticketPrice)} APE`);
    console.log(`Tickets Sold: ${raffleInfo.ticketsSold.toString()}`);
    console.log(`Platform Fee Rate: ${raffleInfo.platformFee.toString() / 100}%`);
    console.log(`Completed: ${raffleInfo.completed}`);
    
    // Check if raffle has factoryOwner function
    try {
      const factoryOwner = await raffle.factoryOwner();
      console.log(`Factory Owner (cached): ${factoryOwner}`);
    } catch (e) {
      console.log("No factoryOwner function - checking factory directly");
    }
    
    // Check current factory owner
    const factory = new ethers.Contract(
      factoryAddr,
      ["function owner() view returns (address)"],
      provider
    );
    
    const currentFactoryOwner = await factory.owner();
    console.log(`Current Factory Owner: ${currentFactoryOwner}`);
    
    // Check raffle contract balance
    const raffleBalance = await provider.getBalance(RAFFLE_CONTRACT);
    console.log(`Raffle Contract Balance: ${ethers.utils.formatEther(raffleBalance)} APE`);
    
    // Calculate expected fees
    const totalRevenue = raffleInfo.ticketPrice.mul(raffleInfo.ticketsSold);
    const expectedFees = totalRevenue.mul(raffleInfo.platformFee).div(10000);
    
    console.log(`\n💰 FEE CALCULATION`);
    console.log(`Total Revenue: ${ethers.utils.formatEther(totalRevenue)} APE`);
    console.log(`Expected Platform Fees: ${ethers.utils.formatEther(expectedFees)} APE`);
    
    if (raffleBalance.gte(expectedFees)) {
      console.log("🚨 FEES ARE STUCK IN RAFFLE CONTRACT!");
      console.log("The platform fees were not transferred to the factory owner");
    }
    
    // Check when this raffle was created
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    const raffleCreatedFilter = {
      address: FACTORY_ADDRESS,
      topics: [
        ethers.utils.id("RaffleCreated(uint256,address,address,uint256,address,uint256,uint256)"),
        null,
        null,
        null,
        ethers.utils.hexZeroPad(RAFFLE_CONTRACT, 32)
      ]
    };
    
    try {
      const creationEvents = await provider.getLogs({
        ...raffleCreatedFilter,
        fromBlock: 0,
        toBlock: currentBlock
      });
      
      if (creationEvents.length > 0) {
        const creationBlock = creationEvents[0].blockNumber;
        console.log(`\n📅 RAFFLE CREATION`);
        console.log(`Created at block: ${creationBlock}`);
        console.log(`Current block: ${currentBlock}`);
        
        // Check factory owner at time of creation
        const factoryOwnerAtCreation = await factory.owner({ blockTag: creationBlock });
        console.log(`Factory owner at creation: ${factoryOwnerAtCreation}`);
        
        if (factoryOwnerAtCreation.toLowerCase() !== currentFactoryOwner.toLowerCase()) {
          console.log("🚨 PROBLEM IDENTIFIED!");
          console.log("This raffle was created BEFORE ownership transfer");
          console.log("It's still programmed to send fees to the old owner");
        }
      }
    } catch (e) {
      console.log("Could not determine raffle creation time");
    }
    
    console.log("\n🎯 DIAGNOSIS");
    console.log("=".repeat(30));
    
    if (raffleBalance.gte(expectedFees)) {
      console.log("❌ Platform fees are stuck in raffle contract");
      console.log("💡 This indicates a bug in the fee transfer logic");
    } else {
      console.log("❓ Fees may have been transferred elsewhere");
      console.log("🔍 Need to investigate further");
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