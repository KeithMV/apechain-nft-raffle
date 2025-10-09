const { ethers } = require('hardhat');

async function testNFTOwnership() {
  const nftContract = '0x6f2a21a8b9cf699d7d3a713a9d7cfbb9e9760f97';
  const tokenId = '34701';
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  const factoryAddress = '0x05139110Db8FF9cF82A836Af95eff4530011c705';
  
  console.log('🔍 Testing NFT ownership and approval...');
  console.log('NFT Contract:', nftContract);
  console.log('Token ID:', tokenId);
  console.log('User Address:', userAddress);
  
  try {
    // Get NFT contract
    const nft = await ethers.getContractAt('IERC721', nftContract);
    
    // Check ownership
    const owner = await nft.ownerOf(tokenId);
    console.log('🎯 NFT Owner:', owner);
    console.log('✅ User owns NFT:', owner.toLowerCase() === userAddress.toLowerCase());
    
    // Check approval
    const isApproved = await nft.isApprovedForAll(userAddress, factoryAddress);
    console.log('✅ Factory Approved:', isApproved);
    
    // Test factory counter
    const factory = await ethers.getContractAt('RaffleFactory', factoryAddress);
    const counter = await factory.raffleCounter();
    console.log('🎯 Current Raffle Counter:', counter.toString());
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNFTOwnership();