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

async function debugRaffles() {
  try {
    console.log('🔍 Debugging raffle events...');
    
    // Get current block
    const currentBlock = await publicClient.getBlockNumber();
    console.log('Current block:', currentBlock.toString());
    
    // Check recent events (last 50000 blocks)
    const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
    console.log('Checking from block:', fromBlock.toString(), 'to latest');
    
    const raffleEvents = await publicClient.getLogs({
      address: RAFFLE_FACTORY_ADDRESS,
      event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
      fromBlock,
      toBlock: 'latest'
    });
    
    console.log(`Found ${raffleEvents.length} RaffleCreated events`);
    
    if (raffleEvents.length > 0) {
      console.log('\n📋 Recent raffles:');
      
      // Show last 5 events
      const recentEvents = raffleEvents.slice(-5);
      for (const event of recentEvents) {
        const { raffleId, creator, nftContract, tokenId, raffleContract, ticketPrice, maxTickets } = event.args;
        console.log(`\n🎲 Raffle ${raffleId}:`);
        console.log(`  Creator: ${creator}`);
        console.log(`  NFT: ${nftContract} #${tokenId}`);
        console.log(`  Contract: ${raffleContract}`);
        console.log(`  Price: ${(Number(ticketPrice) / 1e18).toFixed(3)} APE`);
        console.log(`  Max Tickets: ${maxTickets}`);
        console.log(`  Block: ${event.blockNumber}`);
        
        // Check raffle status
        try {
          const raffleInfo = await publicClient.readContract({
            address: raffleContract,
            abi: [
              {
                "inputs": [],
                "name": "getRaffleInfo",
                "outputs": [
                  {"internalType": "address", "name": "nftContract", "type": "address"},
                  {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                  {"internalType": "address", "name": "creator", "type": "address"},
                  {"internalType": "uint256", "name": "ticketPrice", "type": "uint256"},
                  {"internalType": "uint256", "name": "maxTickets", "type": "uint256"},
                  {"internalType": "uint256", "name": "ticketsSold", "type": "uint256"},
                  {"internalType": "uint256", "name": "endTime", "type": "uint256"},
                  {"internalType": "bool", "name": "completed", "type": "bool"},
                  {"internalType": "address", "name": "winner", "type": "address"}
                ],
                "stateMutability": "view",
                "type": "function"
              }
            ],
            functionName: 'getRaffleInfo'
          });
          
          const now = Math.floor(Date.now() / 1000);
          const isActive = !raffleInfo[7] && now < Number(raffleInfo[6]) && Number(raffleInfo[5]) < Number(maxTickets);
          
          console.log(`  Status: ${raffleInfo[7] ? 'COMPLETED' : 'ACTIVE'}`);
          console.log(`  Tickets Sold: ${raffleInfo[5]}/${maxTickets}`);
          console.log(`  End Time: ${new Date(Number(raffleInfo[6]) * 1000).toLocaleString()}`);
          console.log(`  Should Show: ${isActive ? 'YES' : 'NO'}`);
          
        } catch (error) {
          console.log(`  Error reading raffle info: ${error.message}`);
        }
      }
    } else {
      console.log('❌ No raffle events found in recent blocks');
      
      // Try checking from genesis
      console.log('\n🔍 Checking from genesis block...');
      const allEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_ADDRESS,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        fromBlock: 0n,
        toBlock: 'latest'
      });
      
      console.log(`Found ${allEvents.length} total events from genesis`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugRaffles();
