import React from 'react';
import { useCustomWallet } from '../hooks/useCustomWallet';
import CustomWalletModal from './CustomWalletModal';

const CustomWalletConnection: React.FC = () => {
  const { isModalOpen, openModal, closeModal, isConnected, address, disconnect } = useCustomWallet();

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-300">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={openModal}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Connect Wallet
      </button>
      
      <CustomWalletModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </>
  );
};

export default CustomWalletConnection;