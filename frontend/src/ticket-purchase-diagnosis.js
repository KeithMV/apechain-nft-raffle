/**
 * Comprehensive Ticket Purchase Fix
 * Diagnoses and fixes the "Not NFT owner" error when buying raffle tickets
 */

// 1. ENVIRONMENT FIX - Ensure all environment files have the correct API key
const CORRECT_API_KEY = 'krTN79Cl9cUZKdtFDEled';

// 2. CONTRACT VALIDATION
const POLYGON_RAFFLE_FACTORY = '0xC9Bd344f5E31481F202E400C33210Bd1AB542b42';
const PROBLEM_NFT_CONTRACT = '0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7';
const PROBLEM_TOKEN_ID = '625';

// 3. DIAGNOSTIC FUNCTIONS
async function diagnoseRaffleContract() {
  console.log('🔍 DIAGNOSING RAFFLE CONTRACT...');
  
  // Check if this is actually a raffle contract
  try {
    const response = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${CORRECT_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          data: '0x8da5cb5b', // owner() function
          to: POLYGON_RAFFLE_FACTORY
        }, 'latest'],
        id: 1
      })
    });
    
    const data = await response.json();
    console.log('Contract owner:', data.result);
    
    // Check if it's a factory or individual raffle
    const factoryResponse = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${CORRECT_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          data: '0x3ccfd60b', // getRaffleInfo() or similar
          to: POLYGON_RAFFLE_FACTORY
        }, 'latest'],
        id: 2
      })
    });
    
    const factoryData = await factoryResponse.json();
    console.log('Factory/Raffle check:', factoryData);
    
  } catch (error) {
    console.error('❌ Contract diagnosis failed:', error);
  }
}

// 4. NFT OWNERSHIP CHECK
async function checkNFTOwnership() {
  console.log('🔍 CHECKING NFT OWNERSHIP...');
  
  try {
    // Check who owns the NFT
    const response = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${CORRECT_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          data: `0x6352211e${PROBLEM_TOKEN_ID.padStart(64, '0')}`, // ownerOf(tokenId)
          to: PROBLEM_NFT_CONTRACT
        }, 'latest'],
        id: 1
      })
    });
    
    const data = await response.json();
    const owner = data.result;
    console.log('NFT Owner:', owner);
    
    // Check if NFT is approved to raffle contract
    const approvalResponse = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${CORRECT_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          data: `0x081812fc${PROBLEM_TOKEN_ID.padStart(64, '0')}`, // getApproved(tokenId)
          to: PROBLEM_NFT_CONTRACT
        }, 'latest'],
        id: 2
      })
    });
    
    const approvalData = await approvalResponse.json();
    console.log('NFT Approved to:', approvalData.result);
    
    return { owner, approved: approvalData.result };
  } catch (error) {
    console.error('❌ NFT ownership check failed:', error);
    return null;
  }
}

// 5. RAFFLE STATE CHECK
async function checkRaffleState() {
  console.log('🔍 CHECKING RAFFLE STATE...');
  
  // This might be a factory contract, not an individual raffle
  // Let's check if we need to call a different function
  
  try {
    // Try to get raffle info if it's an individual raffle
    const response = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${CORRECT_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          data: '0x3ccfd60b', // Common raffle info function
          to: POLYGON_RAFFLE_FACTORY
        }, 'latest'],
        id: 1
      })
    });
    
    const data = await response.json();
    console.log('Raffle state response:', data);
    
    if (data.error) {
      console.log('⚠️ This might be a factory contract, not an individual raffle');
      
      // Try factory functions
      const factoryResponse = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${CORRECT_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            data: '0x8b33820700000000000000000000000087aaf35253d16895111f4bc0ad6bdde5be0554b70000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000015180', // createRaffle call
            to: POLYGON_RAFFLE_FACTORY,
            from: '0xa225CFb920fac5fA9f16C935f3CE985cE8490f76'
          }, 'latest'],
          id: 2
        })
      });
      
      const factoryData = await factoryResponse.json();
      console.log('Factory createRaffle simulation:', factoryData);
    }
    
  } catch (error) {
    console.error('❌ Raffle state check failed:', error);
  }
}

// 6. MAIN DIAGNOSTIC FUNCTION
async function runFullDiagnosis() {
  console.log('🚀 STARTING FULL TICKET PURCHASE DIAGNOSIS...');
  console.log('=====================================');
  
  await diagnoseRaffleContract();
  console.log('');
  
  const nftInfo = await checkNFTOwnership();
  console.log('');
  
  await checkRaffleState();
  console.log('');
  
  // ANALYSIS
  console.log('📊 ANALYSIS:');
  console.log('=====================================');
  
  if (nftInfo) {
    const nftOwner = nftInfo.owner.toLowerCase();
    const raffleContract = POLYGON_RAFFLE_FACTORY.toLowerCase();
    const isApproved = nftInfo.approved.toLowerCase() === raffleContract;
    
    console.log('NFT Owner:', nftOwner);
    console.log('Raffle Contract:', raffleContract);
    console.log('Is NFT Approved to Raffle?', isApproved);
    
    if (!isApproved) {
      console.log('❌ PROBLEM: NFT is not approved to the raffle contract');
      console.log('💡 SOLUTION: The NFT owner needs to approve the raffle contract first');
    }
  }
  
  console.log('');
  console.log('🔧 RECOMMENDED FIXES:');
  console.log('1. Ensure NFT is approved to raffle contract');
  console.log('2. Verify this is the correct raffle contract address');
  console.log('3. Check if raffle is properly initialized');
  console.log('4. Verify the buyTickets function signature');
}

// Export for browser console use
if (typeof window !== 'undefined') {
  window.ticketPurchaseDiagnosis = {
    runFullDiagnosis,
    diagnoseRaffleContract,
    checkNFTOwnership,
    checkRaffleState
  };
  
  console.log('💡 Run window.ticketPurchaseDiagnosis.runFullDiagnosis() in browser console');
}

// Run diagnosis
runFullDiagnosis();