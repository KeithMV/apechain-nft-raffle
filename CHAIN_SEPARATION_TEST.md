# Chain Separation Validation Test

## Test Overview
This document outlines the validation tests for our chain separation implementation to ensure no cross-chain data bleeding occurs.

## Test Scenarios

### 1. Browse Page Chain Filtering ✅ **PRIMARY TEST**
**Issue**: Browse page shows Polygon raffles when ApeChain is selected
**Expected**: Only raffles from selected chain should appear

**Test Steps**:
1. Navigate to Browse page
2. Select ApeChain network
3. Verify only ApeChain raffles appear
4. Switch to Polygon network  
5. Verify only Polygon raffles appear
6. Switch back to ApeChain
7. Verify data refreshes and shows only ApeChain raffles

### 2. Dashboard Chain Isolation
**Test Steps**:
1. Connect wallet and navigate to Dashboard
2. Switch between ApeChain and Polygon
3. Verify "My Raffles" section shows only raffles from current chain
4. Verify "My Positions" section shows only positions from current chain
5. Check that raffle counts are chain-specific

### 3. NFT Selection Chain Awareness
**Test Steps**:
1. Navigate to Create Raffle page
2. Switch between chains
3. Verify NFT grid shows only NFTs from current chain
4. Verify no cross-chain NFTs appear in selection

### 4. Cache Invalidation Chain Separation
**Test Steps**:
1. Load raffles on ApeChain
2. Switch to Polygon and load raffles
3. Switch back to ApeChain
4. Verify ApeChain data is still cached (fast load)
5. Verify no Polygon data appears

### 5. Real-time Updates Chain Isolation
**Test Steps**:
1. Have two browser tabs open
2. Tab 1: ApeChain selected
3. Tab 2: Polygon selected  
4. Create a raffle on ApeChain
5. Verify Tab 1 updates with new raffle
6. Verify Tab 2 (Polygon) does not show ApeChain raffle

## Technical Validation

### Query Key Analysis ✅ **COMPLETED**
All React Query keys properly include `chainId`:
- `['raffles-v4', chainId, limit, offset]`
- `['positions-v4', userAddress, chainId]`
- `['created-v4', chainId, userAddress, page]`
- `['user-nfts', userAddress?.toLowerCase(), chainId]`
- `['nft-metadata', nftContract, tokenId, chainId]`

### Component Chain Awareness ✅ **COMPLETED**
- `AppRoutes.tsx`: Uses `key={chainId}` for component remounting
- All major components use `useChainId()` hook
- Network switcher properly triggers chain changes

### Cache System Chain Separation ✅ **COMPLETED**
- `useUnifiedCacheInvalidation` includes `chainId` in all operations
- localStorage clearing is chain-aware
- React Query invalidation targets specific chains

## Expected Results

### ✅ **PASS Criteria**:
- No cross-chain data appears in any component
- Chain switching triggers proper data refresh
- Cache systems maintain chain isolation
- Performance remains optimal with proper caching

### ❌ **FAIL Criteria**:
- Polygon raffles appear when ApeChain selected
- Cross-chain NFTs show in create raffle
- Cache data bleeds between chains
- Chain switching doesn't refresh data

## Implementation Status

### Phase 1: Core Data Hooks ✅ **COMPLETED**
- Fixed `useCreatedRafflesV4` and `useAllRafflesV4` query keys
- Made `useUnifiedCacheInvalidation` chain-aware

### Phase 2: Component Chain Awareness ✅ **COMPLETED**  
- Reviewed all major components (already chain-aware)
- Fixed `useNFTMetadata` hook
- Confirmed `AppRoutes.tsx` perfect implementation

### Phase 3: Remaining Data Hooks ✅ **COMPLETED**
- All remaining hooks already chain-aware
- No additional fixes needed

### Phase 4: Testing & Validation 🎯 **IN PROGRESS**
- Build successful ✅
- Ready for manual testing

## Manual Testing Checklist

- [ ] Browse page chain filtering works correctly
- [ ] Dashboard shows only current chain data  
- [ ] NFT selection respects chain context
- [ ] Cache invalidation is chain-isolated
- [ ] Real-time updates don't cross chains
- [ ] Performance remains optimal
- [ ] No console errors during chain switching

## Notes
- Original issue: "Browse page shows Polygon raffles when ApeChain is selected"
- Root cause: Missing `chainId` in React Query cache keys
- Solution: Systematic addition of `chainId` to all relevant query keys
- Architecture: Already well-designed, minimal fixes needed