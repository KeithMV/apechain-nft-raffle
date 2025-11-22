const { ethers } = require("hardhat");

async function main() {
  const raffleContractAddress = "0x8e1776fd2acF8438a9405502ee3BBF06A4f6961A";
  
  console.log('🚫 Cancelling Raffle Contract:', raffleContractAddress);
  console.log('NFT: 0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97 #52870');
  console.log('');
  
  try {
    const raffle = await ethers.getContractAt("RaffleContract", raffleContractAddress);
    
    // Check current status
    const raffleInfo = await raffle.getRaffleInfo();
    console.log('Current Status:');
    console.log('- Tickets Sold:', raffleInfo.ticketsSold.toString());
    console.log('- Completed:', raffleInfo.completed);
    console.log('- Winner:', raffleInfo.winner);
    console.log('');
    
    if (raffleInfo.ticketsSold > 0) {
      console.log('❌ Cannot cancel - raffle has tickets sold');
      return;
    }
    
    if (raffleInfo.completed) {
      console.log('❌ Raffle is already completed');
      console.log('💡 You may need to call emergencyWithdraw or similar function');
      return;
    }
    
    // Attempt to cancel
    console.log('🚫 Attempting to cancel raffle...');
    const tx = await raffle.cancelRaffle();
    console.log('Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    
    console.log('✅ Raffle cancelled successfully!');
    console.log('Your NFT should now be returned to your wallet.');
    
  } catch (error) {
    console.error('❌ Error cancelling raffle:', error.message);
    
    if (error.message.includes('Only creator can cancel')) {
      console.log('💡 Make sure you are using the correct wallet that created the raffle');
    } else if (error.message.includes('Cannot cancel after tickets sold')) {
      console.log('💡 This raffle has tickets sold and cannot be cancelled');
    } else if (error.message.includes('Raffle already completed')) {
      console.log('💡 This raffle is already completed');
    }
  }
}

main().catch(console.error);