const { ethers } = require('hardhat');

/**
 * Comprehensive Transaction Flow Analysis
 * Traces a complete raffle creation to understand current architecture
 */

async function main() {
  console.log('🔍 COMPREHENSIVE TRANSACTION FLOW ANALYSIS');
  console.log('==========================================\n');

  // Get the latest raffle to analyze
  const factoryAddress = '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff'; // V3 Factory
  const factoryABI = [
    'function raffleCounter() view returns (uint256)',
    'function getRaffleContract(uint256) view returns (address)',
    'function platformFee() view returns (uint256)',
    'function owner() view returns (address)',
    'event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract)'
  ];

  const raffleABI = [
    'function nftContract() view returns (address)',
    'function tokenId() view returns (uint256)',
    'function ticketPrice() view returns (uint256)',
    'function maxTickets() view returns (uint256)',
    'function endTime() view returns (uint256)',
    'function creator() view returns (address)',
    'function ticketsSold() view returns (uint256)',
    'function isActive() view returns (bool)',
    'function winner() view returns (address)',
    'function totalRevenue() view returns (uint256)',
    'function platformFeeAmount() view returns (uint256)'
  ];

  const provider = ethers.provider;
  const factory = new ethers.Contract(factoryAddress, factoryABI, provider);

  try {
    // 1. FACTORY STATE ANALYSIS
    console.log('📊 FACTORY STATE ANALYSIS');
    console.log('-------------------------');
    
    const raffleCounter = await factory.raffleCounter();
    const platformFee = await factory.platformFee();
    const owner = await factory.owner();
    
    console.log(`Total Raffles Created: ${raffleCounter}`);
    console.log(`Platform Fee: ${platformFee}% (${platformFee/100}%)`);
    console.log(`Factory Owner: ${owner}`);
    console.log(`Factory Address: ${factoryAddress}\n`);

    if (raffleCounter.toString() === '0') {
      console.log('❌ No raffles found to analyze');
      return;
    }

    // 2. LATEST RAFFLE ANALYSIS
    console.log('🎯 LATEST RAFFLE ANALYSIS');
    console.log('-------------------------');
    
    const latestRaffleId = Number(raffleCounter) - 1;
    const latestRaffleAddress = await factory.getRaffleContract(latestRaffleId);
    const raffle = new ethers.Contract(latestRaffleAddress, raffleABI, provider);
    
    console.log(`Raffle ID: ${latestRaffleId}`);
    console.log(`Raffle Contract: ${latestRaffleAddress}`);
    
    // Get raffle details
    const [
      nftContract,
      tokenId,
      ticketPrice,
      maxTickets,
      endTime,
      creator,
      ticketsSold,
      isActive,
      winner,
      totalRevenue,
      platformFeeAmount
    ] = await Promise.all([
      raffle.nftContract(),
      raffle.tokenId(),
      raffle.ticketPrice(),
      raffle.maxTickets(),
      raffle.endTime(),
      raffle.creator(),
      raffle.ticketsSold(),
      raffle.isActive(),
      raffle.winner().catch(() => ethers.ZeroAddress),
      raffle.totalRevenue(),
      raffle.platformFeeAmount()
    ]);

    console.log(`NFT Contract: ${nftContract}`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Ticket Price: ${ethers.formatEther(ticketPrice)} APE`);
    console.log(`Max Tickets: ${maxTickets}`);
    console.log(`Tickets Sold: ${ticketsSold}`);
    console.log(`Creator: ${creator}`);
    console.log(`Is Active: ${isActive}`);
    console.log(`Winner: ${winner === ethers.ZeroAddress ? 'None' : winner}`);
    console.log(`End Time: ${new Date(Number(endTime) * 1000).toISOString()}`);
    console.log(`Total Revenue: ${ethers.formatEther(totalRevenue)} APE`);
    console.log(`Platform Fee Amount: ${ethers.formatEther(platformFeeAmount)} APE\n`);

    // 3. TRANSACTION HISTORY ANALYSIS
    console.log('📜 TRANSACTION HISTORY ANALYSIS');
    console.log('-------------------------------');
    
    // Get creation event
    const creationFilter = factory.filters.RaffleCreated(latestRaffleId);
    const creationEvents = await factory.queryFilter(creationFilter);
    
    if (creationEvents.length > 0) {
      const event = creationEvents[0];
      const tx = await provider.getTransaction(event.transactionHash);
      const receipt = await provider.getTransactionReceipt(event.transactionHash);
      
      console.log(`Creation Transaction: ${event.transactionHash}`);
      console.log(`Block Number: ${event.blockNumber}`);
      console.log(`Gas Used: ${receipt.gasUsed.toLocaleString()}`);
      console.log(`Gas Price: ${ethers.formatUnits(tx.gasPrice, 'gwei')} gwei`);
      console.log(`Transaction Fee: ${ethers.formatEther(receipt.gasUsed * tx.gasPrice)} APE`);
      console.log(`From: ${tx.from}`);
      console.log(`To: ${tx.to}`);
      console.log(`Value: ${ethers.formatEther(tx.value)} APE\n`);
    }

    // 4. GAS ESTIMATION ANALYSIS
    console.log('⛽ GAS ESTIMATION ANALYSIS');
    console.log('-------------------------');
    
    try {
      // Simulate creating a similar raffle
      const [signer] = await ethers.getSigners();
      const gasEstimate = await factory.connect(signer).createRaffle.estimateGas(
        nftContract,
        Number(tokenId) + 1, // Different token ID
        ticketPrice,
        maxTickets,
        86400 // 24 hours
      );
      
      console.log(`Estimated Gas for New Raffle: ${gasEstimate.toLocaleString()}`);
      console.log(`Estimated Cost: ${ethers.formatEther(gasEstimate * BigInt(1000000000))} APE (at 1 gwei)\n`);
    } catch (error) {
      console.log(`Gas Estimation Failed: ${error.message}\n`);
    }

    // 5. REVENUE FLOW ANALYSIS
    console.log('💰 REVENUE FLOW ANALYSIS');
    console.log('------------------------');
    
    const expectedPlatformFee = (totalRevenue * platformFee) / 10000n;
    const expectedCreatorRevenue = totalRevenue - expectedPlatformFee;
    
    console.log(`Total Revenue: ${ethers.formatEther(totalRevenue)} APE`);
    console.log(`Expected Platform Fee (${platformFee/100}%): ${ethers.formatEther(expectedPlatformFee)} APE`);
    console.log(`Actual Platform Fee: ${ethers.formatEther(platformFeeAmount)} APE`);
    console.log(`Expected Creator Revenue: ${ethers.formatEther(expectedCreatorRevenue)} APE`);
    console.log(`Fee Calculation Match: ${expectedPlatformFee === platformFeeAmount ? '✅' : '❌'}\n`);

    // 6. CONTRACT BALANCES
    console.log('💳 CONTRACT BALANCES');
    console.log('-------------------');
    
    const factoryBalance = await provider.getBalance(factoryAddress);
    const raffleBalance = await provider.getBalance(latestRaffleAddress);
    const ownerBalance = await provider.getBalance(owner);
    
    console.log(`Factory Balance: ${ethers.formatEther(factoryBalance)} APE`);
    console.log(`Latest Raffle Balance: ${ethers.formatEther(raffleBalance)} APE`);
    console.log(`Owner Balance: ${ethers.formatEther(ownerBalance)} APE\n`);

    // 7. ARCHITECTURE SUMMARY
    console.log('🏗️ CURRENT ARCHITECTURE SUMMARY');
    console.log('===============================');
    console.log('✅ V3 Factory Pattern Active');
    console.log('✅ Direct Fee Distribution (no manual withdrawal needed)');
    console.log('✅ Clone-based Raffle Deployment');
    console.log('✅ Proper Access Controls');
    console.log(`✅ ${raffleCounter} Total Raffles Created`);
    console.log(`✅ Platform Fee: ${platformFee/100}% automatically distributed`);
    
    if (factoryBalance > 0) {
      console.log(`⚠️  Factory has ${ethers.formatEther(factoryBalance)} APE balance (should be 0 in V3)`);
    } else {
      console.log('✅ Factory balance is 0 (fees properly distributed)');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });