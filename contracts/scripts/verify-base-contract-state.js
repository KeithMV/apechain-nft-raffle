const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Verifying Base V4 Contract State...\n');

  const factoryAddress = '0xaD3B887a57a9e3a3103De2a372BC3834A7C5023c';
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';

  const factoryABI = [
    'function raffleCounter() external view returns (uint256)',
    'function getRaffleContract(uint256 raffleId) external view returns (address)',
    'function lastRaffleTime(address) external view returns (uint256)',
    'function platformFee() external view returns (uint256)',
    'function paused() external view returns (bool)',
    'function getCreatorRaffles(address creator) external view returns (uint256[])',
    'event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'
  ];

  const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);

  try {
    console.log('📊 Factory State:');
    
    const raffleCounter = await factory.raffleCounter();
    console.log('Total Raffles Created:', raffleCounter.toString());
    
    const lastTime = await factory.lastRaffleTime(userAddress);
    console.log('User Last Raffle Time:', lastTime.toString());
    
    if (lastTime.toString() !== '0') {
      const now = Math.floor(Date.now() / 1000);
      console.log('Current Time:', now);
      console.log('Time Since Last:', now - Number(lastTime), 'seconds');
    }

    // Check if user has created any raffles
    try {
      const creatorRaffles = await factory.getCreatorRaffles(userAddress);
      console.log('User Created Raffles:', creatorRaffles.map(r => r.toString()));
    } catch (e) {
      console.log('Could not get creator raffles (function may not exist)');
    }

    // If there are raffles, check the first few
    if (Number(raffleCounter) > 0) {
      console.log('\n🎯 Checking Recent Raffles:');
      
      const maxCheck = Math.min(Number(raffleCounter), 5);
      for (let i = 0; i < maxCheck; i++) {
        try {
          const raffleContract = await factory.getRaffleContract(i);
          console.log(`Raffle ${i}: ${raffleContract}`);
          
          // Try to get raffle info
          const raffleABI = [
            'function getRaffleInfo() external view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))'
          ];
          
          const raffle = new ethers.Contract(raffleContract, raffleABI, ethers.provider);
          const info = await raffle.getRaffleInfo();
          
          console.log(`  Creator: ${info.creator}`);
          console.log(`  NFT: ${info.nftContract} #${info.tokenId.toString()}`);
          console.log(`  Price: ${ethers.utils.formatEther(info.ticketPrice)} ETH`);
          console.log(`  Tickets: ${info.ticketsSold.toString()}/${info.maxTickets.toString()}`);
          console.log(`  Active: ${!info.completed && Date.now()/1000 < Number(info.endTime)}`);
          
        } catch (error) {
          console.log(`Raffle ${i}: Error getting info -`, error.message.split('(')[0]);
        }
      }
    } else {
      console.log('\n❌ NO RAFFLES FOUND ON BASE V4 CONTRACT');
      console.log('This confirms the raffle creation is failing');
    }

    // Check recent events
    console.log('\n📋 Checking Recent RaffleCreated Events...');
    try {
      const currentBlock = await ethers.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks
      
      const filter = factory.filters.RaffleCreated();
      const events = await factory.queryFilter(filter, fromBlock, currentBlock);
      
      console.log(`Found ${events.length} RaffleCreated events in last 10k blocks`);
      
      events.slice(-5).forEach((event, index) => {
        console.log(`Event ${index + 1}:`);
        console.log(`  Raffle ID: ${event.args.raffleId.toString()}`);
        console.log(`  Creator: ${event.args.creator}`);
        console.log(`  NFT: ${event.args.nftContract} #${event.args.tokenId.toString()}`);
        console.log(`  Block: ${event.blockNumber}`);
      });
      
    } catch (error) {
      console.log('Could not fetch events:', error.message);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });