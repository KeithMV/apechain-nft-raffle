/**
 * Emergency Reset Function
 * Simple function to clear all stuck states and reset the app
 */

function emergencyReset() {
  console.log('🚨 EMERGENCY RESET - Clearing all stuck states...');
  
  // 1. Clear React Query cache
  if (window.queryClient) {
    window.queryClient.clear();
    console.log('✅ Cleared React Query cache');
  }
  
  // 2. Clear localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('raffle') || key.includes('ticket') || key.includes('processing'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('✅ Removed localStorage:', key);
  });
  
  // 3. Clear sessionStorage
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('raffle') || key.includes('ticket') || key.includes('processing'))) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log('✅ Removed sessionStorage:', key);
  });
  
  // 4. Force page refresh
  console.log('🔄 Refreshing page in 2 seconds...');
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.emergencyReset = emergencyReset;
  console.log('🆘 Emergency reset function loaded!');
  console.log('Usage: window.emergencyReset()');
}