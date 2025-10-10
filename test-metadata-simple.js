const fetch = require('node-fetch');

async function testNFTMetadata() {
  // Test NFT contracts from your raffles
  const nftContracts = [
    '0x6794aE7a2996f898332d0257B1EbCd8177AD58Da',
    '0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97'
  ];
  
  const tokenIds = ['6790', '52848'];
  
  for (let i = 0; i < nftContracts.length; i++) {
    try {
      console.log(`\nTesting NFT ${nftContracts[i]} #${tokenIds[i]}`);
      
      // Call tokenURI via RPC
      const response = await fetch('https://apechain.calderachain.xyz/http', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: nftContracts[i],
            data: `0xc87b56dd${tokenIds[i].padStart(64, '0')}` // tokenURI(uint256)
          }, 'latest'],
          id: 1
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.error('RPC Error:', result.error);
        continue;
      }
      
      // Decode hex result
      const hexData = result.result;
      if (hexData === '0x') {
        console.log('No tokenURI returned');
        continue;
      }
      
      // Simple hex to string conversion for tokenURI
      const tokenURI = Buffer.from(hexData.slice(130), 'hex').toString().replace(/\0/g, '');
      console.log('TokenURI:', tokenURI);
      
      // Test if it's base64 encoded
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.split(',')[1];
        const jsonString = Buffer.from(base64Data, 'base64').toString();
        const metadata = JSON.parse(jsonString);
        console.log('Decoded Metadata:', JSON.stringify(metadata, null, 2));
        
        if (metadata.image) {
          console.log('Image URL:', metadata.image);
        }
      } else if (tokenURI.startsWith('ipfs://')) {
        console.log('IPFS URL detected:', tokenURI);
        const ipfsHash = tokenURI.replace('ipfs://', '');
        const httpUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        console.log('Trying to fetch from:', httpUrl);
        
        try {
          const metadataResponse = await fetch(httpUrl);
          const metadata = await metadataResponse.json();
          console.log('IPFS Metadata:', JSON.stringify(metadata, null, 2));
        } catch (err) {
          console.error('Failed to fetch IPFS metadata:', err.message);
        }
      } else if (tokenURI.startsWith('http')) {
        console.log('HTTP URL detected:', tokenURI);
        try {
          const metadataResponse = await fetch(tokenURI);
          const metadata = await metadataResponse.json();
          console.log('HTTP Metadata:', JSON.stringify(metadata, null, 2));
        } catch (err) {
          console.error('Failed to fetch HTTP metadata:', err.message);
        }
      }
      
    } catch (error) {
      console.error(`Error with NFT ${nftContracts[i]} #${tokenIds[i]}:`, error.message);
    }
  }
}

testNFTMetadata().catch(console.error);