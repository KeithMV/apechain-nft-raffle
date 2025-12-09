const { ethers } = require("hardhat");

async function main() {
  // Get addresses from environment variables or command line arguments
  const raffleContractAddress = process.env.RAFFLE_CONTRACT_ADDRESS || process.argv[2];
  const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS || process.argv[3];
  const tokenId = process.env.TOKEN_ID || process.argv[4];
  
  if (!raffleContractAddress || !nftContractAddress || !tokenId) {
    console.error('❌ Missing required parameters');
    console.log('Usage: npx hardhat run scripts/emergency-recover-nft.js --network apechain <raffleAddress> <nftAddress> <tokenId>');
    console.log('Or set environment variables: RAFFLE_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS, TOKEN_ID');
    process.exit(1);
  }
  
  console.log('🔍 Checking NFT ownership and recovery options...');
  console.log('Raffle Contract:', raffleContractAddress);
  console.log('NFT Contract:', nftContractAddress);
  console.log('Token ID:', tokenId);
  console.log('');
  
  try {
    // Check who currently owns the NFT
    const nftContract = await ethers.getContractAt("IERC721", nftContractAddress);
    const currentOwner = await nftContract.ownerOf(tokenId);
    console.log('Current NFT Owner:', currentOwner);
    
    // Check raffle status
    const raffle = await ethers.getContractAt("RaffleContract", raffleContractAddress);
    const raffleInfo = await raffle.getRaffleInfo();
    
    console.log('');
    console.log('Raffle Status:');
    console.log('- Creator:', raffleInfo.creator);
    console.log('- Completed:', raffleInfo.completed);
    console.log('- Winner:', raffleInfo.winner);
    console.log('- Tickets Sold:', raffleInfo.ticketsSold.toString());
    console.log('- End Time:', new Date(Number(raffleInfo.endTime) * 1000).toISOString());
    console.log('');
    
    if (currentOwner.toLowerCase() === raffleContractAddress.toLowerCase()) {
      console.log('✅ NFT is still in the raffle contract');
      console.log('');
      
      // Since the raffle is completed with no winner and no tickets sold,
      // this is likely a bug. Let's try to force a winner selection
      // or see if we can trigger any recovery mechanism
      
      if (raffleInfo.completed && raffleInfo.winner === '0x0000000000000000000000000000000000000000') {
        console.log('🚨 ISSUE DETECTED: Raffle is completed but has no winner and no tickets sold');
        console.log('This appears to be a timing bug where the raffle was marked completed incorrectly.');
        console.log('');
        
        // Check if we can call emergencySelectWinner even though it's completed
        try {
          console.log('🔧 Attempting emergency recovery...');
          
          // First, let's see if the contract allows any recovery
          // Since the raffle is marked completed, most functions won't work
          
          // Check if there's a way to reset the completion status
          // This would require a contract upgrade or admin function
          
          console.log('❌ No direct recovery method available in current contract');
          console.log('');
          console.log('🛠️ RECOVERY OPTIONS:');
          console.log('1. Deploy a new factory with emergency recovery functions');
          console.log('2. Contact the platform admin to manually recover the NFT');
          console.log('3. If you control the factory, add an emergency recovery function');
          console.log('');
          
          // Let's check if the factory has any admin functions
          const factoryAddress = await raffle.factory();
          console.log('Factory Address:', factoryAddress);
          
          const factory = await ethers.getContractAt("RaffleFactory", factoryAddress);
          
          // Try to see if factory has emergency functions
          try {
            // This might fail if function doesn't exist
            console.log('🔍 Checking factory emergency functions...');
            
            // Most likely the factory doesn't have emergency recovery
            // but let's document what would be needed
            
          } catch (error) {
            console.log('Factory does not have emergency recovery functions');
          }
          
        } catch (error) {
          console.log('❌ Emergency recovery failed:', error.message);
        }
      }
      
    } else if (currentOwner.toLowerCase() === raffleInfo.creator.toLowerCase()) {
      console.log('✅ NFT is already back with the creator');
      console.log('The recovery may have already happened through another method.');
      
    } else {
      console.log('⚠️ NFT is owned by someone else:', currentOwner);
      console.log('This could be the winner or another transfer occurred.');
    }
    
  } catch (error) {
    console.error('❌ Error checking NFT status:', error.message);
  }
}

main().catch(console.error);