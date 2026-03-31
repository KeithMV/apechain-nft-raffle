/**
 * SIMPLE NFT APPROVAL CHECKER
 * Copy and paste this directly into browser console on Polygon network
 */

// Your NFT details
const NFT_CONTRACT = '0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7';
const TOKEN_ID = '625';
const FACTORY_ADDRESS = '0x5854AF7c836275c55469350a114F62a1609c4A42';

async function checkNFTApproval() {
  console.log('🔍 CHECKING NFT APPROVAL STATUS');
  console.log('================================');
  
  try {
    // Get user address
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const userAddress = accounts[0];
    console.log('User:', userAddress);
    console.log('NFT Contract:', NFT_CONTRACT);
    console.log('Token ID:', TOKEN_ID);
    console.log('Factory:', FACTORY_ADDRESS);
    
    // Check 1: Do you own the NFT?
    console.log('\n1. CHECKING NFT OWNERSHIP...');
    const ownerData = `0x6352211e${parseInt(TOKEN_ID).toString(16).padStart(64, '0')}`;
    const ownerResult = await window.ethereum.request({
      method: 'eth_call',
      params: [{ to: NFT_CONTRACT, data: ownerData }, 'latest']
    });
    
    const nftOwner = '0x' + ownerResult.slice(-40);
    const youOwnIt = nftOwner.toLowerCase() === userAddress.toLowerCase();
    console.log('NFT Owner:', nftOwner);
    console.log('You own it:', youOwnIt ? '✅ YES' : '❌ NO');
    
    if (!youOwnIt) {
      console.log('❌ PROBLEM: You do not own this NFT!');
      return;
    }
    
    // Check 2: Is the specific token approved?
    console.log('\n2. CHECKING TOKEN APPROVAL...');
    const approvedData = `0x081812fc${parseInt(TOKEN_ID).toString(16).padStart(64, '0')}`;
    const approvedResult = await window.ethereum.request({
      method: 'eth_call',
      params: [{ to: NFT_CONTRACT, data: approvedData }, 'latest']
    });
    
    const approvedAddress = '0x' + approvedResult.slice(-40);
    const tokenApproved = approvedAddress.toLowerCase() === FACTORY_ADDRESS.toLowerCase();
    console.log('Approved to:', approvedAddress);
    console.log('Token approved:', tokenApproved ? '✅ YES' : '❌ NO');
    
    // Check 3: Is the contract approved for all?
    console.log('\n3. CHECKING APPROVAL FOR ALL...');
    const approvalForAllData = `0xe985e9c5${userAddress.slice(2).padStart(64, '0')}${FACTORY_ADDRESS.slice(2).padStart(64, '0')}`;
    const approvalForAllResult = await window.ethereum.request({
      method: 'eth_call',
      params: [{ to: NFT_CONTRACT, data: approvalForAllData }, 'latest']
    });
    
    const approvedForAll = approvalForAllResult !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    console.log('Approved for all:', approvedForAll ? '✅ YES' : '❌ NO');
    
    // Summary
    console.log('\n📊 APPROVAL SUMMARY:');
    console.log('====================');
    console.log('Own NFT:', youOwnIt ? '✅' : '❌');
    console.log('Token approved:', tokenApproved ? '✅' : '❌');
    console.log('All approved:', approvedForAll ? '✅' : '❌');
    
    const canCreateRaffle = youOwnIt && (tokenApproved || approvedForAll);
    console.log('Can create raffle:', canCreateRaffle ? '✅ YES' : '❌ NO');
    
    if (!canCreateRaffle) {
      console.log('\n🔧 TO FIX APPROVAL:');
      if (!tokenApproved && !approvedForAll) {
        console.log('Run this in console:');
        console.log(`
// Approve specific token (recommended)
const approveData = '0x095ea7b3${FACTORY_ADDRESS.slice(2).padStart(64, '0')}${parseInt(TOKEN_ID).toString(16).padStart(64, '0')}';
window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: '${userAddress}',
    to: '${NFT_CONTRACT}',
    data: approveData
  }]
});
        `);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkNFTApproval();