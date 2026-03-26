# Polygon Configuration Audit - Complete Inventory

## Phase 1: Configuration Files Analysis

### ✅ ACTIVE CONFIGURATIONS (Currently Used)
1. **wagmiUnified.ts** - PRIMARY CONFIG
   - Used by: AppProviders.tsx
   - Polygon RPC Priority: matic.network → llamarpc → ankr → alchemy → quiknode
   - Batch Size: 150KB
   - Polling: 8000ms
   - Status: ✅ ACTIVE

### ❌ ORPHANED CONFIGURATIONS (Not Used)
1. **adaptiveWagmi.ts** - ORPHANED
   - Used by: NONE
   - Has Web3Modal creation (conflicts with AppProviders)
   - Different RPC priority order
   - Status: ❌ REMOVE CANDIDATE

2. **rpcManager.ts** - ORPHANED  
   - Used by: NONE
   - Separate RPC management system
   - Different client creation
   - Status: ❌ REMOVE CANDIDATE

3. **mobileSafeWagmi.ts** - ORPHANED
   - Used by: NONE
   - Mobile-specific configuration
   - Status: ❌ REMOVE CANDIDATE

4. **mobileWagmi.ts** - ORPHANED
   - Used by: NONE
   - Another mobile configuration
   - Status: ❌ REMOVE CANDIDATE

## Phase 2: Polygon-Specific Settings Inventory

### Chain Detection Patterns (15+ locations)
- `chainId === 137` - Direct comparison
- `isPolygon` - Boolean flag from NetworkContext
- Inconsistent timeout values: 25000ms, 30000ms, 45000ms
- Inconsistent batch sizes: 2, 3, 5
- Inconsistent delays: 10ms, 20ms, 25ms

### RPC Endpoint Conflicts
**Current Active (wagmiUnified.ts):**
- Priority 1: rpc-mainnet.matic.network ✅
- Priority 2: polygon.llamarpc.com ✅  
- Priority 3: rpc.ankr.com/polygon ✅
- Priority 4: alchemy (if API key) ✅
- Priority 5: quiknode ✅

**Orphaned Configs Have Different Orders:**
- adaptiveWagmi: polygon-rpc.com (BROKEN) → ankr → llamarpc
- rpcManager: alchemy → ankr → llamarpc

### Timeout/Performance Settings Conflicts
**React Query Stale Times:**
- useRafflePositionsV4: 45000ms (Polygon) vs 30000ms (ApeChain)
- useUserRafflePositionsV4: 25000ms (Polygon) vs 15000ms (ApeChain)
- useInfiniteCreatedRafflesV4: 45000ms (Polygon) vs 30000ms (ApeChain)

**Batch Processing:**
- useRaffleDataFetcher: batchSize 5 (Polygon) vs 3 (ApeChain)
- useRaffleDataFetcher: delay 20ms (Polygon) vs 10ms (ApeChain)

**Transaction Timeouts:**
- transactionQueryClient: +20% longer for Polygon
- useUserNFTs: 25000ms (Polygon) vs 15000ms (ApeChain)

## Phase 3: Optimization Opportunities

### ✅ GOOD PRACTICES FOUND
- Centralized chain detection in NetworkContext
- Consistent use of wagmiUnified.ts
- Chain-specific optimizations in hooks
- Progressive refetch for Polygon winner selection

### ⚠️ INCONSISTENCIES TO FIX
- Multiple timeout values for same operations
- Scattered chain detection logic
- Orphaned configuration files
- Some hardcoded chainId === 137 checks

### 🎯 OPTIMIZATION TARGETS
- Consolidate all Polygon timeouts to single source
- Remove orphaned configuration files
- Centralize chain-specific constants
- Standardize batch processing settings

## Phase 4: Risk Assessment

### LOW RISK CHANGES
- Remove orphaned config files (not imported anywhere)
- Consolidate timeout constants
- Standardize batch sizes

### MEDIUM RISK CHANGES  
- Centralize chain detection logic
- Optimize RPC endpoint order

### HIGH RISK CHANGES
- Modify core wagmi configuration
- Change transaction timeout logic

## Recommendations

### Immediate (Low Risk)
1. Remove orphaned config files
2. Create Polygon constants file
3. Consolidate timeout values

### Short Term (Medium Risk)
1. Centralize chain-specific settings
2. Optimize batch processing
3. Standardize polling intervals

### Long Term (High Risk)
1. Advanced RPC management
2. Dynamic timeout adjustment
3. Performance monitoring integration