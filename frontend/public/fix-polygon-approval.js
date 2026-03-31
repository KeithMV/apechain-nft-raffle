/**
 * POLYGON NFT APPROVAL FIX
 * This script will help you approve your NFT for the Polygon factory
 */

async function fixPolygonNFTApproval() {
  console.log('🔧 POLYGON NFT APPROVAL FIX');
  console.log('============================');
  
  // Check if we're on Polygon
  const chainId = window.ethereum ? parseInt(window.ethereum.chainId, 16) : null;
  console.log('Current chain ID:', chainId);
  
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
  
  // Factory address on Polygon
  const factoryAddress = '0xC9Bd344f5E31481F202E400C33210Bd1AB542b42';
  console.log('Factory address:', factoryAddress);
  
  // Your specific NFT details (confirmed from previous conversations)
  const YOUR_NFT_CONTRACT = '0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7';
  const YOUR_TOKEN_ID = '625';
  
  console.log('\n📋 YOUR NFT DETAILS:');
  console.log('Contract:', YOUR_NFT_CONTRACT);
  console.log('Token ID:', YOUR_TOKEN_ID);
  
  try {
    // 1. Check current approval status
    console.log('\n1. CHECKING CURRENT APPROVAL STATUS...');
    
    // Check if specific token is approved
    const getApprovedData = `0x081812fc${parseInt(YOUR_TOKEN_ID).toString(16).padStart(64, '0')}`;
    const approvedResponse = await window.ethereum.request({
      method: 'eth_call',
      params: [{
        to: YOUR_NFT_CONTRACT,
        data: getApprovedData
      }, 'latest']
    });
    
    const isTokenApproved = approvedResponse.toLowerCase().includes(factoryAddress.slice(2).toLowerCase());
    console.log('Token specifically approved:', isTokenApproved ? '✅ YES' : '❌ NO');
    
    // Check if approved for all
    const isApprovedForAllData = `0xe985e9c5${userAddress.slice(2).padStart(64, '0')}${factoryAddress.slice(2).padStart(64, '0')}`;
    const approvedForAllResponse = await window.ethereum.request({
      method: 'eth_call',
      params: [{
        to: YOUR_NFT_CONTRACT,
        data: isApprovedForAllData
      }, 'latest']
    });
    
    const isApprovedForAll = approvedForAllResponse !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    console.log('Approved for all:', isApprovedForAll ? '✅ YES' : '❌ NO');
    
    if (isTokenApproved || isApprovedForAll) {
      console.log('\n✅ NFT IS ALREADY APPROVED!');
      console.log('The approval is not the issue. Check other parameters:');
      console.log('- Ticket price > 0');
      console.log('- Duration between 1 hour and 30 days');
      console.log('- Max tickets between 1 and 10,000');
      console.log('- 10-second rate limit not exceeded');
      return;
    }
    
    // 2. NFT needs approval - let's fix it
    console.log('\n2. NFT NEEDS APPROVAL - FIXING NOW...');
    
    // Option 1: Approve specific token (more secure)
    console.log('\nOption 1: Approve specific token (recommended)');
    const approveData = `0x095ea7b3${factoryAddress.slice(2).padStart(64, '0')}${parseInt(YOUR_TOKEN_ID).toString(16).padStart(64, '0')}`;
    
    try {
      const approveTx = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: YOUR_NFT_CONTRACT,
          data: approveData,
          gas: '0x15F90' // 90,000 gas
        }]
      });
      
      console.log('✅ APPROVAL TRANSACTION SENT!');
      console.log('Transaction hash:', approveTx);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for transaction confirmation
      let confirmed = false;
      let attempts = 0;
      while (!confirmed && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [approveTx]
          });
          
          if (receipt && receipt.status === '0x1') {
            console.log('✅ APPROVAL CONFIRMED!');
            console.log('Block number:', parseInt(receipt.blockNumber, 16));
            confirmed = true;
            
            // Verify approval worked
            const newApprovedResponse = await window.ethereum.request({
              method: 'eth_call',
              params: [{
                to: YOUR_NFT_CONTRACT,
                data: getApprovedData
              }, 'latest']
            });
            
            const nowApproved = newApprovedResponse.toLowerCase().includes(factoryAddress.slice(2).toLowerCase());
            console.log('Verification - Token approved:', nowApproved ? '✅ YES' : '❌ NO');
            
            if (nowApproved) {
              console.log('\n🎉 SUCCESS! Your NFT is now approved for the factory.');
              console.log('You can now try creating a raffle again.');
            }
            
          } else if (receipt && receipt.status === '0x0') {
            console.log('❌ APPROVAL TRANSACTION FAILED');
            break;
          }
        } catch (e) {
          // Transaction not yet mined
        }
        
        attempts++;
      }
      
      if (!confirmed) {
        console.log('⏳ Transaction is taking longer than expected.');
        console.log('Check your wallet or Polygonscan for status.');
      }
      
    } catch (error) {
      console.log('❌ Approval failed:', error.message);
      
      if (error.message.includes('User denied')) {
        console.log('💡 You rejected the transaction. Try again and approve it.');
      } else {
        console.log('\n🔄 TRYING ALTERNATIVE: Approve for all tokens');
        
        // Option 2: Approve for all (less secure but sometimes needed)
        const setApprovalForAllData = `0xa22cb465${factoryAddress.slice(2).padStart(64, '0')}${'0000000000000000000000000000000000000000000000000000000000000001'}`;
        
        try {
          const approveAllTx = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: userAddress,
              to: YOUR_NFT_CONTRACT,
              data: setApprovalForAllData,
              gas: '0x15F90'
            }]
          });
          
          console.log('✅ APPROVE-ALL TRANSACTION SENT!');
          console.log('Transaction hash:', approveAllTx);
          console.log('This will approve ALL your NFTs from this contract to the factory.');
          
        } catch (error2) {
          console.log('❌ Both approval methods failed:', error2.message);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error during approval process:', error.message);
  }
  
  console.log('\n📊 APPROVAL FIX COMPLETE');
  console.log('========================');
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.fixPolygonNFTApproval = fixPolygonNFTApproval;
  console.log('🛠️ Polygon NFT Approval Fix Tool Loaded!');
  console.log('Usage: window.fixPolygonNFTApproval()');
  console.log('');
  console.log('📋 STEPS TO FIX:');
  console.log('1. Make sure you are on Polygon network');
  console.log('2. Update YOUR_NFT_CONTRACT and YOUR_TOKEN_ID in the script');
  console.log('3. Run: window.fixPolygonNFTApproval()');
  console.log('4. Approve the transaction in your wallet');
  console.log('5. Try creating the raffle again');
}