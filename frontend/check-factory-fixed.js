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
    
    // Try to call raffleCounter (correct function name)
    try {
      const raffleCounter = await publicClient.readContract({
        address: RAFFLE_FACTORY_ADDRESS,
        abi: [
          {
            "inputs": [],
            "name": "raffleCounter",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'raffleCounter'
      });
      
      console.log('📊 Total raffles created:', raffleCounter.toString());
      
      if (raffleCounter > 0n) {
        console.log('\n🔍 Searching for raffle events...');
        
        // Try different block ranges
        const currentBlock = await publicClient.getBlockNumber();
        console.log('Current block:', currentBlock.toString());
        
        // Try last 5000 blocks first
        const fromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n;
        console.log('Checking from block:', fromBlock.toString());
        
        const events = await publicClient.getLogs({
          address: RAFFLE_FACTORY_ADDRESS,
          event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
          fromBlock,
          toBlock: 'latest'
        });
        
        console.log(`Found ${events.length} events in last 5000 blocks`);
        
        if (events.length > 0) {
          console.log('\n📋 Recent raffles:');
          for (const event of events.slice(-3)) {
            const { raffleId, creator, nftContract, tokenId, raffleContract, ticketPrice, maxTickets } = event.args;
            console.log(`\n🎲 Raffle ${raffleId}:`);
            console.log(`  Creator: ${creator}`);
            console.log(`  NFT: ${nftContract} #${tokenId}`);
            console.log(`  Contract: ${raffleContract}`);
            console.log(`  Price: ${(Number(ticketPrice) / 1e18).toFixed(3)} APE`);
            console.log(`  Max Tickets: ${maxTickets}`);
            console.log(`  Block: ${event.blockNumber}`);
          }
        } else {
          // Try even wider range if no events found
          console.log('\n🔍 Trying wider search range...');
          const widerFromBlock = currentBlock > 20000n ? currentBlock - 20000n : 0n;
          
          const widerEvents = await publicClient.getLogs({
            address: RAFFLE_FACTORY_ADDRESS,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            fromBlock: widerFromBlock,
            toBlock: 'latest'
          });
          
          console.log(`Found ${widerEvents.length} events in last 20000 blocks`);
        }
      } else {
        console.log('❌ No raffles have been created yet');
      }
      
    } catch (error) {
      console.log('❌ Error calling raffleCounter:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFactory();
