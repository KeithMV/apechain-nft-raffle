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

async function findRaffleEvents() {
  try {
    console.log('🔍 Searching for raffle events in different ranges...');
    
    const currentBlock = await publicClient.getBlockNumber();
    console.log('Current block:', currentBlock.toString());
    
    // Try different ranges going back in time
    const ranges = [
      { name: 'Last 50k blocks', from: currentBlock - 50000n },
      { name: 'Last 100k blocks', from: currentBlock - 100000n },
      { name: 'Last 200k blocks', from: currentBlock - 200000n },
      { name: 'Last 500k blocks', from: currentBlock - 500000n }
    ];
    
    for (const range of ranges) {
      if (range.from < 0n) continue;
      
      console.log(`\n🔍 Checking ${range.name} (from block ${range.from.toString()})...`);
      
      try {
        const events = await publicClient.getLogs({
          address: RAFFLE_FACTORY_ADDRESS,
          event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
          fromBlock: range.from,
          toBlock: 'latest'
        });
        
        console.log(`Found ${events.length} events in ${range.name}`);
        
        if (events.length > 0) {
          console.log('\n📋 Sample events:');
          const sampleEvents = events.slice(-3); // Last 3 events
          
          for (const event of sampleEvents) {
            const { raffleId, creator, nftContract, tokenId, raffleContract, ticketPrice, maxTickets } = event.args;
            console.log(`\n🎲 Raffle ${raffleId} (Block ${event.blockNumber}):`);
            console.log(`  Creator: ${creator}`);
            console.log(`  NFT: ${nftContract} #${tokenId}`);
            console.log(`  Contract: ${raffleContract}`);
            console.log(`  Price: ${(Number(ticketPrice) / 1e18).toFixed(3)} APE`);
            console.log(`  Max Tickets: ${maxTickets}`);
            
            // Check if this raffle is still active
            try {
              const raffleInfo = await publicClient.readContract({
                address: raffleContract,
                abi: [
                  {
                    "inputs": [],
                    "name": "getRaffleInfo",
                    "outputs": [
                      {
                        "components": [
                          {"internalType": "address", "name": "nftContract", "type": "address"},
                          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                          {"internalType": "address", "name": "creator", "type": "address"},
                          {"internalType": "uint256", "name": "ticketPrice", "type": "uint256"},
                          {"internalType": "uint256", "name": "maxTickets", "type": "uint256"},
                          {"internalType": "uint256", "name": "ticketsSold", "type": "uint256"},
                          {"internalType": "uint256", "name": "endTime", "type": "uint256"},
                          {"internalType": "address", "name": "winner", "type": "address"},
                          {"internalType": "bool", "name": "completed", "type": "bool"},
                          {"internalType": "uint256", "name": "platformFee", "type": "uint256"}
                        ],
                        "internalType": "struct RaffleContract.RaffleInfo",
                        "name": "",
                        "type": "tuple"
                      }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  }
                ],
                functionName: 'getRaffleInfo'
              });
              
              const now = Math.floor(Date.now() / 1000);
              const isActive = !raffleInfo[8] && now < Number(raffleInfo[6]) && Number(raffleInfo[5]) < Number(raffleInfo[4]);
              
              console.log(`  Status: ${raffleInfo[8] ? 'COMPLETED' : 'ACTIVE'}`);
              console.log(`  Tickets: ${raffleInfo[5]}/${raffleInfo[4]}`);
              console.log(`  End Time: ${new Date(Number(raffleInfo[6]) * 1000).toLocaleString()}`);
              console.log(`  Should Show: ${isActive ? 'YES' : 'NO'}`);
              
            } catch (error) {
              console.log(`  Error reading raffle: ${error.message}`);
            }
          }
          
          break; // Found events, no need to check further ranges
        }
        
      } catch (error) {
        console.log(`❌ Error checking ${range.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

findRaffleEvents();
