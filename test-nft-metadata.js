const { ethers } = require('hardhat');

async function testNFTMetadata() {
  const provider = new ethers.JsonRpcProvider('https://apechain.calderachain.xyz/http');
  
  // Test NFT contracts from raffles
  const nftContracts = [
    '0x6794aE7a2996f898332d0257B1EbCd8177AD58Da',
    '0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97'
  ];
  
  const tokenIds = ['6790', '52848'];
  
  const abi = [
    'function tokenURI(uint256 tokenId) external view returns (string memory)'
  ];
  
  for (let i = 0; i < nftContracts.length; i++) {
    try {
      console.log(`\nTesting NFT ${nftContracts[i]} #${tokenIds[i]}`);
      
      const contract = new ethers.Contract(nftContracts[i], abi, provider);
      const tokenURI = await contract.tokenURI(tokenIds[i]);
      
      console.log('TokenURI:', tokenURI);
      
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.split(',')[1];
        const jsonString = Buffer.from(base64Data, 'base64').toString();
        const metadata = JSON.parse(jsonString);
        console.log('Metadata:', JSON.stringify(metadata, null, 2));
      } else if (tokenURI.startsWith('ipfs://')) {
        console.log('IPFS URL detected:', tokenURI);
      } else if (tokenURI.startsWith('http')) {
        console.log('HTTP URL detected:', tokenURI);
      }
      
    } catch (error) {
      console.error(`Error with NFT ${nftContracts[i]} #${tokenIds[i]}:`, error.message);
    }
  }
}

testNFTMetadata().catch(console.error);