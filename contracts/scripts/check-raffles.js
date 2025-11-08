const { ethers } = require("hardhat");

async function main() {
  const factoryAddress = "0x05139110Db8FF9cF82A836Af95eff4530011c705";
  
  const factory = await ethers.getContractAt("RaffleFactory", factoryAddress);
  
  console.log("🔍 Checking all raffles...\n");
  
  const raffleCounter = await factory.raffleCounter();
  console.log(`Total raffles created: ${raffleCounter}\n`);
  
  for (let i = 0; i < raffleCounter; i++) {
    try {
      const raffleContract = await factory.getRaffleContract(i);
      console.log(`Raffle ${i}: ${raffleContract}`);
      
      const raffle = await ethers.getContractAt("RaffleContract", raffleContract);
      const raffleInfo = await raffle.getRaffleInfo();
      const isActive = await raffle.isActive();
      
      console.log(`  - NFT: ${raffleInfo.nftContract} #${raffleInfo.tokenId}`);
      console.log(`  - Creator: ${raffleInfo.creator}`);
      console.log(`  - Tickets: ${raffleInfo.ticketsSold}/${raffleInfo.maxTickets}`);
      console.log(`  - Price: ${Number(raffleInfo.ticketPrice) / 1e18} APE`);
      console.log(`  - End Time: ${new Date(Number(raffleInfo.endTime) * 1000).toISOString()}`);
      console.log(`  - Completed: ${raffleInfo.completed}`);
      console.log(`  - Active: ${isActive}`);
      console.log(`  - Winner: ${raffleInfo.winner}`);
      console.log("");
    } catch (error) {
      console.log(`Error checking raffle ${i}:`, error.message);
    }
  }
}

main().catch(console.error);