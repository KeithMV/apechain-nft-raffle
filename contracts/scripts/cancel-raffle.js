const { ethers } = require("hardhat");

async function main() {
  const raffleAddress = "0x2af7b265E319C8c7419a47221Bb720d011A94c84";
  
  console.log(`🔧 Canceling raffle: ${raffleAddress}`);
  
  const raffle = await ethers.getContractAt("RaffleContract", raffleAddress);
  
  // Check current status
  const raffleInfo = await raffle.getRaffleInfo();
  console.log(`NFT: ${raffleInfo.nftContract} #${raffleInfo.tokenId}`);
  console.log(`Creator: ${raffleInfo.creator}`);
  console.log(`Tickets sold: ${raffleInfo.ticketsSold}`);
  console.log(`Completed: ${raffleInfo.completed}`);
  
  if (raffleInfo.completed) {
    console.log("❌ Raffle already completed");
    return;
  }
  
  if (raffleInfo.ticketsSold > 0) {
    console.log("⚠️  Tickets were sold, cannot cancel");
    return;
  }
  
  // Cancel the raffle
  console.log("🚀 Canceling raffle...");
  const tx = await raffle.cancelRaffle();
  console.log(`Transaction hash: ${tx.hash}`);
  
  await tx.wait();
  console.log("✅ Raffle canceled successfully!");
  console.log("NFT returned to creator");
}

main().catch(console.error);