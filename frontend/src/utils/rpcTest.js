console.log('Testing Alternative ApeChain RPC Endpoints...');

const RPC_ENDPOINTS = [
  'https://apechain.calderachain.xyz/http',
  'https://rpc.apechain.com'
];

const FACTORY_ADDRESS = '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff';
const CREATE_RAFFLE_DATA = '0x4b8bcb940000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000000000000012c00000000000000000000000000000000000000000000000000000000000000000a5465737420526166666c650000000000000000000000000000000000000000';

async function rpcCall(endpoint, method, params) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: method,
            params: params
        })
    });
    return response.json();
}

for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const endpoint = RPC_ENDPOINTS[i];
    console.log(`Testing endpoint ${i + 1}: ${endpoint}`);
    
    try {
        const result = await rpcCall(endpoint, 'eth_estimateGas', [{
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
            to: FACTORY_ADDRESS,
            data: CREATE_RAFFLE_DATA
        }]);
        
        const gas = parseInt(result.result, 16);
        const costUSD = (gas * 25000000000 / 1e18) * 3000;
        
        console.log(`Endpoint ${i + 1} Result:`, {
            endpoint: endpoint,
            gasHex: result.result,
            gasDecimal: gas || 'FAILED',
            costUSD: isNaN(costUSD) ? 'FAILED' : costUSD.toFixed(6),
            status: result.result ? 'SUCCESS' : 'FAILED'
        });
    } catch (error) {
        console.log(`Endpoint ${i + 1} Error:`, error.message);
    }
}

console.log('RPC Endpoint Test Complete');