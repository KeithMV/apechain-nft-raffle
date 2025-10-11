const { createPublicClient, http, parseAbiItem } = require('viem');

const publicClient = createPublicClient({
  transport: http('https://apechain.calderachain.xyz/http'),
  chain: {
    id: 33139,
    name: 'ApeChain',
    network: 'apechain',
    nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://apechain.calderachain.xyz/http'] },
      public: { http: ['https://apechain.calderachain.xyz/http'] }
    }
  }
});

const RAFFLE_FACTORY_ADDRESS = '0xa7652f6175C664bd09A7d726A5a51ebeBe2A2DBC';

async function checkAllRaffles() {
  try {
    console.log('🔍 Checking ALL raffle events from genesis...');
    
    // Check from genesis
    const allEvents = await publicClient.getLogs({
      address: RAFFLE_FACTORY_ADDRESS,
      event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
      fromBlock: 0n,
      toBlock: 'latest'
    });
    
    console.log(`Found ${allEvents.length} total RaffleCreated events from genesis`);
    
    if (allEvents.length > 0) {
      console.log('\n📋 All raffles:');
      
      for (const event of allEvents) {
        const { raffleId, creator, nftContract, tokenId, raffleContract, ticketPrice, maxTickets } = event.args;
        console.log(`\n🎲 Raffle ${raffleId}:`);
        console.log(`  Creator: ${creator}`);
        console.log(`  NFT: ${nftContract} #${tokenId}`);
        console.log(`  Contract: ${raffleContract}`);
        console.log(`  Price: ${(Number(ticketPrice) / 1e18).toFixed(3)} APE`);
        console.log(`  Max Tickets: ${maxTickets}`);
        console.log(`  Block: ${event.blockNumber}`);
      }
    }
    
    // Also check if the factory contract exists
    console.log('\n🏭 Checking factory contract...');
    const code = await publicClient.getBytecode({
      address: RAFFLE_FACTORY_ADDRESS
    });
    
    if (code && code !== '0x') {
      console.log('✅ Factory contract exists and has code');
    } else {
      console.log('❌ Factory contract not found or has no code');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllRaffles();
