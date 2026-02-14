const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Verifying NFT Ownership on Base...\n');

  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
  const tokenId = '1064';
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';

  const nftABI = [
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    'function tokenURI(uint256 tokenId) external view returns (string)'
  ];

  try {
    const nft = new ethers.Contract(nftContract, nftABI, ethers.provider);

    console.log('📋 NFT Contract Info:');
    console.log('Contract:', nftContract);
    console.log('Token ID:', tokenId);
    console.log('User Address:', userAddress);

    try {
      const name = await nft.name();
      const symbol = await nft.symbol();
      console.log('Collection:', name, '(' + symbol + ')');
    } catch (e) {
      console.log('Collection info not available');
    }

    console.log('\n🔍 Ownership Check:');
    
    try {
      const owner = await nft.ownerOf(tokenId);
      console.log('Actual Owner:', owner);
      console.log('Expected Owner:', userAddress);
      console.log('Owns NFT:', owner.toLowerCase() === userAddress.toLowerCase());
      
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        console.log('\n❌ ISSUE FOUND: User does not own this NFT on Base network!');
        console.log('The NFT might be:');
        console.log('1. On a different network (ApeChain?)');
        console.log('2. Already transferred/sold');
        console.log('3. Wrong token ID or contract address');
      } else {
        console.log('\n✅ User owns the NFT - ownership is not the issue');
      }
      
    } catch (error) {
      console.log('❌ Failed to check ownership:', error.message);
      console.log('Possible reasons:');
      console.log('1. Token does not exist');
      console.log('2. Invalid contract address');
      console.log('3. Network connection issue');
    }

    // Try to get token URI for more info
    try {
      const tokenURI = await nft.tokenURI(tokenId);
      console.log('\n📄 Token URI:', tokenURI);
    } catch (e) {
      console.log('\n📄 Token URI not available');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });