# Dashboard Loading Fix Plan

## 🎯 **Root Cause Analysis Complete**

After analyzing your codebase, I've identified the core issues causing inconsistent Polygon dashboard loading:

### **Primary Issues:**

1. **Cache Key Inconsistencies**
   - Different query keys between hooks and invalidation system
   - Address casing not consistently normalized
   - Chain-specific cache configurations causing conflicts

2. **Race Conditions in Data Fetching**
   - Parallel factory scanning returns results in different orders
   - No deterministic sorting causing UI flickering
   - Async operations completing at different times

3. **Network-Specific Optimizations Too Aggressive**
   - Polygon batch sizes too small (causing more requests)
   - Cache invalidation delays causing stale data
   - Different polling intervals creating timing issues

## 🔧 **Immediate Fixes Required**

### **Fix 1: Standardize Query Keys**
```typescript
// Current inconsistent keys:
['positions-v4', chainId, address?.toLowerCase()]
['created-v4', chainId, address?.toLowerCase()]

// Should be:
['user-positions', chainId, address?.toLowerCase() || 'disconnected']
['user-created', chainId, address?.toLowerCase() || 'disconnected']
```

### **Fix 2: Deterministic Data Sorting**
```typescript
// Add stable sorting to prevent UI flickering
const sortedRaffles = allCreatedRaffles.sort((a, b) => {
  // Primary: endTime (newest first)
  if (a.endTime !== b.endTime) return b.endTime - a.endTime;
  // Secondary: version (v4 first)  
  if (a.version !== b.version) return a.version === 'v4' ? -1 : 1;
  // Tertiary: raffleId (highest first)
  return b.raffleId - a.raffleId;
});
```

### **Fix 3: Unified Cache Configuration**
```typescript
// Use same cache config for both chains
const UNIFIED_CACHE_CONFIG = {
  staleTime: 20000,        // 20 seconds for both chains
  gcTime: 60000,           // 1 minute GC
  invalidationDelay: 100,  // 100ms delay for both
  maxPages: 8,             // Consistent page limit
};
```

## 🚀 **Implementation Steps**

### **Step 1: Update Hook Query Keys**
- Standardize all query keys in `useRafflePositionsV4.ts`
- Ensure consistent address normalization
- Update cache invalidation to match new keys

### **Step 2: Fix Race Conditions**
- Add deterministic sorting to all data fetching
- Implement stable sort keys
- Add loading state coordination

### **Step 3: Optimize Polygon Configuration**
- Increase batch sizes for better performance
- Reduce cache invalidation delays
- Align polling intervals

### **Step 4: Add Debug Monitoring**
- Enhanced logging for cache hits/misses
- Network request monitoring
- State comparison tools

## 📊 **Expected Results**

After implementing these fixes:
- ✅ Consistent data loading across both chains
- ✅ Eliminated UI flickering and race conditions  
- ✅ Improved performance on Polygon
- ✅ Better debugging capabilities
- ✅ Unified caching behavior

## 🛠️ **Debug Tools Available**

I've created `DASHBOARD_DEBUG_SCRIPT.js` with tools to:
- Monitor real-time dashboard state
- Compare states between network switches
- Clear problematic cache entries
- Test contract calls directly
- Generate diagnostic reports

## 🎯 **Next Steps**

1. **Run the debug script** to capture current state
2. **Apply the fixes** in order of priority
3. **Test on both networks** to verify consistency
4. **Monitor performance** improvements

Would you like me to implement these fixes step by step?