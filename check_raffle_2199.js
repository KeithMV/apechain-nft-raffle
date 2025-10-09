const { createPublicClient, http, parseAbiItem } = require('viem');
const { apechain } = require('viem/chains');

// ApeChain configuration
const publicClient = createPublicClient({
  chain: apechain,
  transport: http('https://apechain.calderachain.xyz/http')
});

const RAFFLE_FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

async function checkRaffle2199() {
  try {
    console.log('🔍 Searching for raffle with NFT #2199...');
    
    // Get recent raffle events
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock > 200000n ? currentBlock - 200000n : 0n;
    
    const raffleEvents = await publicClient.getLogs({
      address: RAFFLE_FACTORY_ADDRESS,
      event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
      fromBlock,
      toBlock: 'latest'
    });

    console.log(`Found ${raffleEvents.length} total raffle events`);
    
    // Find raffle with tokenId 2199
    const targetRaffle = raffleEvents.find(event => {
      return event.args.tokenId.toString() === '2199';
    });
    
    if (!targetRaffle) {
      console.log('❌ No raffle found for NFT #2199');
      return;
    }
    
    console.log('✅ Found raffle for NFT #2199!');
    console.log('📊 Raffle Details:');
    console.log(`   Raffle ID: ${targetRaffle.args.raffleId}`);
    console.log(`   Creator: ${targetRaffle.args.creator}`);
    console.log(`   NFT Contract: ${targetRaffle.args.nftContract}`);
    console.log(`   Token ID: ${targetRaffle.args.tokenId}`);
    console.log(`   Raffle Contract: ${targetRaffle.args.raffleContract}`);
    console.log(`   Ticket Price: ${Number(targetRaffle.args.ticketPrice) / 1e18} APE`);
    console.log(`   Max Tickets: ${targetRaffle.args.maxTickets}`);
    
    // Get raffle info from the contract
    const raffleContract = targetRaffle.args.raffleContract;
    
    try {
      const raffleInfo = await publicClient.readContract({
        address: raffleContract,
        abi: [
          {
            "inputs": [],
            "name": "getRaffleInfo",
            "outputs": [
              {"type": "address", "name": "nftContract"},
              {"type": "uint256", "name": "tokenId"},
              {"type": "address", "name": "creator"},
              {"type": "uint256", "name": "ticketPrice"},
              {"type": "uint256", "name": "maxTickets"},
              {"type": "uint256", "name": "ticketsSold"},
              {"type": "uint256", "name": "endTime"},
              {"type": "address", "name": "winner"},
              {"type": "bool", "name": "completed"},
              {"type": "uint256", "name": "platformFee"}
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'getRaffleInfo'
      });
      
      const endTime = Number(raffleInfo[6]);
      const startTime = endTime - (24 * 60 * 60); // Assuming you set 24 hours
      const duration = endTime - startTime;
      
      console.log('\n⏰ Timing Details:');
      console.log(`   End Time: ${new Date(endTime * 1000).toLocaleString()}`);
      console.log(`   Duration: ${Math.floor(duration / 3600)} hours (${Math.floor(duration / 86400)} days)`);
      console.log(`   Tickets Sold: ${raffleInfo[5]}/${raffleInfo[4]}`);
      console.log(`   Completed: ${raffleInfo[8]}`);
      
      if (raffleInfo[8]) {
        console.log(`   Winner: ${raffleInfo[7]}`);
      }
      
      const now = Math.floor(Date.now() / 1000);
      if (now < endTime && !raffleInfo[8]) {
        const remaining = endTime - now;
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        console.log(`   Time Remaining: ${hours}h ${minutes}m`);
      }
      
    } catch (error) {
      console.log('❌ Could not get detailed raffle info:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRaffle2199();