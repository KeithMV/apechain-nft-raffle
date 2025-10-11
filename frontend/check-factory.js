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

async function checkFactory() {
  try {
    console.log('🏭 Checking factory contract at:', RAFFLE_FACTORY_ADDRESS);
    
    // Check if contract exists
    const code = await publicClient.getBytecode({
      address: RAFFLE_FACTORY_ADDRESS
    });
    
    if (code && code !== '0x') {
      console.log('✅ Factory contract exists and has code');
      console.log('Code length:', code.length);
    } else {
      console.log('❌ Factory contract not found or has no code');
      return;
    }
    
    // Try to call a view function
    try {
      const raffleCount = await publicClient.readContract({
        address: RAFFLE_FACTORY_ADDRESS,
        abi: [
          {
            "inputs": [],
            "name": "raffleCount",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'raffleCount'
      });
      
      console.log('📊 Total raffles created:', raffleCount.toString());
      
      if (raffleCount > 0n) {
        console.log('\n🔍 Checking recent blocks for events...');
        
        // Try smaller ranges
        const currentBlock = await publicClient.getBlockNumber();
        console.log('Current block:', currentBlock.toString());
        
        // Try last 10000 blocks
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
        console.log('Checking from block:', fromBlock.toString());
        
        const events = await publicClient.getLogs({
          address: RAFFLE_FACTORY_ADDRESS,
          event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
          fromBlock,
          toBlock: 'latest'
        });
        
        console.log(`Found ${events.length} events in last 10000 blocks`);
        
        if (events.length === 0) {
          // Try even smaller range - last 1000 blocks
          const smallerFromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;
          console.log('Trying smaller range from block:', smallerFromBlock.toString());
          
          const smallerEvents = await publicClient.getLogs({
            address: RAFFLE_FACTORY_ADDRESS,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            fromBlock: smallerFromBlock,
            toBlock: 'latest'
          });
          
          console.log(`Found ${smallerEvents.length} events in last 1000 blocks`);
        }
      }
      
    } catch (error) {
      console.log('❌ Error calling raffleCount:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFactory();
