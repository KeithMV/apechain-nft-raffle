// Simple cache reset utility - run this in browser console
// This clears all the problematic cache entries without adding more configuration

function resetDashboardCache() {
  console.log('🧹 Clearing dashboard cache...');
  
  // Clear localStorage debug entries
  Object.keys(localStorage)
    .filter(k => k.startsWith('dashboard-debug-'))
    .forEach(k => {
      localStorage.removeItem(k);
      console.log('Removed:', k);
    });
  
  // Clear React Query cache if available
  if (window.queryClient) {
    window.queryClient.clear();
    console.log('✅ React Query cache cleared');
  }
  
  // Clear browser cache programmatically
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log('Cleared cache:', name);
      });
    });
  }
  
  console.log('✅ Dashboard cache reset complete');
  console.log('🔄 Please refresh the page to test');
}

// Run it
resetDashboardCache();