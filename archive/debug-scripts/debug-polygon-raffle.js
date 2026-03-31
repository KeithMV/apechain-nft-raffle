/**
 * Polygon Raffle Creation Diagnostic
 * Run this in browser console to debug why createRaffle is reverting
 */

async function debugPolygonRaffleCreation() {
  console.log('🔍 DEBUGGING POLYGON RAFFLE CREATION...');
  console.log('=====================================');
  
  // FIXED: Use the same chain detection as the app
  let chainId;
  try {
    // Try to get current chain ID from wallet (fresh call)
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    chainId = parseInt(currentChainId, 16);
  } catch (error) {
    // Fallback to cached value
    chainId = window.ethereum ? parseInt(window.ethereum.chainId, 16) : null;
  }
  
  console.log('🔗 Current chain ID (fresh):', chainId);
  console.log('🔗 Cached chain ID:', window.ethereum ? parseInt(window.ethereum.chainId, 16) : null);
  
  if (chainId !== 137) {
    console.log('❌ Not on Polygon! Switch to Polygon (137) first.');
    return;
  }
  
  // Get user address
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  const userAddress = accounts[0];
  console.log('User address:', userAddress);
  
  if (!userAddress) {
    console.log('❌ No wallet connected!');
    return;
  }
  
  // Factory contract details - FIXED: Use same RPC as wagmi config
  const factoryAddress = '0x5854AF7c836275c55469350a114F62a1609c4A42';
  const rpcUrl = 'https://polygon-rpc.com'; // Match wagmi config
  
  console.log('Factory address:', factoryAddress);
  console.log('RPC URL:', rpcUrl);
  
  // Helper function for RPC calls - FIXED: Use consistent RPC
  async function rpcCall(data, to = factoryAddress) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ data, to }, 'latest'],
        id: 1
      })
    });
    const result = await response.json();
    return result.result;
  }
  
  // 1. Check factory status
  console.log('\\n1. CHECKING FACTORY STATUS...');
  
  const isPaused = await rpcCall('0x5c975abb'); // paused()
  console.log('Factory paused:', isPaused === '0x0000000000000000000000000000000000000000000000000000000000000000' ? 'No' : 'Yes');
  
  const owner = await rpcCall('0x8da5cb5b'); // owner()
  console.log('Factory owner:', owner);
  
  // 2. Check if user has NFTs on Polygon
  console.log('\\n2. CHECKING USER NFTs ON POLYGON...');
  
  try {
    // Use Alchemy NFT API to get user's NFTs
    const nftResponse = await fetch(`${alchemyUrl}/getNFTsForOwner?owner=${userAddress}&withMetadata=false&pageSize=10`);
    const nftData = await nftResponse.json();
    
    console.log('User NFT count on Polygon:', nftData.totalCount || 0);
    
    if (nftData.ownedNfts && nftData.ownedNfts.length > 0) {
      console.log('Sample NFTs:');
      nftData.ownedNfts.slice(0, 3).forEach((nft, i) => {
        console.log(`  ${i + 1}. Contract: ${nft.contract.address}, Token ID: ${nft.tokenId}`);
      });
      
      // Test with the first NFT
      const testNFT = nftData.ownedNfts[0];
      const nftContract = testNFT.contract.address;
      const tokenId = testNFT.tokenId;
      
      console.log('\\n3. TESTING WITH FIRST NFT...');
      console.log('Test NFT contract:', nftContract);
      console.log('Test token ID:', tokenId);
      
      // Check NFT ownership
      const ownerData = `0x6352211e${parseInt(tokenId).toString(16).padStart(64, '0')}`;
      const nftOwner = await rpcCall(ownerData, nftContract);
      const isOwner = nftOwner.toLowerCase().includes(userAddress.slice(2).toLowerCase());
      console.log('User owns this NFT:', isOwner ? 'Yes' : 'No');
      
      if (!isOwner) {
        console.log('❌ User does not own the NFT!');
        return;
      }
      
      // Check NFT approval
      const approvalData = `0x081812fc${parseInt(tokenId).toString(16).padStart(64, '0')}`;
      const approved = await rpcCall(approvalData, nftContract);
      const isApproved = approved.toLowerCase().includes(factoryAddress.slice(2).toLowerCase());
      console.log('NFT approved to factory:', isApproved ? 'Yes' : 'No');
      
      // Check setApprovalForAll
      const approvalForAllData = `0xe985e9c5${userAddress.slice(2).padStart(64, '0')}${factoryAddress.slice(2).padStart(64, '0')}`;
      const approvedForAll = await rpcCall(approvalForAllData, nftContract);
      const isApprovedForAll = approvedForAll !== '0x0000000000000000000000000000000000000000000000000000000000000000';
      console.log('Contract approved for all:', isApprovedForAll ? 'Yes' : 'No');
      
      if (!isApproved && !isApprovedForAll) {
        console.log('❌ NFT NOT APPROVED! This is likely the issue.');
        console.log('💡 SOLUTION: Approve the NFT contract first:');
        console.log(`   Contract: ${nftContract}`);
        console.log(`   Factory: ${factoryAddress}`);
        return;
      }
      
      // 4. Test createRaffle parameters
      console.log('\\n4. TESTING CREATERAFFLE PARAMETERS...');
      
      const testParams = {
        nftContract: nftContract,
        tokenId: tokenId,
        ticketPrice: '0.001', // 0.001 POL
        maxTickets: 10,
        duration: 24 * 3600 // 24 hours in seconds
      };
      
      console.log('Test parameters:', testParams);
      
      // Convert parameters to contract format
      const ticketPriceWei = (parseFloat(testParams.ticketPrice) * 1e18).toString(16);
      const createRaffleData = `0x8b338207${nftContract.slice(2).padStart(64, '0')}${parseInt(testParams.tokenId).toString(16).padStart(64, '0')}${ticketPriceWei.padStart(64, '0')}${testParams.maxTickets.toString(16).padStart(64, '0')}${testParams.duration.toString(16).padStart(64, '0')}`;
      
      try {
        // Try to simulate the createRaffle call
        const simulateResponse = await fetch(alchemyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              data: createRaffleData,
              to: factoryAddress,
              from: userAddress
            }, 'latest'],
            id: 1
          })
        });
        
        const simulateResult = await simulateResponse.json();
        
        if (simulateResult.error) {
          console.log('❌ CREATERAFFLE SIMULATION FAILED:');
          console.log('Error:', simulateResult.error.message);
          
          if (simulateResult.error.message.includes('execution reverted')) {
            console.log('\\n💡 COMMON CAUSES:');
            console.log('1. NFT not approved to factory');
            console.log('2. Invalid parameters (price too low, duration too short/long)');
            console.log('3. User does not own the NFT');
            console.log('4. Contract is paused or restricted');
          }
        } else {
          console.log('✅ CREATERAFFLE SIMULATION PASSED');
          console.log('The parameters should work. Issue might be elsewhere.');
        }
      } catch (error) {
        console.log('❌ Simulation error:', error.message);
      }
      
    } else {
      console.log('❌ NO NFTs FOUND ON POLYGON!');
      console.log('💡 SOLUTION: You need to have NFTs on Polygon to create raffles.');
    }
    
  } catch (error) {
    console.log('❌ Error checking NFTs:', error.message);
  }
  
  console.log('\\n📊 DIAGNOSTIC COMPLETE');
  console.log('=====================================');
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.debugPolygonRaffleCreation = debugPolygonRaffleCreation;
  console.log('🛠️ Polygon Raffle Debug Tool Loaded!');
  console.log('Usage: window.debugPolygonRaffleCreation()');
}