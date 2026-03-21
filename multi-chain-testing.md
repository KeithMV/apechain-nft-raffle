# Multi-Chain Integration Testing Strategy

## Immediate Testing (Critical Path)

### 1. RPC Endpoint Validation
```bash
# Test all Polygon RPC endpoints
curl -X POST https://polygon-rpc.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

curl -X POST https://rpc.ankr.com/polygon \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 2. Rate Limit Testing
```javascript
// Browser console test
const testRateLimit = async () => {
  const promises = Array(20).fill().map((_, i) => 
    fetch('https://polygon-rpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: i
      })
    })
  );
  
  const results = await Promise.allSettled(promises);
  console.log('Rate limit test results:', results);
};
```

### 3. Contract Interaction Testing
```javascript
// Test contract calls on both chains
const testContractCalls = async () => {
  // ApeChain
  const apeResult = await publicClient.readContract({
    address: '0x1627E7e63b63878E61f91D336385a59B1747934a',
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'platformFee'
  });
  
  // Polygon
  const polygonResult = await publicClient.readContract({
    address: '0x5854AF7c836275c55469350a114F62a1609c4A42',
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'platformFee'
  });
  
  console.log({ apeResult, polygonResult });
};
```

## Comprehensive Testing Suite

### 4. Multi-Chain E2E Tests
```typescript
describe('Multi-Chain Raffle Operations', () => {
  test('should create raffle on ApeChain', async () => {
    // Switch to ApeChain
    await switchNetwork(33139);
    // Create raffle
    // Verify transaction
  });
  
  test('should create raffle on Polygon', async () => {
    // Switch to Polygon
    await switchNetwork(137);
    // Create raffle
    // Verify transaction
  });
  
  test('should handle RPC failures gracefully', async () => {
    // Mock RPC failures
    // Verify fallback behavior
  });
});
```

### 5. Performance Benchmarks
```typescript
const benchmarkChainPerformance = async () => {
  const chains = [
    { id: 33139, name: 'ApeChain' },
    { id: 137, name: 'Polygon' }
  ];
  
  for (const chain of chains) {
    const start = performance.now();
    
    // Test 10 concurrent requests
    const promises = Array(10).fill().map(() => 
      readContract({
        address: getContractAddress(chain.id),
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'raffleCounter'
      })
    );
    
    await Promise.all(promises);
    const duration = performance.now() - start;
    
    console.log(`${chain.name} performance: ${duration}ms for 10 requests`);
  }
};
```

## Monitoring & Alerts

### 6. RPC Health Monitoring
```typescript
const monitorRpcHealth = () => {
  setInterval(async () => {
    const rpcs = [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://polygon.llamarpc.com'
    ];
    
    for (const rpc of rpcs) {
      try {
        const response = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        
        if (!response.ok) {
          console.warn(`RPC ${rpc} unhealthy: ${response.status}`);
        }
      } catch (error) {
        console.error(`RPC ${rpc} failed:`, error);
      }
    }
  }, 60000); // Check every minute
};
```

## Validation Checklist

- [ ] All RPC endpoints respond within 5 seconds
- [ ] Rate limiting handled gracefully with fallbacks
- [ ] Contract addresses correct for both chains
- [ ] Transaction fees calculated properly for each chain
- [ ] Error messages are chain-specific and user-friendly
- [ ] Network switching works without page refresh
- [ ] Batch requests reduce total RPC calls by >50%
- [ ] Polling intervals prevent rate limiting
- [ ] CORS issues resolved with proper RPC selection