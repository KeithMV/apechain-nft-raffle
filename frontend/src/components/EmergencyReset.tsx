import React from 'react';
import toast from 'react-hot-toast';

const EmergencyReset: React.FC = () => {
  const handleEmergencyReset = () => {
    console.log('🚨 EMERGENCY RESET ACTIVATED');
    
    // Clear all caches
    if ((window as any).queryClient) {
      (window as any).queryClient.clear();
      console.log('✅ Cleared React Query cache');
    }
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Cleared all storage');
    
    // Show toast and reload
    toast.success('Emergency reset complete! Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleEmergencyReset}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-sm border border-red-500"
        title="Emergency reset - clears all stuck states"
      >
        🚨 RESET
      </button>
    </div>
  );
};

export default EmergencyReset;