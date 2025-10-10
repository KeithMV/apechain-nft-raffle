const fetch = require('node-fetch');

async function checkRaffles() {
  try {
    console.log('🔍 Checking actual raffles from factory...');
    
    const RAFFLE_FACTORY = '0xa7652f6175C664bd09A7d726A5a51ebeBe2A2DBC';
    
    // Get recent events from factory
    const response = await fetch('https://apechain.calderachain.xyz/http', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          address: RAFFLE_FACTORY,
          topics: [
            '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0' // RaffleCreated event signature
          ],
          fromBlock: '0x0',
          toBlock: 'latest'
        }],
        id: 1
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('RPC Error:', result.error);
      return;
    }
    
    console.log(`Found ${result.result.length} events`);
    
    // Let's try a different approach - check the factory for created raffles
    const factoryResponse = await fetch('https://apechain.calderachain.xyz/http', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: RAFFLE_FACTORY,
          data: '0x8da5cb5b' // owner() function
        }, 'latest'],
        id: 1
      })
    });
    
    const factoryResult = await factoryResponse.json();
    console.log('Factory owner check:', factoryResult);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRaffles();