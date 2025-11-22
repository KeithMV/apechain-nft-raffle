const { createPublicClient, http, parseAbiItem } = require('viem');

// ApeChain configuration
const publicClient = createPublicClient({
  chain: {
    id: 33139,
    name: 'ApeChain',
    network: 'apechain',
    nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://apechain.calderachain.xyz/http'] },
      public: { http: ['https://apechain.calderachain.xyz/http'] }
    }
  },
  transport: http('https://apechain.calderachain.xyz/http')
});

// Contract addresses from the project
const RAFFLE_FACTORY_ADDRESS = '0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0';

// Search parameters
const TARGET_WALLET = '0x1dfb09d1969a11af5196629c2e6b220898ab538e';
const TARGET_NFT_CONTRACT = '0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97';
const TARGET_TOKEN_ID = '52870';

async function debugMissingRaffle() {
  console.log('🔍 Debugging Missing Raffle');
  console.log('Target Wallet:', TARGET_WALLET);
  console.log('Target NFT Contract:', TARGET_NFT_CONTRACT);
  console.log('Target Token ID:', TARGET_TOKEN_ID);
  console.log('Factory Contract:', RAFFLE_FACTORY_ADDRESS);
  console.log('');

  try {
    const currentBlock = await publicClient.getBlockNumber();
    console.log('Current Block:', currentBlock.toString());
    
    // Scan last 500k blocks (same as the service)
    const scanDepth = 500000n;
    const fromBlock = currentBlock > scanDepth ? currentBlock - scanDepth : 0n;
    
    console.log('Scanning from block:', fromBlock.toString());
    console.log('Scanning to block:', currentBlock.toString());
    console.log('Total blocks to scan:', (currentBlock - fromBlock).toString());
    console.log('');

    // Search for ALL RaffleCreated events by this wallet
    console.log('🔍 Searching for ALL raffles created by wallet...');
    
    const chunkSize = 5000n;
    let allEvents = [];
    let foundTargetRaffle = false;
    
    for (let chunkStart = fromBlock; chunkStart < currentBlock; chunkStart += chunkSize) {
      const chunkEnd = chunkStart + chunkSize > currentBlock ? currentBlock : chunkStart + chunkSize;
      
      try {
        const events = await publicClient.getLogs({
          address: RAFFLE_FACTORY_ADDRESS,
          event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
          args: {
            creator: TARGET_WALLET
          },
          fromBlock: chunkStart,
          toBlock: chunkEnd
        });
        
        if (events.length > 0) {
          console.log(`Found ${events.length} events in blocks ${chunkStart}-${chunkEnd}`);
          allEvents.push(...events);
          
          // Check if target raffle is in this chunk
          const targetEvent = events.find(e => 
            e.args.nftContract.toLowerCase() === TARGET_NFT_CONTRACT.toLowerCase() &&
            e.args.tokenId.toString() === TARGET_TOKEN_ID
          );
          
          if (targetEvent) {
            foundTargetRaffle = true;
            console.log('🎯 FOUND TARGET RAFFLE!');
            console.log('Event details:', {
              raffleId: targetEvent.args.raffleId.toString(),
              creator: targetEvent.args.creator,
              nftContract: targetEvent.args.nftContract,
              tokenId: targetEvent.args.tokenId.toString(),
              raffleContract: targetEvent.args.raffleContract,
              ticketPrice: targetEvent.args.ticketPrice.toString(),
              maxTickets: targetEvent.args.maxTickets.toString(),
              blockNumber: targetEvent.blockNumber.toString(),
              transactionHash: targetEvent.transactionHash
            });
          }
        }
      } catch (error) {
        console.log(`Error scanning chunk ${chunkStart}-${chunkEnd}:`, error.message);
      }
    }
    
    console.log('');
    console.log('📊 SCAN RESULTS:');
    console.log('Total events found:', allEvents.length);
    console.log('Target raffle found:', foundTargetRaffle);
    console.log('');
    
    if (allEvents.length > 0) {
      console.log('📋 ALL RAFFLES CREATED BY THIS WALLET:');
      allEvents.forEach((event, index) => {
        const isTarget = event.args.nftContract.toLowerCase() === TARGET_NFT_CONTRACT.toLowerCase() &&
                        event.args.tokenId.toString() === TARGET_TOKEN_ID;
        
        console.log(`${index + 1}. ${isTarget ? '🎯 TARGET: ' : ''}Raffle ID ${event.args.raffleId} - NFT ${event.args.nftContract}#${event.args.tokenId} (Block: ${event.blockNumber})`);
      });
    }
    
    if (!foundTargetRaffle) {
      console.log('');
      console.log('❌ TARGET RAFFLE NOT FOUND');
      console.log('Possible reasons:');
      console.log('1. Raffle was created more than 500k blocks ago (~87 days)');
      console.log('2. Raffle was created with a different wallet address');
      console.log('3. NFT contract address or token ID is incorrect');
      console.log('4. Raffle was created on a different factory contract');
      console.log('');
      
      // Search without creator filter to see if raffle exists at all
      console.log('🔍 Searching for raffle with ANY creator...');
      
      let foundWithAnyCreator = false;
      for (let chunkStart = fromBlock; chunkStart < currentBlock; chunkStart += chunkSize) {
        const chunkEnd = chunkStart + chunkSize > currentBlock ? currentBlock : chunkStart + chunkSize;
        
        try {
          const events = await publicClient.getLogs({
            address: RAFFLE_FACTORY_ADDRESS,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            args: {
              nftContract: TARGET_NFT_CONTRACT
            },
            fromBlock: chunkStart,
            toBlock: chunkEnd
          });
          
          const targetEvent = events.find(e => e.args.tokenId.toString() === TARGET_TOKEN_ID);
          if (targetEvent) {
            foundWithAnyCreator = true;
            console.log('🎯 FOUND RAFFLE WITH DIFFERENT CREATOR!');
            console.log('Actual creator:', targetEvent.args.creator);
            console.log('Expected creator:', TARGET_WALLET);
            console.log('Event details:', {
              raffleId: targetEvent.args.raffleId.toString(),
              creator: targetEvent.args.creator,
              nftContract: targetEvent.args.nftContract,
              tokenId: targetEvent.args.tokenId.toString(),
              raffleContract: targetEvent.args.raffleContract,
              blockNumber: targetEvent.blockNumber.toString()
            });
            break;
          }
        } catch (error) {
          // Continue scanning
        }
      }
      
      if (!foundWithAnyCreator) {
        console.log('❌ Raffle not found with any creator - may not exist or be outside scan range');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugMissingRaffle();