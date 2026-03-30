# Multi-Chain Architecture Overhaul Documentation - CLEAN SLATE APPROACH

## Overview
This document outlines the **clean slate migration** of the NFT Raffle Platform's multi-chain architecture, moving from a complex V3/V4 system to a unified, simplified approach using a complete system replacement strategy.

## Why Clean Slate Approach?

### Problems with Incremental Migration
- **Interface Conflicts**: Old components expect different data structures
- **TypeScript Cascade Errors**: Fixing one issue creates three more
- **Dependency Hell**: Components are tightly coupled to old system
- **Testing Complexity**: Hard to validate partial migrations

### Clean Slate Benefits
- **No Interface Mismatches**: Everything designed together
- **No Cascade Errors**: All TypeScript issues visible at once
- **Easier Testing**: Complete system works or doesn't
- **Cleaner Result**: No legacy code remnants
- **Faster Overall**: Less debugging, more building

## Current Problems (Score: 6.5/10)

### Critical Issues
1. **Over-Complex Configuration**: Multiple contract versions (V3/V4) causing confusion
2. **RPC Rate Limiting**: Polygon hitting Alchemy limits despite emergency fixes
3. **Code Duplication**: 15+ hooks doing similar things
4. **Inconsistent Patterns**: Mixed caching strategies between chains
5. **Maintenance Burden**: Complex fallback logic and version branching

### Current Architecture Problems
```typescript
// PROBLEM: Complex multi-version management
const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  33139: { // ApeChain
    RAFFLE_FACTORY: '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff', // v3
    RAFFLE_FACTORY_V4: '0x1627E7e63b63878E61f91D336385a59B1747934a', // v4
    RAFFLE_FACTORY_LEGACY: '0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900', // v2
    RAFFLE_FACTORY_V1: '0x05139110Db8FF9cF82A836Af95eff4530011c705' // v1
  }
};

// PROBLEM: Multiple hooks doing similar things
useAllRafflesV4()
useInfiniteAllRafflesV4()
useCreatedRafflesV4()
useInfiniteCreatedRafflesV4()
useUserRafflePositionsV4()
// ... 10+ more hooks
```

## Migration Strategy: Clean Slate Replacement

### Phase 1: Preparation (5 minutes)
1. **Save Current Work**
   ```bash
   git add . && git commit -m "Save incremental migration attempt"
   git checkout main  # Start from clean working state
   ```

2. **Remove Legacy System**
   ```bash
   # Remove old hook files
   rm frontend/src/hooks/useRafflePositionsV4.ts
   rm frontend/src/hooks/useRaffleDataFetcher.ts
   
   # Remove old config files
   rm frontend/src/config/addresses.ts
   rm frontend/src/config/networks.ts
   ```

### Phase 2: Install New System (5 minutes)
1. **Install New Architecture**
   ```bash
   # Copy new files into place
   cp simplified-addresses.ts frontend/src/config/addresses.ts
   cp useUnifiedRaffleData.ts frontend/src/hooks/useRaffleData.ts
   ```

2. **Update Contract Version Manager**
   - Replace with simplified V4-only version
   - Remove all V3/V4 branching logic

### Phase 3: Component Migration (10 minutes)
1. **Systematic Import Updates**
   ```bash
   # Update all imports at once
   find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useRafflePositionsV4/useRaffleData/g'
   find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useRaffleDataFetcher/useRaffleData/g'
   ```

2. **Component Updates**
   - `BrowseRaffles.tsx`: Replace with `useAllRaffles({ infinite: true })`
   - `RaffleDashboard.tsx`: Replace with `useCreatedRaffles()` and `useParticipatedRaffles()`
   - Update all interface references

### Phase 4: Interface Standardization (5 minutes)
1. **Unified Data Interface**
   ```typescript
   interface RaffleData {
     raffleId: number;
     raffleContract: string;
     nftContract: string;
     tokenId: string;
     creator: string;
     ticketPrice: string;
     maxTickets: number;
     ticketsSold: number;
     endTime: number;
     winner?: string;
     completed: boolean;
     isActive: boolean;
     userTickets?: number;
     isWinner?: boolean;
   }
   ```

2. **Component Interface Updates**
   - Transform data at component boundaries
   - Ensure type safety throughout

### Phase 5: Testing & Validation (5 minutes)
1. **Build Validation**
   ```bash
   cd frontend && yarn build
   ```

2. **Runtime Testing**
   ```bash
   yarn start
   # Test all pages: /browse, /dashboard, /create, /test-unified
   ```

**File**: `frontend/src/config/simplified-addresses.ts`

```typescript
export interface ChainConfig {
  chainId: number;
  name: string;
  factory: string;        // Single factory address (V4 only)
  template: string;       // Single template address
  version: 'v4';         // Always V4
  rateLimit: number;     // Rate limit in seconds
  rpcUrl: string;        // Primary RPC URL
  explorerUrl: string;   // Block explorer
  nativeCurrency: string; // Native token symbol
}

// SOLUTION: Single source of truth for both chains
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  33139: { // ApeChain - Primary chain
    chainId: 33139,
    name: 'ApeChain',
    factory: '0x1627E7e63b63878E61f91D336385a59B1747934a', // V4 only
    template: '0x242f56507BFd5034b369418A7C9FB1b4643710a4',
    version: 'v4',
    rateLimit: 10,
    rpcUrl: 'https://apechain.calderachain.xyz/http',
    explorerUrl: 'https://apescan.io',
    nativeCurrency: 'APE'
  },
  137: { // Polygon - Secondary chain
    chainId: 137,
    name: 'Polygon',
    factory: '0x5854AF7c836275c55469350a114F62a1609c4A42', // V4 only
    template: '0xC7b41b9749724260B4264B90555c9417d66D655A',
    version: 'v4',
    rateLimit: 10,
    rpcUrl: process.env.REACT_APP_ALCHEMY_API_KEY 
      ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`
      : 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'POL'
  }
};

// Helper functions
export function getChainConfig(chainId?: number): ChainConfig;
export function getFactoryAddress(chainId?: number): string;
export function getTemplateAddress(chainId?: number): string;
export function isSupportedChain(chainId: number): boolean;
export function getSupportedChains(): number[];
```

### 2. Unified Raffle Data Hook

**File**: `frontend/src/hooks/useUnifiedRaffleData.ts`

```typescript
export interface RaffleData {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  creator: string;
  ticketPrice: string;
  maxTickets: number;
  ticketsSold: number;
  endTime: number;
  winner?: string;
  completed: boolean;
  isActive: boolean;
  userTickets?: number; // Only populated when relevant
}

export interface UseRaffleDataOptions {
  type: 'all' | 'created' | 'participated';
  infinite?: boolean;
  limit?: number;
  userAddress?: string;
}

// SOLUTION: Single hook replaces 15+ hooks
export function useRaffleData(options: UseRaffleDataOptions) {
  // Automatic chain detection
  const chainId = useChainId();
  const chainConfig = getChainConfig(chainId);
  
  // Chain-specific optimizations
  const optimizedLimit = chainId === 137 ? Math.min(limit, 5) : limit;
  
  // Chain-specific cache settings
  const cacheConfig = {
    staleTime: chainId === 137 ? 25000 : 30000,
    gcTime: chainId === 137 ? 5 * 60 * 1000 : 10 * 60 * 1000,
    retry: chainId === 137 ? 0 : 1,
    retryDelay: chainId === 137 ? 10000 : 2000,
  };
  
  // Chain-specific batch processing
  const batchSize = chainId === 137 ? 1 : 3;
  const delay = chainId === 137 ? 1000 : 100;
  
  // Single fetch function handles all scenarios
  // Returns appropriate query (infinite or regular)
}

// Convenience hooks
export const useAllRaffles = (options?) => useRaffleData({ ...options, type: 'all' });
export const useCreatedRaffles = (userAddress?, options?) => useRaffleData({ ...options, type: 'created', userAddress });
export const useParticipatedRaffles = (userAddress?, options?) => useRaffleData({ ...options, type: 'participated', userAddress });
```

## Chain-Specific Optimizations

### ApeChain (Primary Chain)
- **Performance**: Fast, reliable RPC
- **Batch Size**: 3 contracts at once
- **Delay**: 100ms between batches
- **Retries**: 1 retry on failure
- **Cache**: 30s stale time, 10min GC time
- **Limit**: Full limit (20 raffles)

### Polygon (Secondary Chain)
- **Performance**: Rate-limited, slower RPC
- **Batch Size**: 1 contract at a time (sequential)
- **Delay**: 1000ms between batches
- **Retries**: 0 retries (prevent spam)
- **Cache**: 25s stale time, 5min GC time
- **Limit**: Reduced limit (5 raffles max)

## Migration Strategy

### Phase 1: Create New Files (Week 1)
1. Create `simplified-addresses.ts`
2. Create `useUnifiedRaffleData.ts`
3. Test both files in isolation

### Phase 2: Gradual Migration (Week 2)
```typescript
// Replace existing hooks one by one
// OLD
const { raffles } = useAllRafflesV4(20);
// NEW
const { raffles } = useAllRaffles({ limit: 20 });

// OLD
const { raffles } = useInfiniteAllRafflesV4(15);
// NEW
const { raffles } = useAllRaffles({ infinite: true, limit: 15 });

// OLD
const { raffles } = useCreatedRafflesV4(userAddress);
// NEW
const { raffles } = useCreatedRaffles(userAddress);

// OLD
const { positions } = useUserRafflePositionsV4(userAddress);
// NEW
const { raffles } = useParticipatedRaffles(userAddress);
```

### Phase 3: Remove Legacy Code (Week 3)
1. Remove old hooks: `useRafflePositionsV4.ts`, `useRaffleDataFetcher.ts`
2. Remove complex address management: `addresses.ts`, `networks.ts`
3. Update all components to use new hooks

### Phase 4: Optimization (Week 4)
1. Bundle size optimization
2. Performance testing
3. Error handling improvements

## Expected Improvements

### Performance Metrics
- **RPC Calls**: 26 → <15 per page load
- **Load Time**: 3s → <2s
- **Error Rate**: 5% → <1%
- **Bundle Size**: Reduce by 20%

### Code Quality Metrics
- **Hooks**: 15+ → 3 main hooks
- **Configuration Files**: 4 → 1
- **Lines of Code**: Reduce by 30%
- **Complexity Score**: 6.5/10 → 9/10

## Multi-Chain Behavior Examples

### Scenario 1: User on ApeChain
```typescript
// chainId = 33139
// Uses factory: '0x1627E7e63b63878E61f91D336385a59B1747934a'
// Settings: limit=20, batchSize=3, delay=100ms, retry=1
// Cache: 30s stale, 10min GC
```

### Scenario 2: User on Polygon
```typescript
// chainId = 137
// Uses factory: '0x5854AF7c836275c55469350a114F62a1609c4A42'
// Settings: limit=5, batchSize=1, delay=1000ms, retry=0
// Cache: 25s stale, 5min GC
```

### Scenario 3: Chain Switch
```typescript
// User switches ApeChain → Polygon
// 1. useChainId() detects: 33139 → 137
// 2. queryKey changes, triggers refetch
// 3. Polygon config applied automatically
// 4. Data refetched from Polygon contracts
// 5. UI updates with Polygon raffles
```

## Implementation Checklist

### Files to Create
- [ ] `frontend/src/config/simplified-addresses.ts`
- [ ] `frontend/src/hooks/useUnifiedRaffleData.ts`
- [ ] `CONFIGURATION_OPTIMIZATION_PLAN.md` (created)
- [ ] This documentation file

### Files to Update
- [ ] `frontend/src/components/BrowseRaffles.tsx`
- [ ] `frontend/src/components/RaffleDashboard.tsx`
- [ ] `frontend/src/components/CreateRafflePage.tsx`
- [ ] All components using old hooks

### Files to Remove (After Migration)
- [ ] `frontend/src/config/addresses.ts`
- [ ] `frontend/src/config/networks.ts`
- [ ] `frontend/src/hooks/useRafflePositionsV4.ts`
- [ ] `frontend/src/hooks/useRaffleDataFetcher.ts`
- [ ] Other legacy hooks

### Testing Requirements
- [ ] Test chain switching functionality
- [ ] Test rate limiting on Polygon
- [ ] Test infinite scroll on both chains
- [ ] Test user-specific data (created/participated)
- [ ] Performance testing with reduced RPC calls

## Risk Assessment

### Low Risk
- Creating new configuration files
- Adding new hooks alongside existing ones
- Chain-specific optimizations

### Medium Risk
- Migrating components to new hooks
- Removing legacy code
- Bundle optimization changes

### High Risk
- Breaking changes to existing APIs
- Major architectural changes
- Database/contract migrations

## Rollback Plan

If issues arise:
1. Keep old hooks until migration complete
2. Feature flags for new vs old system
3. Gradual rollout per component
4. Monitor error rates and performance
5. Quick revert capability

## Success Criteria

### Technical
- [ ] All 15+ hooks replaced with 3 unified hooks
- [ ] RPC calls reduced to <15 per page load
- [ ] Load time improved to <2s
- [ ] Error rate reduced to <1%
- [ ] Bundle size reduced by 20%

### User Experience
- [ ] Seamless chain switching
- [ ] Faster page loads
- [ ] Fewer loading states
- [ ] Consistent behavior across chains
- [ ] No functionality regression

### Maintainability
- [ ] Single source of truth for addresses
- [ ] Consistent patterns across codebase
- [ ] Simplified debugging
- [ ] Easier to add new chains
- [ ] Reduced technical debt

## Next Steps

1. **Immediate**: Review this documentation
2. **Week 1**: Implement new configuration and hook files
3. **Week 2**: Begin component migration
4. **Week 3**: Remove legacy code
5. **Week 4**: Performance optimization and testing

This overhaul will transform the platform from a complex, hard-to-maintain system into a clean, efficient multi-chain architecture that can easily scale to additional chains in the future.