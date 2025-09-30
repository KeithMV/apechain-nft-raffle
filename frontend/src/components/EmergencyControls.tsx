import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { emergencyControls } from '../services/raffleService';
import toast from 'react-hot-toast';

export default function EmergencyControls() {
  const { address } = useAccount();
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkPauseStatus();
  }, []);

  const checkPauseStatus = async () => {
    try {
      const paused = await emergencyControls.isPaused();
      setIsPaused(paused);
    } catch (error) {
      console.error('Failed to check pause status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleEmergencyPause = async () => {
    setLoading(true);
    try {
      await emergencyControls.pause();
      setIsPaused(true);
      toast.success('🚨 Emergency pause activated');
    } catch (error: any) {
      console.error('Emergency pause failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled');
      } else if (error.message?.includes('Ownable: caller is not the owner')) {
        toast.error('Only contract owner can pause');
      } else {
        toast.error('Emergency pause failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyUnpause = async () => {
    setLoading(true);
    try {
      await emergencyControls.unpause();
      setIsPaused(false);
      toast.success('✅ Operations resumed');
    } catch (error: any) {
      console.error('Emergency unpause failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled');
      } else if (error.message?.includes('Ownable: caller is not the owner')) {
        toast.error('Only contract owner can unpause');
      } else {
        toast.error('Resume failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return null;
  }

  return (
    <div className="relative bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 shadow-lg shadow-red-500/10">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5 rounded-xl blur-sm animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            <span className="text-red-400 text-lg">🚨</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-300 font-mono">Emergency Controls</h3>
            <p className="text-red-400/70 text-sm font-mono">Owner-only security functions</p>
          </div>
        </div>

        {checkingStatus ? (
          <div className="flex items-center text-red-300/70 text-sm font-mono">
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            Checking system status...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-black/30 border border-red-500/20 rounded-lg">
              <div>
                <p className="text-red-300 font-mono font-medium">System Status</p>
                <p className="text-red-400/70 text-sm font-mono">
                  {isPaused ? 'PAUSED - All operations halted' : 'ACTIVE - Normal operations'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
            </div>

            <div className="flex space-x-3">
              {!isPaused ? (
                <button
                  onClick={handleEmergencyPause}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {loading ? (
                    <span className="relative flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Pausing...
                    </span>
                  ) : (
                    <span className="relative">🚨 EMERGENCY PAUSE</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleEmergencyUnpause}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {loading ? (
                    <span className="relative flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Resuming...
                    </span>
                  ) : (
                    <span className="relative">✅ RESUME OPERATIONS</span>
                  )}
                </button>
              )}
              
              <button
                onClick={checkPauseStatus}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              >
                🔄
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}