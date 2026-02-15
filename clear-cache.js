// Add this to your browser console to clear all caches
console.log('🧹 Clearing all caches...');

// Clear localStorage
localStorage.clear();

// Clear sessionStorage  
sessionStorage.clear();

// Clear wagmi cache
if (window.localStorage.getItem('wagmi.cache')) {
  window.localStorage.removeItem('wagmi.cache');
}

// Clear any other wagmi keys
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('wagmi.')) {
    localStorage.removeItem(key);
  }
});

console.log('✅ All caches cleared. Please refresh the page.');

// Force page refresh
window.location.reload();