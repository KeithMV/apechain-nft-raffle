const { createPublicClient, http } = require('viem');

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

async function checkRaffleInfo() {
  try {
    // Use one of the raffle contracts we found
    const raffleContract = '0x40C27e709556d262a3626a51786A346fA0562E79';
    console.log('🎲 Checking raffle contract:', raffleContract);
    
    // Try the ABI from the contracts file (tuple structure)
    try {
      console.log('\n📋 Trying tuple structure ABI...');
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
      
      console.log('✅ Tuple structure worked!');
      console.log('Raffle Info:', {
        nftContract: raffleInfo[0],
        tokenId: raffleInfo[1].toString(),
        creator: raffleInfo[2],
        ticketPrice: (Number(raffleInfo[3]) / 1e18).toFixed(3) + ' APE',
        maxTickets: raffleInfo[4].toString(),
        ticketsSold: raffleInfo[5].toString(),
        endTime: new Date(Number(raffleInfo[6]) * 1000).toLocaleString(),
        winner: raffleInfo[7],
        completed: raffleInfo[8],
        platformFee: raffleInfo[9].toString()
      });
      
      const now = Math.floor(Date.now() / 1000);
      const isActive = !raffleInfo[8] && now < Number(raffleInfo[6]) && Number(raffleInfo[5]) < Number(raffleInfo[4]);
      console.log('Is Active:', isActive);
      
    } catch (error) {
      console.log('❌ Tuple structure failed:', error.message);
      
      // Try individual return values
      console.log('\n📋 Trying individual return values ABI...');
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
        
        console.log('✅ Individual values worked!');
        console.log('Raffle Info:', {
          nftContract: raffleInfo[0],
          tokenId: raffleInfo[1].toString(),
          creator: raffleInfo[2],
          ticketPrice: (Number(raffleInfo[3]) / 1e18).toFixed(3) + ' APE',
          maxTickets: raffleInfo[4].toString(),
          ticketsSold: raffleInfo[5].toString(),
          endTime: new Date(Number(raffleInfo[6]) * 1000).toLocaleString(),
          completed: raffleInfo[7],
          winner: raffleInfo[8]
        });
        
      } catch (error2) {
        console.log('❌ Individual values also failed:', error2.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRaffleInfo();
