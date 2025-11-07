import React from 'react';
import { useAccount } from 'wagmi';
import EmergencyControls from './EmergencyControls';
import ApeTokenBalance from './ApeTokenBalance';

// Add known admin addresses here
const ADMIN_ADDRESSES: string[] = [
  '0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4', // Contract deployer wallet
  // Add additional admin wallet addresses here
];

// Validate admin addresses - use fallback for invalid configuration
const validatedAdmins = ADMIN_ADDRESSES.filter(addr => addr && typeof addr === 'string');

export default function AdminDashboard() {
  const { address } = useAccount();

  // Check if current user is admin (you can implement more sophisticated logic)
  const isAdmin = (() => {
    try {
      if (!address) return false;
      return validatedAdmins.some(adminAddr => 
        adminAddr.toLowerCase() === address.toLowerCase()
      );
    } catch (error) {
      // Return false on error checking admin status
      return false;
    }
  })();

  if (!address) {
    return (
      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-red-300 mb-4 font-mono">Admin Dashboard</h2>
        <p className="text-red-400/70 font-mono">Please connect your wallet to access admin functions</p>
      </div>
    );
  }

  // Security check - only allow authorized admin wallets
  if (!isAdmin) {
    return (
      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-red-300 mb-4 font-mono">Access Denied</h2>
        <p className="text-red-400/70 font-mono">This wallet is not authorized for admin functions</p>
        <p className="text-red-500/50 text-sm font-mono mt-2">Connected: {address}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse"></div>
        
        <div className="relative bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 px-8 py-6 border-b border-red-500/30">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 bg-gradient-to-br from-red-400 via-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-orange-500 to-red-600 rounded-xl blur-sm animate-pulse"></div>
              <span className="relative text-white text-xl">🛡️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent font-mono tracking-wider">Admin Dashboard</h2>
              <p className="text-red-200 mt-1 font-mono tracking-wide">System administration and emergency controls</p>
            </div>
          </div>
        </div>

        <div className="relative p-8 z-10 space-y-6">
          {/* Admin Info */}
          <div className="relative bg-gray-800/90 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 shadow-lg shadow-red-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5 rounded-xl blur-sm animate-pulse"></div>
            <div className="relative">
              <h3 className="text-lg font-semibold text-red-300 mb-3 font-mono">Administrator Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-red-400/70 font-mono">Connected Wallet</p>
                  <p className="text-red-200 font-mono">{address}</p>
                </div>
                <div>
                  <p className="text-red-400/70 font-mono">Access Level</p>
                  <p className="text-red-200 font-mono">System Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* APE Balance */}
          <ApeTokenBalance />

          {/* Emergency Controls */}
          <EmergencyControls />

          {/* Additional Admin Functions */}
          <div className="relative bg-gray-800/90 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 shadow-lg shadow-red-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5 rounded-xl blur-sm animate-pulse"></div>
            <div className="relative">
              <h3 className="text-lg font-semibold text-red-300 mb-3 font-mono">Additional Functions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/30 border border-red-500/20 rounded-lg">
                  <h4 className="text-red-300 font-mono font-medium mb-2">Platform Fee Management</h4>
                  <p className="text-red-400/70 text-sm font-mono mb-3">Adjust platform fee percentage</p>
                  <button className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 py-2 px-4 rounded-lg font-mono text-sm transition-colors">
                    Manage Fees
                  </button>
                </div>
                <div className="p-4 bg-black/30 border border-red-500/20 rounded-lg">
                  <h4 className="text-red-300 font-mono font-medium mb-2">Fee Withdrawal</h4>
                  <p className="text-red-400/70 text-sm font-mono mb-3">Withdraw collected platform fees</p>
                  <button className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 py-2 px-4 rounded-lg font-mono text-sm transition-colors">
                    Withdraw Fees
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}