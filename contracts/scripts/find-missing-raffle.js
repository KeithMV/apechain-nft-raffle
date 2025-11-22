const { ethers } = require("hardhat");

// Search parameters
const TARGET_WALLET = '0x1dfb09d1969a11af5196629c2e6b220898ab538e';
const TARGET_NFT_CONTRACT = '0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97';
const TARGET_TOKEN_ID = '52870';

async function main() {
  console.log('🔍 Searching for Missing Raffle');
  console.log('Target Wallet:', TARGET_WALLET);
  console.log('Target NFT Contract:', TARGET_NFT_CONTRACT);
  console.log('Target Token ID:', TARGET_TOKEN_ID);
  console.log('');

  // Check both factory contracts
  const factoryAddresses = [
    "0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0", // Current factory
    "0x05139110Db8FF9cF82A836Af95eff4530011c705", // Old factory
    "0x70A5b43c5296e3ADFbB51E40cb8a0d251eC62EfF"  // Secure factory
  ];
  
  let foundRaffle = false;
  
  for (const factoryAddress of factoryAddresses) {
    console.log(`🏭 Checking factory: ${factoryAddress}`);
    
    try {
      const factory = await ethers.getContractAt("RaffleFactory", factoryAddress);
      const raffleCounter = await factory.raffleCounter();
      console.log(`  Total raffles in this factory: ${raffleCounter}`);
      
      // Check all raffles in this factory
      for (let i = 0; i < raffleCounter; i++) {
        try {
          const raffleContract = await factory.getRaffleContract(i);
          const raffle = await ethers.getContractAt("RaffleContract", raffleContract);
          const raffleInfo = await raffle.getRaffleInfo();
          
          // Check if this is our target raffle
          const isTargetRaffle = 
            raffleInfo.creator.toLowerCase() === TARGET_WALLET.toLowerCase() &&
            raffleInfo.nftContract.toLowerCase() === TARGET_NFT_CONTRACT.toLowerCase() &&
            raffleInfo.tokenId.toString() === TARGET_TOKEN_ID;
          
          if (isTargetRaffle) {
            foundRaffle = true;
            console.log('🎯 FOUND TARGET RAFFLE!');
            console.log(`  Raffle ID: ${i}`);
            console.log(`  Contract: ${raffleContract}`);
            console.log(`  Creator: ${raffleInfo.creator}`);
            console.log(`  NFT: ${raffleInfo.nftContract} #${raffleInfo.tokenId}`);
            console.log(`  Tickets: ${raffleInfo.ticketsSold}/${raffleInfo.maxTickets}`);
            console.log(`  Price: ${Number(raffleInfo.ticketPrice) / 1e18} APE`);
            console.log(`  End Time: ${new Date(Number(raffleInfo.endTime) * 1000).toISOString()}`);
            console.log(`  Completed: ${raffleInfo.completed}`);
            console.log(`  Winner: ${raffleInfo.winner}`);
            
            const isActive = await raffle.isActive();
            console.log(`  Active: ${isActive}`);
            console.log('');
          }
          
          // Also show all raffles by this creator for debugging
          if (raffleInfo.creator.toLowerCase() === TARGET_WALLET.toLowerCase()) {
            console.log(`  📋 Raffle ${i} by target wallet: NFT ${raffleInfo.nftContract}#${raffleInfo.tokenId}`);
          }
          
        } catch (error) {
          console.log(`  Error checking raffle ${i}:`, error.message);
        }
      }
      
    } catch (error) {
      console.log(`  Error accessing factory ${factoryAddress}:`, error.message);
    }
    
    console.log('');
  }
  
  if (!foundRaffle) {
    console.log('❌ TARGET RAFFLE NOT FOUND');
    console.log('');
    console.log('Possible reasons:');
    console.log('1. Raffle was never created');
    console.log('2. Wrong wallet address, NFT contract, or token ID');
    console.log('3. Raffle exists in a different factory contract');
    console.log('4. Network/RPC issues');
    console.log('');
    
    // Show all raffles by the target wallet across all factories
    console.log('📋 ALL RAFFLES BY TARGET WALLET:');
    let totalFound = 0;
    
    for (const factoryAddress of factoryAddresses) {
      try {
        const factory = await ethers.getContractAt("RaffleFactory", factoryAddress);
        const raffleCounter = await factory.raffleCounter();
        
        for (let i = 0; i < raffleCounter; i++) {
          try {
            const raffleContract = await factory.getRaffleContract(i);
            const raffle = await ethers.getContractAt("RaffleContract", raffleContract);
            const raffleInfo = await raffle.getRaffleInfo();
            
            if (raffleInfo.creator.toLowerCase() === TARGET_WALLET.toLowerCase()) {
              totalFound++;
              console.log(`${totalFound}. Factory ${factoryAddress} - Raffle ${i}: NFT ${raffleInfo.nftContract}#${raffleInfo.tokenId}`);
            }
          } catch (error) {
            // Skip errors
          }
        }
      } catch (error) {
        // Skip factory errors
      }
    }
    
    if (totalFound === 0) {
      console.log('No raffles found for this wallet address');
    }
  }
}

main().catch(console.error);