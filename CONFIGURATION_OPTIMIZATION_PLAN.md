# Configuration Optimization Plan - CLEAN SLATE EDITION

## Current Status: 6.5/10 - Needs Complete Overhaul

### Why Clean Slate Approach?

**Incremental Migration Problems:**
- Interface conflicts between old/new systems
- TypeScript cascade errors
- Component dependency hell
- Partial system testing complexity

**Clean Slate Benefits:**
- Complete system replacement in 30 minutes
- No legacy code conflicts
- All errors visible at once
- Cleaner final result

## Clean Slate Implementation Strategy

### Phase 1: System Replacement (Week 1)

#### A. Complete Legacy Removal
```bash
# Remove all old system files
rm frontend/src/hooks/useRafflePositionsV4.ts
rm frontend/src/hooks/useRaffleDataFetcher.ts
rm frontend/src/config/addresses.ts
rm frontend/src/config/networks.ts
```

#### B. Install New Architecture
```bash
# Install unified system
cp simplified-addresses.ts frontend/src/config/addresses.ts
cp useUnifiedRaffleData.ts frontend/src/hooks/useRaffleData.ts
```

#### C. Systematic Component Updates
- Update ALL components simultaneously
- Fix ALL interfaces together
- No incremental conflicts

#### A. Standardize Contract Addresses
```typescript
// Proposed simplified structure
const CONTRACTS = {
  33139: { // ApeChain
    factory: '0x1627E7e63b63878E61f91D336385a59B1747934a', // Use V4 as primary
    template: '0x242f56507BFd5034b369418A7C9FB1b4643710a4',
    version: 'v4',
    rateLimit: 10
  },
  137: { // Polygon
    factory: '0x5854AF7c836275c55469350a114F62a1609c4A42',
    template: '0xC7b41b9749724260B4264B90555c9417d66D655A',
    version: 'v4',
    rateLimit: 10
  }
};
```

#### B. Remove Legacy Version Support
- Deprecate V3 contract support
- Migrate all users to V4 contracts
- Simplify hook logic by removing version branching

### Phase 2: Fix RPC Management (Week 2)

#### A. Implement Proper RPC Health Monitoring
```typescript
// RPC endpoint health checker
const RPC_ENDPOINTS = {
  137: [
    { url: 'alchemy-primary', priority: 1, healthy: true },
    { url: 'polygon-rpc', priority: 2, healthy: true },
    { url: 'ankr-backup', priority: 3, healthy: true }
  ]
};
```

#### B. Implement Circuit Breaker Pattern
- Auto-failover when rate limits hit
- Exponential backoff with jitter
- Health check recovery mechanism

### Phase 3: Consolidate Hook Architecture (Week 3)

#### A. Create Single Unified Hook
```typescript
// Replace multiple hooks with one
export function useRaffleData(options: {
  type: 'all' | 'created' | 'participated';
  infinite?: boolean;
  userAddress?: string;
}) {
  // Single hook handles all raffle data fetching
}
```

#### B. Implement Proper Cache Strategy
- Unified cache keys across all hooks
- Proper invalidation timing
- Chain-specific cache durations

### Phase 4: Performance Optimization (Week 4)

#### A. Reduce API Calls
- Implement proper batching
- Use multicall for contract reads
- Cache NFT metadata aggressively

#### B. Optimize Bundle Size
- Remove unused dependencies
- Implement proper code splitting
- Optimize Wagmi configuration

## Implementation Priority

### High Priority (Fix Immediately)
1. **Polygon RPC Limits**: Implement circuit breaker
2. **Hook Consolidation**: Merge duplicate functionality
3. **Cache Invalidation**: Fix race conditions

### Medium Priority (Next Sprint)
1. **Contract Migration**: Move all to V4
2. **Bundle Optimization**: Reduce load times
3. **Error Handling**: Improve user experience

### Low Priority (Future)
1. **Monitoring**: Add performance metrics
2. **Testing**: Increase test coverage
3. **Documentation**: Update architecture docs

## Success Metrics

- **RPC Calls**: Reduce from 26 to <15 per page load
- **Load Time**: Improve from 3s to <2s
- **Error Rate**: Reduce from 5% to <1%
- **Code Complexity**: Reduce hooks from 15 to 8
- **Bundle Size**: Reduce by 20%

## Risk Assessment

### Low Risk
- Contract address consolidation
- Hook merging
- Cache optimization

### Medium Risk
- RPC endpoint changes
- Version migration
- Bundle optimization

### High Risk
- Major architecture changes
- Breaking API changes
- Database migrations

## Next Steps

1. **Week 1**: Start with contract address standardization
2. **Week 2**: Implement RPC health monitoring
3. **Week 3**: Begin hook consolidation
4. **Week 4**: Performance testing and optimization

This plan will improve the configuration score from 6.5/10 to 9/10 within one month.