// Quick test script to check NFT image availability
const testNFTs = [
  { contract: '0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97', tokenId: '34648' },
  { contract: '0xDe970C730cD7056B654b12366ADEE48d21ea2c23', tokenId: '2406' },
  { contract: '0xA0D77Da1E690156B95e0619DE4a4F8fc5e3A2266', tokenId: '2083' }
];

async function testNFTImage(contract, tokenId) {
  try {
    // Simulate the same logic as our service
    const response = await fetch(`https://api.op.xyz/v1/m/b/${contract.toLowerCase()}-${tokenId}`);
    if (response.ok) {
      const metadata = await response.json();
      console.log(`✅ ${contract} #${tokenId}: ${metadata.name || 'Unknown'}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${contract} #${tokenId}: Failed - ${error.message}`);
  }
  return false;
}

// Run tests
testNFTs.forEach(nft => testNFTImage(nft.contract, nft.tokenId));