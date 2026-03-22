# 🎯 Phase 2 SIMPLIFIED: Critical Duplicates Only

## ✅ COMPLETED: Wallet Components
- ✅ Removed 5 duplicate wallet components
- ✅ Updated component index exports
- ✅ `WalletConnection.tsx` is now the single wallet component

## 🔄 NEXT: Transaction Manager Consolidation

### **Current State Analysis:**
- `useOptimizedTransactionManager.ts` ✅ KEEP (most advanced)
- `useWeb3TransactionManager.ts` ❌ REMOVE (basic version)
- `useOptimizedRaffleActions.ts` 🔄 NEEDS UPDATE (uses progress system we removed)
- `useRaffleActions.ts` ❌ REMOVE (old version)
- `useCancelRaffle.ts` ❌ REMOVE (basic version)
- `useOptimizedCancelRaffle.ts` ❌ REMOVE (functionality in optimized manager)

### **Strategy: Gradual Migration**
Instead of removing everything at once, let's:

1. **Keep what works** - Don't break existing functionality
2. **Update gradually** - Fix `useOptimizedRaffleActions.ts` to work without progress
3. **Remove obvious duplicates** - Delete clearly unused files
4. **Test incrementally** - Ensure each step works

### **Phase 2A: Remove Safe Duplicates**
Files that are clearly duplicates and safe to remove:
- `useWeb3TransactionManager.ts` (basic version)
- `useRaffleActions.ts` (old version)  
- `useCancelRaffle.ts` (basic version)
- `useOptimizedCancelRaffle.ts` (functionality exists in optimized manager)

### **Phase 2B: Fix Integration Issues**
- Update `useOptimizedRaffleActions.ts` to work without progress system
- Ensure `BrowseRaffles.tsx` still works after updates

## 🎯 Immediate Actions:
1. Remove the 4 safe duplicate transaction hooks
2. Test that nothing breaks
3. Fix `useOptimizedRaffleActions.ts` progress integration
4. Commit progress

## 🚨 Safety First:
- Test after each removal
- Keep functionality intact
- Don't break existing user flows
- Commit frequently for easy rollback