import React from 'react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  nftContract: string;
  nativeCurrency: string;
  isApeChain: boolean;
}

const formatAddressForDisplay = (address: string): string => {
  if (!address || address.length < 18) return address;
  return address.slice(0, 10) + '...' + address.slice(-8);
};

export default function ApprovalModal({ 
  isOpen, 
  onClose, 
  onApprove, 
  nftContract, 
  nativeCurrency, 
  isApeChain 
}: ApprovalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-slate-800 border ${isApeChain ? 'border-emerald-400/30' : 'border-blue-400/30'} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="mr-2">🛡️</span>
            NFT Approval Explained
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4 text-sm">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="text-green-300 font-medium mb-2">✅ What This Approval Does:</div>
            <ul className="text-green-200 text-xs space-y-1">
              <li>• Allows raffle system to transfer your NFT when you create a raffle</li>
              <li>• Only affects NFTs from this specific contract: <span className="font-mono break-all">{formatAddressForDisplay(nftContract)}</span></li>
              <li>• Standard, secure NFT marketplace approval</li>
            </ul>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="text-red-300 font-medium mb-2">❌ What This Approval Does NOT Do:</div>
            <ul className="text-red-200 text-xs space-y-1">
              <li>• Cannot access your {nativeCurrency} tokens or other cryptocurrencies</li>
              <li>• Cannot access NFTs from other contracts</li>
              <li>• Cannot transfer anything without your explicit action</li>
              <li>• Cannot be used by anyone except the raffle system</li>
            </ul>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="text-blue-300 font-medium mb-2">🔒 Your Control:</div>
            <ul className="text-blue-200 text-xs space-y-1">
              <li>• You can revoke this approval anytime</li>
              <li>• Only you can create raffles with your NFTs</li>
              <li>• Same approval system used by OpenSea, Blur, etc.</li>
            </ul>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onApprove();
            }}
            className={`flex-1 bg-gradient-to-r ${isApeChain ? 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' : 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'} text-white py-2 px-4 rounded-lg font-medium transition-all`}
          >
            I Understand - Approve
          </button>
        </div>
      </div>
    </div>
  );
}