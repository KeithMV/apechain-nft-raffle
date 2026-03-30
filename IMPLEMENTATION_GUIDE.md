# Implementation Guide: Clean Slate Multi-Chain Architecture Migration

## Quick Reference - CLEAN SLATE APPROACH

### Why Clean Slate?
- **Faster**: 30 minutes total vs 2+ hours incremental
- **Cleaner**: No interface conflicts or cascade errors
- **Safer**: Complete system works or doesn't
- **Professional**: Clean git history and codebase

### Files to Replace
1. `frontend/src/config/addresses.ts` → `simplified-addresses.ts`
2. `frontend/src/hooks/useRaffleData.ts` → `useUnifiedRaffleData.ts`
3. Remove: `useRafflePositionsV4.ts`, `useRaffleDataFetcher.ts`
4. Update: All component imports and interfaces

## Step-by-Step Clean Slate Implementation

### Phase 1: Clean Slate Setup (5 minutes)

#### Step 1: Save Current Work
```bash
# Save any current progress
git add . && git commit -m "Save incremental migration attempt"

# Start from clean main branch
git checkout main
git pull origin main
```

#### Step 2: Remove Legacy System
```bash
# Remove old hook files completely
rm frontend/src/hooks/useRafflePositionsV4.ts
rm frontend/src/hooks/useRaffleDataFetcher.ts

# Remove old config files completely  
rm frontend/src/config/addresses.ts
rm frontend/src/config/networks.ts
```

### Phase 2: Install New Architecture (5 minutes)

#### Step 3: Install New System Files
```bash
# Copy new architecture files
cp simplified-addresses.ts frontend/src/config/addresses.ts
cp useUnifiedRaffleData.ts frontend/src/hooks/useRaffleData.ts
cp UnifiedSystemTest.tsx frontend/src/components/UnifiedSystemTest.tsx
```

#### Step 4: Update Contract Version Manager
```typescript
// Replace useContractVersionManager.ts with V4-only version
// Remove all V3/V4 branching logic
// Use simplified address configuration
```

### Phase 3: Systematic Component Migration (10 minutes)

#### Step 5: Update All Imports at Once
```bash
# Systematic find/replace across entire codebase
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useRafflePositionsV4/useRaffleData/g'
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useRaffleDataFetcher/useRaffleData/g'
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useInfiniteAllRafflesV4/useAllRaffles/g'
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useCreatedRafflesV4/useCreatedRaffles/g'
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useUserRafflePositionsV4/useParticipatedRaffles/g'
```

#### Step 6: Update Component Implementations

**BrowseRaffles.tsx:**
```typescript
// OLD
import { useInfiniteAllRafflesV4 } from '../hooks/useRafflePositionsV4';
const { raffles, loading, fetchNextPage } = useInfiniteAllRafflesV4(20);

// NEW  
import { useAllRaffles } from '../hooks/useRaffleData';
const { raffles, loading, fetchNextPage } = useAllRaffles({ infinite: true, limit: 20 });
```

**RaffleDashboard.tsx:**
```typescript
// OLD
import { useUserRafflePositionsV4, useInfiniteCreatedRafflesV4 } from '../hooks/useRafflePositionsV4';
const { positions } = useUserRafflePositionsV4();
const { raffles } = useInfiniteCreatedRafflesV4();

// NEW
import { useParticipatedRaffles, useCreatedRaffles } from '../hooks/useRaffleData';
const { raffles: positions } = useParticipatedRaffles();
const { raffles } = useCreatedRaffles(undefined, { infinite: true });
```

#### Step 7: Fix Interface Transformations
```typescript
// Transform unified data to component-specific interfaces
const transformedPosition = {
  raffleId: position.raffleId,
  raffleContract: position.raffleContract,
  nftContract: position.nftContract,
  tokenId: position.tokenId,
  userTickets: position.userTickets || 0,
  ticketsSold: position.ticketsSold,
  maxTickets: position.maxTickets,
  endTime: position.endTime,
  isWinner: position.isWinner || false,
  completed: position.completed,
  isActive: position.isActive,
};
```

### Phase 4: Testing & Validation (10 minutes)

#### Step 8: Build Validation
```bash
cd frontend
yarn build  # Should complete without errors
```

#### Step 9: Runtime Testing
```bash
yarn start
# Test all pages:
# - http://localhost:3000/browse
# - http://localhost:3000/dashboard  
# - http://localhost:3000/create
# - http://localhost:3000/test-unified
```

#### Step 10: Multi-Chain Testing
1. **Test ApeChain functionality**
2. **Switch to Polygon in wallet**
3. **Verify automatic optimization**
4. **Check RPC call reduction**

## Success Validation

### Build Success
- [ ] `yarn build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] No missing import errors

### Runtime Success  
- [ ] All pages load without errors
- [ ] Chain switching works automatically
- [ ] Data loads with new hooks
- [ ] RPC calls reduced to <15 per page

### Performance Success
- [ ] Page load time <2 seconds
- [ ] Chain-specific optimizations applied
- [ ] No console errors
- [ ] Smooth user experience

## Rollback Plan

If issues arise:
```bash
# Quick rollback to previous state
git checkout main
git reset --hard HEAD~1

# Or restore from stash
git stash pop
```

## Expected Timeline

- **Phase 1**: 5 minutes - Clean slate setup
- **Phase 2**: 5 minutes - Install new system  
- **Phase 3**: 10 minutes - Component migration
- **Phase 4**: 10 minutes - Testing & validation
- **Total**: 30 minutes for complete migration

## Final Result

**Configuration Score: 6.5/10 → 9/10**

- ✅ Single source of truth for addresses
- ✅ 3 unified hooks replace 15+ scattered hooks
- ✅ Automatic chain-specific optimizations
- ✅ Clean, maintainable codebase
- ✅ Professional multi-chain architecture

This clean slate approach delivers a complete, working system in 30 minutes with no legacy code conflicts.

## Migration Checklist

### Configuration Files
- [x] Created `simplified-addresses.ts`
- [ ] Updated imports in all components
- [ ] Removed old `addresses.ts` and `networks.ts`
- [ ] Tested chain switching

### Hook System  
- [x] Created `useUnifiedRaffleData.ts`
- [ ] Migrated `BrowseRaffles.tsx`
- [ ] Migrated `RaffleDashboard.tsx`
- [ ] Migrated `CreateRafflePage.tsx`
- [ ] Removed old hook files
- [ ] Updated all imports

### Components to Update
- [ ] `BrowseRaffles.tsx` - Use `useAllRaffles({ infinite: true })`
- [ ] `RaffleDashboard.tsx` - Use `useCreatedRaffles()` and `useParticipatedRaffles()`
- [ ] `CreateRafflePage.tsx` - Use `getFactoryAddress()`
- [ ] `RaffleCard.tsx` - Update any address imports
- [ ] `AppHeader.tsx` - Update chain detection logic

### Testing Requirements
- [ ] Test ApeChain functionality
- [ ] Test Polygon functionality  
- [ ] Test chain switching
- [ ] Test infinite scroll
- [ ] Test user-specific data
- [ ] Performance test (RPC calls < 15)
- [ ] Load time test (< 2s)

## Troubleshooting Guide

### Common Issues

#### Issue 1: "Cannot find module" errors
```typescript
// Problem: Old imports still exist
import { useAllRafflesV4 } from '../hooks/useRafflePositionsV4';

// Solution: Update to new imports
import { useAllRaffles } from '../hooks/useUnifiedRaffleData';
```

#### Issue 2: Chain switching not working
```typescript
// Problem: Not using chainId in query key
const queryKey = ['raffles', type];

// Solution: Include chainId
const queryKey = ['raffles', chainId, type];
```

#### Issue 3: Polygon rate limiting
```typescript
// Problem: Too aggressive settings
const limit = 20;
const batchSize = 5;

// Solution: Use chain-specific limits
const limit = chainId === 137 ? 5 : 20;
const batchSize = chainId === 137 ? 1 : 3;
```

### Performance Monitoring

#### Check RPC Call Count
```javascript
// Add to browser console
let rpcCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('alchemy') || args[0].includes('polygon')) {
    rpcCount++;
    console.log(`RPC Call #${rpcCount}:`, args[0]);
  }
  return originalFetch.apply(this, args);
};
```

#### Monitor Load Times
```javascript
// Add performance observer
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Load time:', entry.loadEventEnd - entry.loadEventStart);
    }
  }
});
observer.observe({ entryTypes: ['navigation'] });
```

## Success Metrics

### Before Migration
- **Hooks**: 15+ different hooks
- **RPC Calls**: 26+ per page load
- **Load Time**: ~3 seconds
- **Bundle Size**: Current size
- **Complexity**: 6.5/10

### After Migration (Target)
- **Hooks**: 3 main hooks
- **RPC Calls**: <15 per page load
- **Load Time**: <2 seconds  
- **Bundle Size**: 20% reduction
- **Complexity**: 9/10

### Validation Commands
```bash
# Check bundle size
yarn build:analyze

# Check hook count
find frontend/src/hooks -name "*.ts" | wc -l

# Check import usage
grep -r "useUnifiedRaffleData" frontend/src/ | wc -l
grep -r "useRafflePositionsV4" frontend/src/ | wc -l  # Should be 0

# Performance test
yarn start
# Open browser dev tools, check Network tab for RPC calls
```

## Emergency Rollback

If critical issues arise:

1. **Keep old files during migration**
2. **Use feature flags**:
```typescript
const USE_NEW_SYSTEM = process.env.REACT_APP_USE_NEW_HOOKS === 'true';

const { raffles } = USE_NEW_SYSTEM 
  ? useAllRaffles({ limit: 20 })
  : useAllRafflesV4(20);
```

3. **Quick revert**:
```bash
git checkout HEAD~1 -- frontend/src/hooks/
git checkout HEAD~1 -- frontend/src/config/
```

## Final Validation

Before considering migration complete:

- [ ] All components using new hooks
- [ ] No imports from old files
- [ ] RPC calls < 15 per page load
- [ ] Load time < 2 seconds
- [ ] Chain switching works smoothly
- [ ] No functionality regression
- [ ] Bundle size reduced
- [ ] Error rate < 1%

This implementation guide provides a safe, step-by-step approach to overhauling the multi-chain architecture while maintaining system stability.