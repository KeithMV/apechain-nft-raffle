/**
 * Debug script for winner selection issues
 * Run this in browser console to diagnose the problem
 */

// Check if winner selection hooks are properly initialized
console.log('🔍 [DEBUG] Checking winner selection state...');

// Check transaction manager state
const checkTransactionManager = () => {
  const txStates = [];
  
  // Look for any stuck transaction states in localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('transaction') || key.includes('winner') || key.includes('raffle')) {
      txStates.push({ key, value: localStorage.getItem(key) });
    }
  });
  
  console.log('📊 [DEBUG] Transaction states in localStorage:', txStates);
  
  // Check for any stuck processing states
  const stuckStates = txStates.filter(state => {
    try {
      const parsed = JSON.parse(state.value);
      return parsed.isProcessing || parsed.isPending;
    } catch {
      return false;
    }
  });
  
  if (stuckStates.length > 0) {
    console.log('🚨 [DEBUG] Found stuck transaction states:', stuckStates);
    return false;
  }
  
  return true;
};

// Check React Query cache for conflicts
const checkReactQueryCache = () => {
  if (window.queryClient) {
    const cache = window.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const raffleQueries = queries.filter(q => 
      q.queryKey.some(key => 
        typeof key === 'string' && 
        (key.includes('raffle') || key.includes('winner'))
      )
    );
    
    console.log('📊 [DEBUG] Raffle-related queries in cache:', raffleQueries.length);
    
    const staleQueries = raffleQueries.filter(q => q.isStale());
    console.log('📊 [DEBUG] Stale raffle queries:', staleQueries.length);
    
    return raffleQueries;
  }
  
  console.log('⚠️ [DEBUG] QueryClient not found on window');
  return [];
};

// Check for hook conflicts
const checkHookConflicts = () => {
  // Look for multiple instances of the same hook
  const hookInstances = {};
  
  // This is a simplified check - in real debugging you'd need React DevTools
  console.log('🔍 [DEBUG] Check React DevTools for multiple hook instances');
  console.log('🔍 [DEBUG] Look for duplicate useWinnerSelection or useOptimizedTransactionManager hooks');
};

// Main debug function
const debugWinnerSelection = () => {
  console.log('🚀 [DEBUG] Starting winner selection debug...');
  
  const txManagerOk = checkTransactionManager();
  const queryCache = checkReactQueryCache();
  checkHookConflicts();
  
  // Clear any stuck states
  if (!txManagerOk) {
    console.log('🧹 [DEBUG] Clearing stuck transaction states...');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('transaction') || key.includes('winner')) {
        localStorage.removeItem(key);
      }
    });
  }
  
  // Clear React Query cache if needed
  if (window.queryClient && queryCache.length > 50) {
    console.log('🧹 [DEBUG] Clearing React Query cache...');
    window.queryClient.clear();
  }
  
  console.log('✅ [DEBUG] Debug complete. Try winner selection again.');
};

// Export to window for easy access
window.debugWinnerSelection = debugWinnerSelection;

// Auto-run
debugWinnerSelection();