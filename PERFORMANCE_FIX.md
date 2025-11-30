# NFT Metadata Loading Performance Fix

## Problem
The application was experiencing repeated NFT metadata loading cycles, causing console spam and poor performance. The logs showed continuous "Loading NFT metadata for..." messages for the same NFTs.

## Root Cause Analysis
1. **Unnecessary re-renders**: NFT components were re-rendering on every parent update
2. **No request deduplication**: Multiple identical metadata requests were being made
3. **Missing memoization**: Component props were not stable, causing useEffect to re-run
4. **No proper caching**: Each render triggered new network requests

## Solution Implemented

### 1. React Query Integration
- **File**: `src/hooks/useNFTMetadata.ts`
- **Technology**: `@tanstack/react-query` (already installed)
- **Benefits**:
  - Automatic request deduplication
  - Built-in caching with configurable TTL
  - Background refetching
  - Error handling and retries

### 2. Component Memoization
- **File**: `src/components/NFTImage.tsx`
- **Change**: Wrapped component with `React.memo()`
- **Benefit**: Prevents re-renders when props haven't changed

### 3. Parent Component Optimization
- **File**: `src/components/BrowseRaffles.tsx`
- **Changes**:
  - Added `useMemo` for filtered raffles computation
  - Added `useCallback` for stable function references
  - Memoized expensive calculations

### 4. Proper Dependency Management
- **Technique**: Used stable cache keys and proper dependency arrays
- **Result**: Eliminated unnecessary effect re-runs

## Configuration Details

### React Query Settings
```typescript
queryKey: ['nft-metadata', contractAddress, tokenId]
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 10 * 60 * 1000,    // 10 minutes  
retry: 2,
retryDelay: 1000,
```

### Package Manager
- **Used**: `yarn` (as specified in package.json scripts)
- **React Query**: Already installed as `@tanstack/react-query: ^5.0.0`

## Performance Impact
- ✅ Eliminated repeated metadata requests
- ✅ Reduced console spam
- ✅ Improved user experience with instant cached responses
- ✅ Proper error handling and fallbacks
- ✅ Background updates without blocking UI

## Best Practices Applied
1. **Request deduplication** via React Query
2. **Component memoization** for expensive renders
3. **Stable references** with useCallback/useMemo
4. **Proper caching strategy** with TTL
5. **Graceful error handling** with fallbacks

## Files Modified
- `src/hooks/useNFTMetadata.ts` - React Query implementation
- `src/components/NFTImage.tsx` - Component memoization
- `src/components/BrowseRaffles.tsx` - Parent optimization

This is the **proper React solution** using established patterns and libraries, not a quick cache workaround.