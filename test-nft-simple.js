// Simple test without hardhat
async function testNFT() {
  const nftContract = '0x6794aE7a2996f898332d0257B1EbCd8177AD58Da';
  const tokenId = '6790';
  
  // Try to call tokenURI directly via RPC
  const rpcUrl = 'https://apechain.calderachain.xyz/http';
  
  // ERC721 tokenURI function selector: 0xc87b56dd
  const data = '0xc87b56dd' + tokenId.toString(16).padStart(64, '0');
  
  const payload = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{
      to: nftContract,
      data: data
    }, 'latest'],
    id: 1
  };
  
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('RPC Response:', result);
    
    if (result.result && result.result !== '0x') {
      // Decode the hex result
      const hex = result.result.slice(2);
      const decoded = Buffer.from(hex, 'hex').toString();
      console.log('Decoded result:', decoded);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testNFT();