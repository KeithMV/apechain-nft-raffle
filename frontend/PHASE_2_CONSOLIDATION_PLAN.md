# 🔧 Phase 2: Component Consolidation Plan

## 🎯 GOAL: Remove duplicates, keep best implementations

## 📊 DUPLICATION ANALYSIS

### **🔌 Wallet Connection Components (5 duplicates!)**
**KEEP**: `WalletConnection.tsx` (most comprehensive, has mobile diagnostics)
**REMOVE**:
- `CustomWalletConnection.tsx` ❌
- `MobileFriendlyWalletConnection.tsx` ❌  
- `MobileOptimizedWalletConnection.tsx` ❌
- `MobileWalletConnect.tsx` ❌
- `CustomWalletModal.tsx` ❌

**Reason**: `WalletConnection.tsx` has the best mobile detection, diagnostics, and error handling.

### **⚡ Transaction Management Hooks (6 duplicates!)**
**KEEP**: `useOptimizedTransactionManager.ts` (most advanced, has optimistic updates)
**REMOVE**:
- `useWeb3TransactionManager.ts` ❌ (basic version)
- `useRaffleActions.ts` ❌ (if overlaps)
- `useOptimizedRaffleActions.ts` ❌ (if overlaps)
- `useCancelRaffle.ts` ❌ (replaced by optimized version)
- `useOptimizedCancelRaffle.ts` ❌ (already in optimized manager)

**Reason**: `useOptimizedTransactionManager.ts` has optimistic updates, progressive timeouts, and specialized hooks.

### **💾 Cache Management Hooks (3 duplicates!)**
**KEEP**: `useCacheInvalidation.ts` (if it's the most comprehensive)
**ANALYZE**: Need to check which has best functionality
**POTENTIALLY REMOVE**:
- `useRaffleCacheManager.ts` ❌
- `useAutoRefresh.ts` ❌

### **🔍 Mobile Connection Hooks**
**KEEP**: `useMobileConnectionManager.ts` (used by WalletConnection.tsx)
**REMOVE**: Any other mobile connection hooks

## 📋 CONSOLIDATION STEPS

### **Step 1: Remove Duplicate Wallet Components**
1. Update any imports pointing to removed components
2. Delete the 5 duplicate wallet components
3. Ensure `WalletConnection.tsx` is used everywhere

### **Step 2: Consolidate Transaction Managers**
1. Check which components use old transaction hooks
2. Update them to use `useOptimizedTransactionManager.ts`
3. Remove old transaction manager files

### **Step 3: Unify Cache Management**
1. Analyze cache management hooks
2. Keep the best one, remove others
3. Update imports across codebase

### **Step 4: Clean Up Mobile Hooks**
1. Keep `useMobileConnectionManager.ts`
2. Remove any other mobile-specific hooks that duplicate functionality

## 🎯 SUCCESS METRICS
- [ ] Wallet components: 5 → 1 (80% reduction)
- [ ] Transaction hooks: 6 → 1 (83% reduction)  
- [ ] Cache hooks: 3 → 1 (67% reduction)
- [ ] All functionality preserved
- [ ] No broken imports
- [ ] Bundle size reduced

## 🚨 SAFETY CHECKS
- [ ] Test wallet connection after each removal
- [ ] Test transaction flows after hook consolidation
- [ ] Verify cache invalidation still works
- [ ] Check mobile functionality remains intact

## 📁 FILES TO MODIFY
**Components using old wallet components**: Need to find and update
**Hooks using old transaction managers**: Need to find and update
**Any imports of removed files**: Need to update

## 🔄 ROLLBACK PLAN
If anything breaks:
1. Git revert specific commits
2. Restore removed files temporarily
3. Fix imports gradually
4. Re-attempt consolidation

---
**Next Action**: Start with wallet component consolidation (safest first)